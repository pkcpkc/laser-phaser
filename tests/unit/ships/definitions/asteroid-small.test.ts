import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => ({
    default: {
        Math: {
            Between: vi.fn(() => 0)
        }
    }
}));

// Mock AsteroidTexture
vi.mock('../../../../src/ships/textures/asteroid-texture', () => ({
    AsteroidTexture: {
        create: vi.fn(),
        generateSurface: vi.fn(),
        generateVertices: vi.fn()
    }
}));

// Mock AsteroidMorphEffect
vi.mock('../../../../src/ships/effects/asteroid-morph-effect', () => ({
    AsteroidMorphEffect: class {
        constructor() { }
    }
}));

import { SmallAsteroidDefinition } from '../../../../src/ships/definitions/asteroid-small';
import { AsteroidTexture } from '../../../../src/ships/textures/asteroid-texture';
import { AsteroidMorphEffect } from '../../../../src/ships/effects/asteroid-morph-effect';

describe('SmallAsteroidDefinition', () => {
    let mockScene: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockScene = {};
    });

    it('should have correct properties', () => {
        expect(SmallAsteroidDefinition.id).toBe('asteroid-small');
        expect(SmallAsteroidDefinition.physics).toBeDefined();
        expect(SmallAsteroidDefinition.physics?.mass).toBe(10);
        expect(SmallAsteroidDefinition.gameplay?.health).toBe(5);
    });

    it('should randomize asset key', () => {
        const key = SmallAsteroidDefinition.randomizeAssetKey!(mockScene);
        expect(key).toBe('asteroid-small-texture-0');
    });

    it('should create textures', () => {
        SmallAsteroidDefinition.createTextures!(mockScene);
        expect(AsteroidTexture.create).toHaveBeenCalledWith(mockScene, 'asteroid-small-texture', 15, expect.any(Object));
    });

    it('should create effect', () => {
        const mockShip = { sprite: {} };
        const effect = SmallAsteroidDefinition.createEffect!(mockScene, mockShip as any);
        expect(effect).toBeInstanceOf(AsteroidMorphEffect);
    });
});
