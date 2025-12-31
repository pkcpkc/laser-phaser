import { describe, it, expect, vi } from 'vitest';

// Mock Phaser to avoid canvas context errors in headless environment
vi.mock('phaser', () => ({
    default: {
        Scene: class { },
        GameObjects: {
            Graphics: class { },
            Container: class { },
            Image: class { },
            Particles: { ParticleEmitter: class { } },
            Text: class { }
        },
        Math: {
            DegToRad: (d: number) => d,
            FloatBetween: () => 0,
            Between: () => 0
        },
        BlendModes: { ADD: 0 }
    }
}));

import { PlanetEffectFactory } from '../../../../src/scenes/galaxies/planets/planet-effect-factory';

describe('PlanetEffectFactory', () => {
    it('should be defined', () => {
        expect(PlanetEffectFactory).toBeDefined();
    });
});
