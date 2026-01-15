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
        generateVertices: vi.fn() // Used by effect
    }
}));

// Mock AsteroidMorphEffect
vi.mock('../../../../src/ships/effects/asteroid-morph-effect', () => ({
    AsteroidMorphEffect: class {
        constructor() { }
    }
}));

import { LargeAsteroidDefinition } from '../../../../src/ships/definitions/asteroid-large';
import { AsteroidTexture } from '../../../../src/ships/textures/asteroid-texture';
import { AsteroidMorphEffect } from '../../../../src/ships/effects/asteroid-morph-effect';

describe('LargeAsteroidDefinition', () => {
    let mockScene: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockScene = {};
    });

    it('should have correct properties', () => {
        expect(LargeAsteroidDefinition.id).toBe('asteroid-large');
        expect(LargeAsteroidDefinition.physics).toBeDefined();
        expect(LargeAsteroidDefinition.physics?.mass).toBe(20);
        expect(LargeAsteroidDefinition.gameplay?.health).toBe(30);
    });

    it('should randomize asset key', () => {
        const key = LargeAsteroidDefinition.randomizeAssetKey!(mockScene);
        expect(key).toBe('asteroid-large-texture-0');
        // Check Phaser.Math.Between usage by inference
    });

    it('should create textures', () => {
        LargeAsteroidDefinition.createTextures!(mockScene);

        // Base texture
        expect(AsteroidTexture.create).toHaveBeenCalledWith(mockScene, 'asteroid-large-texture', 32, expect.any(Object));

        // Variants
        expect(AsteroidTexture.create).toHaveBeenCalledWith(mockScene, 'asteroid-large-texture-0', 32, expect.any(Object));

        // Surfaces
        expect(AsteroidTexture.generateSurface).toHaveBeenCalled();
    });

    it('should create effect', () => {
        const mockShip = { sprite: {} };
        const effect = LargeAsteroidDefinition.createEffect!(mockScene, mockShip as any);

        expect(effect).toBeInstanceOf(AsteroidMorphEffect);
    });
});
