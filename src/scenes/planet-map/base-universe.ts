import Phaser from 'phaser';
import type { PlanetData } from './planet-data';
import { GameStatus } from '../../logic/game-status';

export abstract class BaseUniverse {
    public abstract readonly id: string;
    public abstract readonly name: string;
    public readonly backgroundTexture: string = 'nebula';

    // Derived classes must implement this to provide the initial planet configuration
    protected abstract getPlanets(scene: Phaser.Scene, width: number, height: number): PlanetData[];

    protected planets: PlanetData[] = [];

    constructor() { }

    public init(scene: Phaser.Scene, width: number, height: number) {
        // Cleanup existing if any (though typically we create a new Universe instance)
        this.cleanup();

        // Load raw planets from subclass implementation
        this.planets = this.getPlanets(scene, width, height);

        // Sync with GameStatus
        const gameStatus = GameStatus.getInstance();
        this.planets.forEach(p => {
            if (gameStatus.isPlanetRevealed(p.id)) {
                p.hidden = false;
            }
        });

        this.layoutPlanets(width, height);
    }

    public cleanup() {
        if (this.planets.length > 0) {
            this.planets.forEach(p => {
                p.gameObject?.destroy();
                p.overlayGameObject?.destroy();
                p.emitter?.destroy();
                p.effects?.forEach(e => e.destroy?.());
            });
        }
        this.planets = [];
    }

    public getAll(): PlanetData[] {
        return this.planets;
    }

    public getById(id: string): PlanetData | undefined {
        return this.planets.find(p => p.id === id);
    }

    public updatePositions(width: number, height: number) {
        const cx = width / 2;
        const cy = height / 2;

        // Recalculate limits based on new size
        const PLANET_RADIUS = 40;
        const BORDER_PADDING = 20;
        const EARTH_GAP = 20;

        const innerLimit = PLANET_RADIUS + EARTH_GAP + PLANET_RADIUS;
        const minDim = Math.min(width, height);
        const outerLimit = (minDim / 2) - (PLANET_RADIUS + BORDER_PADDING);
        const effectiveOuterLimit = Math.max(innerLimit + 10, outerLimit);
        const bandWidth = effectiveOuterLimit - innerLimit;

        this.planets.forEach(p => {
            if (p.centralPlanet) {
                this.setPlanetPosition(p, cx, cy);
            } else {
                const angle = p.orbitAngle ?? 0;
                // Default to middle of band if undefined
                const rFactor = p.orbitRadius ?? 0.5;

                const radius = innerLimit + (rFactor * bandWidth);

                const px = cx + Math.cos(angle) * radius;
                const py = cy + Math.sin(angle) * radius;
                this.setPlanetPosition(p, px, py);
            }
        });
    }

    private layoutPlanets(width: number, height: number) {
        const cx = width / 2;
        const cy = height / 2;
        const gameStatus = GameStatus.getInstance();

        // Constants for layout
        // Planet radius approx 30px visual, plus padding.
        const PLANET_RADIUS = 40;
        const BORDER_PADDING = 20;
        const EARTH_GAP = 20;

        // Inner limit: Earth Radius + Gap + Planet Radius
        const innerLimit = PLANET_RADIUS + EARTH_GAP + PLANET_RADIUS;

        // Outer limit: Min Screen Dimension / 2 - (Planet Radius + Border Padding)
        const minDim = Math.min(width, height);
        const outerLimit = (minDim / 2) - (PLANET_RADIUS + BORDER_PADDING);

        // Sanity check: if screen is too small, clamp outerLimit to innerLimit + tiny offset
        const effectiveOuterLimit = Math.max(innerLimit + 10, outerLimit);

        const satellites = this.planets.filter(p => !p.centralPlanet);

        if (satellites.length === 0) {
            // Even if no satellites, ensure central planets are positioned
            this.planets.forEach(p => {
                if (p.centralPlanet) {
                    this.setPlanetPosition(p, cx, cy);
                }
            });
            return;
        }

        const satellitesCount = satellites.length;
        const angleStep = (Math.PI * 2) / satellitesCount;
        const startAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

        let satelliteIndex = 0;

        this.planets.forEach(p => {
            if (p.centralPlanet) {
                this.setPlanetPosition(p, cx, cy);
                return; // Keep center anchored
            }

            // Check if we have a saved position for this planet
            const savedPosition = gameStatus.getPlanetPosition(this.id, p.id);

            if (savedPosition !== undefined) {
                // Use saved position
                p.orbitAngle = savedPosition.orbitAngle;
                p.orbitRadius = savedPosition.orbitRadius;
            } else {
                // Generate new random position
                const angle = startAngle + (satelliteIndex * angleStep);
                const bandWidth = effectiveOuterLimit - innerLimit;
                const rawRadius = Phaser.Math.FloatBetween(innerLimit, effectiveOuterLimit);
                const factor = (rawRadius - innerLimit) / bandWidth;

                p.orbitAngle = angle;
                p.orbitRadius = factor;

                // Save the new position
                gameStatus.setPlanetPosition(this.id, p.id, {
                    orbitAngle: p.orbitAngle,
                    orbitRadius: p.orbitRadius
                });
            }

            satelliteIndex++;

            const bandWidth = effectiveOuterLimit - innerLimit;
            const actualRadius = innerLimit + (p.orbitRadius * bandWidth);
            const px = cx + Math.cos(p.orbitAngle) * actualRadius;
            const py = cy + Math.sin(p.orbitAngle) * actualRadius;

            this.setPlanetPosition(p, px, py);
        });
    }

    private setPlanetPosition(planet: PlanetData, x: number, y: number) {
        planet.x = x;
        planet.y = y;
        if (planet.gameObject) {
            planet.gameObject.setPosition(x, y);
            if (planet.overlayGameObject) planet.overlayGameObject.setPosition(x, y);
        }
    }

    public findNearestNeighbor(currentId: string, dx: number, dy: number): PlanetData | null {
        const currentPlanet = this.getById(currentId);
        if (!currentPlanet) return null;

        const others = this.planets.filter(p => p.id !== currentId);

        // Filter candidates by direction
        let candidates: PlanetData[] = [];
        if (dx < 0) { // Left
            candidates = others.filter(p => p.x < currentPlanet.x - 1);
        } else if (dx > 0) { // Right
            candidates = others.filter(p => p.x > currentPlanet.x + 1);
        } else if (dy < 0) { // Up
            candidates = others.filter(p => p.y < currentPlanet.y - 1);
        } else if (dy > 0) { // Down
            candidates = others.filter(p => p.y > currentPlanet.y + 1);
        }

        if (candidates.length === 0) return null;

        // Sort by score
        candidates.sort((a, b) => {
            const distA = Phaser.Math.Distance.Between(currentPlanet.x, currentPlanet.y, a.x, a.y);
            const distB = Phaser.Math.Distance.Between(currentPlanet.x, currentPlanet.y, b.x, b.y);

            let penaltyA = 0;
            let penaltyB = 0;

            if (dx !== 0) { // Horizontal movement, penalize vertical deviation
                penaltyA = Math.abs(a.y - currentPlanet.y) / distA;
                penaltyB = Math.abs(b.y - currentPlanet.y) / distB;
            } else { // Vertical movement, penalize horizontal deviation
                penaltyA = Math.abs(a.x - currentPlanet.x) / distA;
                penaltyB = Math.abs(b.x - currentPlanet.x) / distB;
            }

            const scoreA = distA * (1 + penaltyA * 2);
            const scoreB = distB * (1 + penaltyB * 2);

            return scoreA - scoreB;
        });

        return candidates[0] || null;
    }
}
