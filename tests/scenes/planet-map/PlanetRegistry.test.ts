import { describe, it, expect, beforeEach } from 'vitest';
import { PlanetRegistry } from '../../../src/scenes/planet-map/planet-registry';
// @ts-ignore
import Phaser from 'phaser';
import { vi } from 'vitest';

vi.mock('phaser', () => {
    return {
        default: {
            Math: {
                DegToRad: (deg: number) => deg * (Math.PI / 180),
                Distance: {
                    Between: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1)
                },
                FloatBetween: (min: number, max: number) => min + Math.random() * (max - min)
            },
            GameObjects: {
                Particles: {
                    ParticleEmitter: class { }
                }
            }
        }
    }
});

describe('PlanetRegistry', () => {
    let registry: PlanetRegistry;

    beforeEach(() => {
        registry = new PlanetRegistry();
    });

    it('should initialize planets correctly', () => {
        registry.initPlanets(800, 600);
        const planets = registry.getAll();

        expect(planets.length).toBeGreaterThan(0);

        const earth = registry.getById('earth');
        expect(earth).toBeDefined();
        // @ts-ignore
        expect(earth.unlocked).toBe(true);
    });

    it('should update positions based on screen size', () => {
        registry.initPlanets(800, 600);
        const redMoon = registry.getById('red-moon')!;

        // Initial radius check
        const d1 = Phaser.Math.Distance.Between(redMoon.x, redMoon.y, 400, 300);
        // Should be > innerLimit (approx 100) and < outerLimit (approx 300-60=240)
        expect(d1).toBeGreaterThan(90);

        // Resize to something smaller
        registry.updatePositions(400, 400);

        // Earth is center
        const earth = registry.getById('earth')!;
        expect(earth.x).toBe(200);
        expect(earth.y).toBe(200);

        // Red Moon should still be valid within new smaller bounds
        const d2 = Phaser.Math.Distance.Between(redMoon.x, redMoon.y, 200, 200);
        // Inner limit is const (approx 100). Outer limit for 400px screen: 200 - 60 = 140.
        expect(d2).toBeGreaterThan(90);
        expect(d2).toBeLessThan(150); // Allowing small margin for rounding/sanity clamp
    });

    it('should find nearest neighbor', () => {
        registry.initPlanets(800, 600);

        // Manually position planets to form a distinct cross shape for testing
        const earth = registry.getById('earth')!;
        earth.x = 400; earth.y = 300;

        const redMoon = registry.getById('red-moon')!;
        redMoon.x = 500; redMoon.y = 300; // Right

        const ringWorld = registry.getById('ring-world')!;
        ringWorld.x = 400; ringWorld.y = 200; // Up

        // Find neighbor to the right
        const rightNeighbor = registry.findNearestNeighbor('earth', 1, 0);
        expect(rightNeighbor).toBeDefined();
        expect(rightNeighbor?.id).toBe('red-moon');

        // Ring World is Up from Earth
        const upNeighbor = registry.findNearestNeighbor('earth', 0, -1);
        expect(upNeighbor?.id).toBe('ring-world');
    });

    it('should return null if no neighbor in direction', () => {
        registry.initPlanets(800, 600);

        // Manually position Earth
        const earth = registry.getById('earth')!;
        earth.x = 400; earth.y = 300;

        // Move all others far away or to the side, ensuring none are "down"
        registry.getAll().forEach(p => {
            if (p.id !== 'earth') {
                p.x = 400;
                p.y = 200; // All up
            }
        });

        // Nothing below earth
        const downNeighbor = registry.findNearestNeighbor('earth', 0, 1);
        expect(downNeighbor).toBeNull();
    });
});
