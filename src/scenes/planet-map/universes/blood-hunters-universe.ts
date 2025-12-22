import Phaser from 'phaser';
import { BaseUniverse } from '../base-universe';
import { type PlanetData } from '../planet-data';
import { HurricaneEffect } from '../effects/hurricane-effect';
import { MiniMoonEffect } from '../effects/mini-moon-effect';
import { GhostShadeEffect } from '../effects/ghost-shade-effect';
import { RectanglesEffect } from '../effects/rectangles-effect';
import { SolidRingEffect } from '../effects/solid-ring-effect';

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

        const core = createPlanet({
            id: 'core',
            name: 'Core',
            hidden: false,
            tint: 0xaa0033,
            visualScale: 1.8,
            x: cx,
            y: cy,
            centralPlanet: true,
            interaction: { levelId: 'blood-hunters' }
        });

        const vortex = createPlanet({
            id: 'vortex',
            name: 'Vortex',
            tint: 0x880000,
            visualScale: 1.2,
            x: cx,
            y: cy,
            interaction: { levelId: 'blood-hunters' }
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
            interaction: { levelId: 'blood-hunters' }
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
            interaction: { levelId: 'blood-hunters' },
            warpUniverseId: 'demo-universe'
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
            interaction: { levelId: 'blood-hunters' }
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
            interaction: { levelId: 'blood-hunters' }
        });
        spectre.effects = [
            new GhostShadeEffect(scene, spectre, { type: 'ghost-shade', color: 0xff0000 })
        ];

        return [core, vortex, trinity, halo, fragment, spectre];
    }
}

