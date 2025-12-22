import Phaser from 'phaser';
import { BaseUniverse } from '../base-universe';
import { type PlanetData } from '../planet-data';
import { HurricaneEffect } from '../effects/hurricane-effect';
import { SolidRingEffect } from '../effects/solid-ring-effect';
import { RectanglesEffect } from '../effects/rectangles-effect';
import { SatelliteEffect } from '../effects/satellite-effect';
import { GasRingEffect } from '../effects/gas-ring-effect';
import { MiniMoonEffect } from '../effects/mini-moon-effect';
import { SolarFlareEffect } from '../effects/solar-flare-effect';
import { GhostShadeEffect } from '../effects/ghost-shade-effect';
import { GlimmeringSnowEffect } from '../effects/glimmering-snow-effect';
import { SpikesEffect } from '../effects/spikes-effect';
import { BubbleEffect } from '../effects/bubble-effect';

// Helper to Create Object References
const createPlanet = (data: Partial<PlanetData>): PlanetData => {
    return data as PlanetData;
};

export class DemoUniverse extends BaseUniverse {
    public static readonly id = 'demo-universe';
    public readonly id = DemoUniverse.id;
    public readonly name = 'Demo Universe';

    protected getPlanets(scene: Phaser.Scene, width: number, height: number): PlanetData[] {
        const cx = width / 2;
        const cy = height / 2;

        // --- Planet Definitions ---

        const astra = createPlanet({
            id: 'astra',
            name: 'Astra',
            hidden: false,
            tint: 0x4488FF, // Blue-ish
            visualScale: 1.0,
            x: cx,
            y: cy,
            centralPlanet: true
        });
        astra.effects = [
            new HurricaneEffect(scene, astra, { type: 'hurricane', color: 0xffffff }),
            new HurricaneEffect(scene, astra, { type: 'hurricane', color: 0xffffff }),
            new HurricaneEffect(scene, astra, { type: 'hurricane', color: 0xffffff })
        ];

        const aurelia = createPlanet({
            id: 'aurelia',
            name: 'Aurelia',
            tint: 0xB8860B, // Dark Golden Rod
            visualScale: 0.8,
            x: 0, y: 0
        });
        aurelia.effects = [
            new SolidRingEffect(scene, aurelia, {
                type: 'solid-ring',
                color: 0xCC9944,
                angle: 30,
                rotation: true
            })
        ];

        const veridia = createPlanet({
            id: 'veridia',
            name: 'Veridia',
            hidden: true,
            tint: 0xeeeeee, // Green-ish
            x: 0, y: 0
        });
        veridia.effects = [
            new RectanglesEffect(scene, veridia, {
                type: 'rectangles',
                rectCount: 55,
                color: 0xAA00FF, // Purple
                minSize: 4,
                maxSize: 6,
                lightsColor: 0xffff00,
                clusterCount: 4
            }),
            new SatelliteEffect(scene, veridia, {
                type: 'satellite',
                tint: 0xffff00,
                count: 10
            })
        ];

        const nox = createPlanet({
            id: 'nox',
            name: 'Nox',
            interaction: {
                levelId: 'blood-hunters'
            },
            visualScale: 1.5, // Smaller
            tint: 0xAA00FF, // Purple
            x: 0, y: 0
        });
        nox.effects = [
            new GasRingEffect(scene, nox, {
                type: 'gas-ring',
                color: 0x33FF33, // Toxic Green
                angle: 0,
                lifespan: 2500
            })
        ];

        const crimson = createPlanet({
            id: 'crimson',
            name: 'Crimson',
            tint: 0x8B0000, // Dark red
            visualScale: 0.5,
            interaction: {
                levelId: 'blood-hunters',
                hasTrader: true,
                hasShipyard: true
            },
            x: 0, y: 0,
            warpUniverseId: 'blood-hunters-universe' // Warp to Blood Hunter Universe test
        });
        crimson.effects = [
            new MiniMoonEffect(scene, crimson, { type: 'mini-moon', tint: 0xFFAAAA, tilt: -60 }), // Light red
            new MiniMoonEffect(scene, crimson, { type: 'mini-moon', tint: 0xFF8888, tilt: 0 }),   // Slightly darker
            new MiniMoonEffect(scene, crimson, { type: 'mini-moon', tint: 0xFFCCCC, tilt: 60 })   // Very light
        ];

        const ignis = createPlanet({
            id: 'ignis',
            name: 'Ignis',
            tint: 0xaB0000, // Dark red
            visualScale: 0.5,
            interaction: {
                levelId: 'blood-hunters',
                hasTrader: true,
                hasShipyard: true
            },
            x: 0, y: 0
        });
        ignis.effects = [
            new SolarFlareEffect(scene, ignis, {
                type: 'solar-flare',
                color: 0xff3300,
                frequency: 2000,
                speed: 20
            })
        ];

        const pulsar = createPlanet({
            id: 'pulsar',
            name: 'Pulsar',
            tint: 0x333333,
            visualScale: 0.6,
            hidden: true,
            x: 0, y: 0
        });
        pulsar.effects = [
            new GhostShadeEffect(scene, pulsar, {
                type: 'ghost-shade',
                pulse: true,
                color: 0xFF0000
            })
        ];

        const frost = createPlanet({
            id: 'frost',
            name: 'Frost',
            tint: 0x444444, // Dark Grey
            visualScale: 0.9,
            hidden: true,
            interaction: {
                levelId: 'blood-hunters'
            },
            x: 0, y: 0
        });
        frost.effects = [
            new GlimmeringSnowEffect(scene, frost, {
                type: 'glimmering-snow',
                color: 0xFFFFFF
            })
        ];

        const umbra = createPlanet({
            id: 'umbra',
            name: 'Umbra',
            tint: 0x333333,
            visualScale: 0.6,
            hidden: true,
            x: 0, y: 0
        });
        umbra.effects = [
            new GhostShadeEffect(scene, umbra, {
                type: 'ghost-shade',
                pulse: false,
                color: 0xffffff
            })
        ];

        const metropolis = createPlanet({
            id: 'metropolis',
            name: 'Metropolis',
            visualScale: 1.1,
            tint: 0x222222, // Dark Grey/Black background for city lights
            x: 0, y: 0
        });
        metropolis.effects = [
            new SpikesEffect(scene, metropolis, {
                type: 'spikes',
                buildingCount: 80,
                color: 0x00ffff, // Cyan neon lights
                minHeight: 4,
                maxHeight: 15,
                rotationSpeed: 0.005,
                rotationAxis: { x: 1, y: -1, z: 0 }
            })
        ];

        const cyber = createPlanet({
            id: 'cyber',
            name: 'Cyber',
            visualScale: 1.0,
            tint: 0x000033, // Deep blue/black
            x: 0, y: 0
        });
        cyber.effects = [
            new RectanglesEffect(scene, cyber, {
                type: 'rectangles',
                rectCount: 60,
                color: 0x00ff88, // Cyber green
                minSize: 3,
                maxSize: 8,
            })
        ];

        const thalassa = createPlanet({
            id: 'thalassa',
            name: 'Thalassa',
            visualScale: 1.0,
            tint: 0x004488, // Deep Ocean Blue
            x: 0, y: 0
        });
        thalassa.effects = [
            new BubbleEffect(scene, thalassa, {
                type: 'bubble',
                liquidDensity: 1100, // Very dense
                flowSpeed: 2.5 // Fast turbulent flow
            })
        ];

        return [
            astra,
            aurelia,
            veridia,
            nox,
            crimson,
            ignis,
            pulsar,
            frost,
            umbra,
            metropolis,
            cyber,
            thalassa
        ];
    }
}

