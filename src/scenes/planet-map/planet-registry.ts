import Phaser from 'phaser';
import type { IPlanetEffect } from './planet-effect';
import { SatelliteEffect } from './effects/satellite-effect';
import { SolidRingEffect } from './effects/solid-ring-effect';
import { GasRingEffect } from './effects/gas-ring-effect';
import { HurricaneEffect } from './effects/hurricane-effect';
import { GlimmeringSnowEffect } from './effects/glimmering-snow-effect';
import { SolarFlareEffect } from './effects/solar-flare-effect';
import { MiniMoonEffect } from './effects/mini-moon-effect';
import { GhostShadeEffect } from './effects/ghost-shade-effect';
import { SpikesEffect } from './effects/spikes-effect';
import { RectanglesEffect } from './effects/rectangles-effect';
import { BubbleEffect } from './effects/bubble-effect';


export interface PlanetData {
    id: string;
    x: number;
    y: number;
    name: string;
    unlocked?: boolean; // Defaults to false
    visualScale?: number;
    tint?: number; // Optional color tint

    // Configuration Objects
    effects?: IPlanetEffect[];

    interaction?: {
        levelId?: string;
        hasTrader?: boolean;
        hasShipyard?: boolean;
    };

    // Runtime references
    gameObject?: Phaser.GameObjects.Text | Phaser.GameObjects.Image;
    overlayGameObject?: Phaser.GameObjects.Text;
    usingOverlay?: boolean;
    emitter?: Phaser.GameObjects.Particles.ParticleEmitter; // Locked particle effect

    // Positioning persistence
    orbitAngle?: number; // radians
    orbitRadius?: number; // relative distance factor (0 to 1, where 1 is max radius)
    lightPhase?: number; // 0-7, index of moonFrames for lighting calculation
}

export class PlanetRegistry {
    private planets: PlanetData[] = [];


    constructor() {
        // Initial setup
    }

    public initPlanets(scene: Phaser.Scene, width: number, height: number) {


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

        // Helper to Create Object References temporarily for instantiation
        // We need 2 passes or a clever way to pass 'this' before it's fully formed.
        // Actually, we can just create the object, then assign effects to it.

        const createPlanet = (data: Partial<PlanetData>): PlanetData => {
            const planet = data as PlanetData;
            return planet;
        };

        const earth = createPlanet({
            id: 'earth',
            name: 'Earth',
            unlocked: true,
            tint: 0x4488FF, // Blue-ish
            visualScale: 1.0,
            x: cx,
            y: cy,
            orbitAngle: 0,
            orbitRadius: 0
        });
        earth.effects = [
            new HurricaneEffect(scene, earth, { type: 'hurricane', color: 0xffffff }),
            new HurricaneEffect(scene, earth, { type: 'hurricane', color: 0xffffff }),
            new HurricaneEffect(scene, earth, { type: 'hurricane', color: 0xffffff })
        ];

        const ringWorld = createPlanet({
            id: 'ring-world',
            name: 'Ring World',
            tint: 0xB8860B, // Dark Golden Rod
            visualScale: 0.8,
            x: 0, y: 0
        });
        ringWorld.effects = [
            new SolidRingEffect(scene, ringWorld, {
                type: 'solid-ring',
                color: 0xCC9944,
                angle: 30,
                rotation: true
            })
        ];

        const gliese = createPlanet({
            id: 'gliese',
            name: 'Gliese',
            unlocked: false,
            tint: 0xeeeeee, // Green-ish
            x: 0, y: 0
        });
        gliese.effects = [
            new RectanglesEffect(scene, gliese, {
                type: 'rectangles',
                rectCount: 55,
                color: 0xaa6600,
                minSize: 4,
                maxSize: 6,
                lightsColor: 0xffff00,
                clusterCount: 4
            }),
            new SatelliteEffect(scene, gliese, {
                type: 'satellite',
                tint: 0xffffff,
                count: 10
            })
        ];

        const toxicMoon = createPlanet({
            id: 'toxic-moon',
            name: 'Toxic Moon',
            interaction: {
                levelId: 'blood-hunters'
            },
            visualScale: 1.5, // Smaller
            tint: 0xAA00FF, // Purple
            x: 0, y: 0
        });
        toxicMoon.effects = [
            new GasRingEffect(scene, toxicMoon, {
                type: 'gas-ring',
                color: 0x33FF33, // Toxic Green
                angle: 0,
                lifespan: 2500
            })
        ];

        const redMoon = createPlanet({
            id: 'red-moon',
            name: 'Red Moon',
            tint: 0x8B0000, // Dark red
            visualScale: 0.5,
            interaction: {
                levelId: 'blood-hunters',
                hasTrader: true,
                hasShipyard: true
            },
            x: 0, y: 0
        });
        redMoon.effects = [
            new MiniMoonEffect(scene, redMoon, { type: 'mini-moon', tint: 0xFFAAAA, tilt: -60 }), // Light red
            new MiniMoonEffect(scene, redMoon, { type: 'mini-moon', tint: 0xFF8888, tilt: 0 }),   // Slightly darker
            new MiniMoonEffect(scene, redMoon, { type: 'mini-moon', tint: 0xFFCCCC, tilt: 60 })   // Very light
        ];

        const sunFlares = createPlanet({
            id: 'sun-flares',
            name: 'Sun Flares',
            tint: 0xaB0000, // Dark red
            visualScale: 0.5,
            interaction: {
                levelId: 'blood-hunters',
                hasTrader: true,
                hasShipyard: true
            },
            x: 0, y: 0
        });
        sunFlares.effects = [
            new SolarFlareEffect(scene, sunFlares, {
                type: 'solar-flare',
                color: 0xff3300,
                frequency: 2000,
                speed: 20
            })
        ];

        const darkMoonPulse = createPlanet({
            id: 'dark-moon-pulse',
            name: 'Dark Moon',
            tint: 0x333333,
            visualScale: 0.6,
            unlocked: false,
            x: 0, y: 0 // placeholder
        });
        darkMoonPulse.effects = [
            new GhostShadeEffect(scene, darkMoonPulse, {
                type: 'ghost-shade',
                pulse: true,
                color: 0xFF0000
            })
        ];

        const whitePlanet = createPlanet({
            id: 'white-planet',
            name: 'White Moon',
            tint: 0x444444, // Dark Grey
            visualScale: 0.9,
            unlocked: false,
            interaction: {
                levelId: 'blood-hunters'
            },
            x: 0, y: 0
        });
        whitePlanet.effects = [
            new GlimmeringSnowEffect(scene, whitePlanet, {
                type: 'glimmering-snow',
                color: 0xFFFFFF
            })
        ];

        const darkMoonShadow = createPlanet({
            id: 'dark-moon-shadow',
            name: 'Dark Moon',
            tint: 0x333333,
            visualScale: 0.6,
            unlocked: false,
            x: 0, y: 0 // placeholder
        });
        darkMoonShadow.effects = [
            new GhostShadeEffect(scene, darkMoonShadow, {
                type: 'ghost-shade',
                pulse: false,
                color: 0xffffff
            })
        ];

        const metroPrime = createPlanet({
            id: 'metro-prime',
            name: 'Metro Prime',
            visualScale: 1.1,
            tint: 0x222222, // Dark Grey/Black background for city lights
            x: 0, y: 0
        });
        metroPrime.effects = [
            new SpikesEffect(scene, metroPrime, {
                type: 'spikes', // type string updated
                buildingCount: 80,
                color: 0x00ffff, // Cyan neon lights
                minHeight: 4,
                maxHeight: 15,
                rotationSpeed: 0.005,
                rotationAxis: { x: 1, y: -1, z: 0 } // Bottom-right to top-left movement
            })
        ];

        const techPrime = createPlanet({
            id: 'tech-prime',
            name: 'Tech Prime',
            visualScale: 1.0,
            tint: 0x000033, // Deep blue/black
            x: 0, y: 0
        });
        techPrime.effects = [
            new RectanglesEffect(scene, techPrime, {
                type: 'rectangles',
                rectCount: 60,
                color: 0x00ff88, // Cyber green
                minSize: 3,
                maxSize: 8,
            })
        ];


        const oceanus = createPlanet({
            id: 'oceanus',
            name: 'Oceanus',
            visualScale: 1.0,
            tint: 0x004488, // Deep Ocean Blue
            x: 0, y: 0
        });
        oceanus.effects = [
            new BubbleEffect(scene, oceanus, {
                type: 'bubble',
                liquidDensity: 1100, // Very dense
                flowSpeed: 2.5 // Fast turbulent flow
            })
        ];



        this.planets = [
            earth,
            ringWorld,
            gliese,
            toxicMoon,
            redMoon,
            sunFlares,
            darkMoonPulse,
            whitePlanet,
            darkMoonShadow,
            metroPrime,
            techPrime,
            oceanus
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
