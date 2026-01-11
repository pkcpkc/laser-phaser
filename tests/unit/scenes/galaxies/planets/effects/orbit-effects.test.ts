import { describe, it, expect, vi } from 'vitest';

// Mock Phaser globally
vi.mock('phaser', () => ({
    default: {
        Scene: class { },
        GameObjects: {
            Text: class { },
            Graphics: class { },
            Image: class { }
        },
        Math: {
            Vector2: class { },
            FloatBetween: () => 0.5,
            DegToRad: (d: number) => d * (Math.PI / 180),
        },
        BlendModes: {
            ADD: 1
        }
    }
}));

import { BaseOrbitEffect } from '../../../../../../src/scenes/galaxies/planets/effects/base-orbit-effect';
import type { PlanetData } from '../../../../../../src/scenes/galaxies/planets/planet-data';

// Concrete implementation for testing abstract class
class TestOrbitEffect extends BaseOrbitEffect {
    public static readonly effectType = 'test-effect';

    // Expose protected method for testing
    public testGetOrbitDepth(baseDepth: number, isFront: boolean): number {
        return this.getOrbitDepth(baseDepth, isFront);
    }

    onUpdate(): void { }
    protected onDestroy(): void { }
}

describe('BaseOrbitEffect', () => {
    const mockScene = {
        events: { on: vi.fn(), off: vi.fn() }
    } as any;

    const mockPlanet = {
        x: 100,
        y: 100
    } as PlanetData;

    it('should calculate depth correctly for front objects', () => {
        const effect = new TestOrbitEffect(mockScene, mockPlanet);
        const baseDepth = 50;

        // Front objects should be slightly above base
        const depth = effect.testGetOrbitDepth(baseDepth, true);
        expect(depth).toBe(51.2); // 50 + 1.2
    });

    it('should calculate depth correctly for back objects', () => {
        const effect = new TestOrbitEffect(mockScene, mockPlanet);
        const baseDepth = 50;

        // Back objects should be deeply negative relative to base
        const depth = effect.testGetOrbitDepth(baseDepth, false);
        expect(depth).toBe(-50); // 50 - 100
    });

    it('should ensure back objects are behind planet even with high base depth', () => {
        const effect = new TestOrbitEffect(mockScene, mockPlanet);
        // Simulate a planet with many effects, pushing base depth high
        // Planet is at 50, but effect stack is at 60
        const baseDepth = 60;

        const depth = effect.testGetOrbitDepth(baseDepth, false);

        // Planet is 50. Depth should be well below 50.
        expect(depth).toBeLessThan(50);
        expect(depth).toBe(-40);
    });
});
