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
                }
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
        expect(earth.type).toBe('main');
        // @ts-ignore
        expect(earth.unlocked).toBe(true);
    });

    it('should update positions based on screen size', () => {
        registry.initPlanets(800, 600);
        const earth = registry.getById('earth')!;
        const initialY = earth.y;

        // Resize
        registry.updatePositions(800, 800);

        // Earth y should shift because it's calculated from height
        expect(earth.y).not.toBe(initialY);
    });

    it('should find nearest neighbor', () => {
        registry.initPlanets(800, 600);
        // Earth is initialized at non-zero coordinates
        const redMoon = registry.getById('red-moon')!;
        expect(redMoon).toBeDefined();

        // Find neighbor to the right
        const rightNeighbor = registry.findNearestNeighbor('earth', 1, 0);
        expect(rightNeighbor).toBeDefined();
        expect(rightNeighbor?.id).toBe('red-moon');

        // Ring World is at -90 degrees (Up from Earth)
        const upNeighbor = registry.findNearestNeighbor('earth', 0, -1);
        expect(upNeighbor?.id).toBe('ring-world');
    });

    it('should return null if no neighbor in direction', () => {
        registry.initPlanets(800, 600);
        // Nothing below earth
        const downNeighbor = registry.findNearestNeighbor('earth', 0, 1);
        expect(downNeighbor).toBeNull();
    });
});
