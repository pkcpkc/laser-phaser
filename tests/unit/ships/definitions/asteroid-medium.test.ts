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

import { MediumAsteroidDefinition } from '../../../../src/ships/definitions/asteroid-medium';
import { AsteroidTexture } from '../../../../src/ships/textures/asteroid-texture';
import { AsteroidMorphEffect } from '../../../../src/ships/effects/asteroid-morph-effect';

describe('MediumAsteroidDefinition', () => {
    let mockScene: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockScene = {};
    });

    it('should have correct properties', () => {
        expect(MediumAsteroidDefinition.id).toBe('asteroid-medium');
        expect(MediumAsteroidDefinition.physics).toBeDefined();
        expect(MediumAsteroidDefinition.physics?.mass).toBe(13);
        expect(MediumAsteroidDefinition.gameplay?.health).toBe(15);
    });

    it('should randomize asset key', () => {
        const key = MediumAsteroidDefinition.randomizeAssetKey!(mockScene);
        expect(key).toBe('asteroid-medium-texture-0');
    });

    it('should create textures', () => {
        MediumAsteroidDefinition.createTextures!(mockScene);
        expect(AsteroidTexture.create).toHaveBeenCalledWith(mockScene, 'asteroid-medium-texture', 20, expect.any(Object));
    });

    it('should create effect', () => {
        const mockShip = { sprite: {} };
        const effect = MediumAsteroidDefinition.createEffect!(mockScene, mockShip as any);
        expect(effect).toBeInstanceOf(AsteroidMorphEffect);
    });
});
