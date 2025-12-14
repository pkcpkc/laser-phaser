import Phaser from 'phaser';
import type { SatelliteEffect } from './visuals/satellite-effect';

export interface PlanetData {
    id: string;
    x: number;
    y: number;
    name: string;
    unlocked?: boolean; // Defaults to false

    visualScale?: number;
    levelId?: string;
    hasTrader?: boolean;
    hasShipyard?: boolean;
    tint?: number; // Optional color tint
    ringColor?: number;
    hasSatellites?: boolean; // Enable orbiting satellite effect
    satelliteTint?: number;  // Satellite color (defaults to white)
    satelliteCount?: number; // Number of satellites (defaults to 5)

    // Runtime references
    gameObject?: Phaser.GameObjects.Text | Phaser.GameObjects.Image;
    ringEmitters?: Phaser.GameObjects.Particles.ParticleEmitter[]; // Back and Front emitters
    overlayGameObject?: Phaser.GameObjects.Text;
    usingOverlay?: boolean;
    emitter?: Phaser.GameObjects.Particles.ParticleEmitter;
    satelliteEffect?: SatelliteEffect; // Orbiting satellites visual

    // Positioning persistence
    orbitAngle?: number; // radians
    orbitRadius?: number; // relative distance factor (0 to 1, where 1 is max radius)
}

export class PlanetRegistry {
    private planets: PlanetData[] = [];

    constructor() { }

    public initPlanets(width: number, height: number) {
        const cx = width / 2;
        const cy = height / 2;

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



        this.planets = [
            {
                id: 'earth', // Keeping ID 'earth' for compatibility, but visual is moon
                name: 'Prime Moon', // Was Earth
                unlocked: true,
                tint: 0x4488FF, // Blue - prime moon
                visualScale: 1.0, // Slightly larger for main?
                levelId: 'blood-hunters',
                x: cx,
                y: cy,
                orbitAngle: 0,
                orbitRadius: 0
            },
            {
                id: 'moon-base',
                name: 'Dark Moon',
                tint: 0x4A4A6A, // Deep purple-gray - dark/mysterious
                levelId: 'blood-hunters',
                visualScale: 0.6,
                x: 0, y: 0 // placeholder
            },
            {
                id: 'ring-world',
                name: 'Ring Moon', // Was Ring World
                ringColor: 0xcccccc,
                levelId: 'blood-hunters',
                tint: 0xffffff,
                visualScale: 0.8,
                x: 0, y: 0
            },
            {
                id: 'red-moon',
                name: 'Red Moon',
                tint: 0xFF4444, // Bright red - blood moon
                visualScale: 0.5,
                levelId: 'blood-hunters',
                hasTrader: true,
                hasShipyard: true,
                x: 0, y: 0
            },
            {
                id: 'ice-moon',
                name: 'Ice Moon',
                tint: 0x88EEFF, // Cyan/ice blue
                visualScale: 1.0,
                levelId: 'blood-hunters',
                hasSatellites: true, // Orbiting satellite effect
                x: 0, y: 0
            },
            {
                id: 'toxic-moon',
                name: 'Toxic Moon',
                levelId: 'blood-hunters',
                visualScale: 1.5,
                tint: 0x8844FF, // Violet/purple - toxic moon
                ringColor: 0x88FF66, // Toxic green ring
                x: 0, y: 0
            }
        ];

        const satellitesCount = this.planets.length - 1; // Exclude Earth
        const angleStep = (Math.PI * 2) / satellitesCount;
        const startAngle = Phaser.Math.FloatBetween(0, Math.PI * 2); // Randomize start orientation

        // Assign positions
        let satelliteIndex = 0;
        for (let i = 0; i < this.planets.length; i++) {
            const p = this.planets[i];

            // Skip Earth (index 0 usually, but checking ID is safer if logic changes)
            if (p.id === 'earth') continue;

            const angle = startAngle + (satelliteIndex * angleStep);
            satelliteIndex++;

            // Random radius logic preserved
            const rawRadius = Phaser.Math.FloatBetween(innerLimit, effectiveOuterLimit);
            const bandWidth = effectiveOuterLimit - innerLimit;
            const factor = (rawRadius - innerLimit) / bandWidth;

            p.orbitAngle = angle;
            p.orbitRadius = factor;

            // Initial calc just so they have valid coords immediately
            const actualRadius = innerLimit + (factor * bandWidth);

            p.x = cx + Math.cos(p.orbitAngle) * actualRadius;
            p.y = cy + Math.sin(p.orbitAngle) * actualRadius;
        }
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
            if (p.id === 'earth') {
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

    private setPlanetPosition(planet: PlanetData, x: number, y: number) {
        planet.x = x;
        planet.y = y;
        if (planet.gameObject) {
            planet.gameObject.setPosition(x, y);
            if (planet.overlayGameObject) planet.overlayGameObject.setPosition(x, y);
        }
    }

    public getAll(): PlanetData[] {
        return this.planets;
    }

    public getById(id: string): PlanetData | undefined {
        return this.planets.find(p => p.id === id);
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
