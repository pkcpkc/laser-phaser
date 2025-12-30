import Phaser from 'phaser';
import { BaseUniverse } from '../base-universe';
import { type PlanetData } from '../planet-data';
import { HurricaneEffect } from '../effects/hurricane-effect';
import { MiniMoonEffect } from '../effects/mini-moon-effect';
import { GhostShadeEffect } from '../effects/ghost-shade-effect';
import { RectanglesEffect } from '../effects/rectangles-effect';
import { SolidRingEffect } from '../effects/solid-ring-effect';
import { AsteroidBeltEffect } from '../effects/asteroid-belt-effect';

// Helper to Create Object References
const createPlanet = (data: Partial<PlanetData>): PlanetData => {
    return data as PlanetData;
};

export class BloodHuntersUniverse extends BaseUniverse {
    public static readonly id = 'blood-hunters-universe';
    public readonly id = BloodHuntersUniverse.id;
    public readonly name = 'Blood Hunters Universe';
    public readonly backgroundTexture = 'blood_nebula';

    protected getPlanets(scene: Phaser.Scene, width: number, height: number): PlanetData[] {
        const cx = width / 2;
        const cy = height / 2;

        const belt = createPlanet({
            id: 'belt',
            name: 'The Belt',
            hidden: false,
            tint: 0x555555, // Grey rocky color
            visualScale: 0.7,
            x: cx,
            y: cy,
            centralPlanet: true,
            requiredVictories: 0,
            interaction: { levelId: 'intro-asteroid-level' },
            introText: "I jolt awake to the screaming of alarms. I'm drifting helpless in the gravity well of THE BELT.\n\nI need to blast a path or dodge these rocks to survive.\n\nStrange alien signals are piercing the static... and they don't sound friendly. But right now, the asteroids are the only thing that matters!"
        });
        belt.effects = [
            new AsteroidBeltEffect(scene, belt, {
                type: 'asteroid-belt',
                color: 0x4a4a4a,
                asteroidCount: 50,
                angle: -15
            })
        ];

        const core = createPlanet({
            id: 'core',
            name: 'Core',
            hidden: true,
            tint: 0xaa0033,
            visualScale: 1.8,
            x: cx,
            y: cy,
            requiredVictories: 1,
            interaction: { levelId: 'blood-hunters-level' }
        });

        const vortex = createPlanet({
            id: 'vortex',
            name: 'Vortex',
            hidden: true,
            tint: 0x880000,
            visualScale: 1.2,
            x: cx,
            y: cy,
            requiredVictories: 1,
            interaction: { levelId: 'blood-hunters-level' }
        });
        vortex.effects = [
            new HurricaneEffect(scene, vortex, { type: 'hurricane', color: 0xff0000 })
        ];

        const trinity = createPlanet({
            id: 'trinity',
            name: 'Trinity',
            hidden: true,
            tint: 0xbb1111,
            visualScale: 0.8,
            x: cx,
            y: cy,
            requiredVictories: 1,
            interaction: { levelId: 'blood-hunters-level' }
        });
        trinity.effects = [
            new MiniMoonEffect(scene, trinity, { type: 'mini-moon', tint: 0x550000, tilt: -30, scale: 0.2 }),
            new MiniMoonEffect(scene, trinity, { type: 'mini-moon', tint: 0x440000, tilt: 20, scale: 0.3 }),
            new MiniMoonEffect(scene, trinity, { type: 'mini-moon', tint: 0x880000, tilt: 60, scale: 0.4 })
        ];

        const halo = createPlanet({
            id: 'halo',
            name: 'Halo',
            hidden: true,
            tint: 0x660000,
            visualScale: 1.0,
            x: cx,
            y: cy,
            requiredVictories: 3,
            interaction: {
                levelId: 'blood-boss-level',
                warpUniverseId: 'demo-universe'
            }
        });
        halo.effects = [
            new SolidRingEffect(scene, halo, { type: 'solid-ring', color: 0xaa0000, angle: 45 })
        ];



        const fragment = createPlanet({
            id: 'fragment',
            name: 'Fragment',
            hidden: true,
            tint: 0xff0000,
            visualScale: 1.1,
            x: cx,
            y: cy,
            requiredVictories: 1,
            interaction: { levelId: 'blood-hunters-level' }
        });
        fragment.effects = [
            new RectanglesEffect(scene, fragment, { type: 'rectangles', color: 0x220000, rectCount: 60 })
        ];

        const spectre = createPlanet({
            id: 'spectre',
            name: 'Spectre',
            hidden: true,
            tint: 0x111111,
            visualScale: 0.6,
            x: cx,
            y: cy,
            requiredVictories: 3,
            interaction: { levelId: 'blood-hunters-level' }
        });
        spectre.effects = [
            new GhostShadeEffect(scene, spectre, { type: 'ghost-shade', color: 0xff0000 })
        ];

        return [core, vortex, trinity, halo, fragment, spectre, belt];
    }
}

