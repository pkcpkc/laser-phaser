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
                FloatBetween: (min: number, max: number) => min + Math.random() * (max - min),
                Linear: (p0: number, p1: number, t: number) => p0 + (p1 - p0) * t,
                Between: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
            },
            BlendModes: {
                ADD: 1
            },
            GameObjects: {
                Particles: {
                    ParticleEmitter: class { }
                },
                Text: class {
                    setOrigin = vi.fn().mockReturnThis();
                },
                Graphics: class {

                },
                Container: class {
                    add = vi.fn();
                    setDepth = vi.fn();
                    setPosition = vi.fn();
                    setRotation = vi.fn();
                    setScale = vi.fn();
                    destroy = vi.fn();
                    setVisible = vi.fn();
                    setAlpha = vi.fn();
                }
            },
            Scene: class {
                add = {
                    text: vi.fn().mockReturnValue({ setOrigin: vi.fn(), setInteractive: vi.fn().mockReturnThis(), on: vi.fn() }),
                    particles: vi.fn().mockReturnValue({
                        startFollow: vi.fn(),
                        setDepth: vi.fn(),
                        setVisible: vi.fn(),
                        destroy: vi.fn(),
                        active: true
                    }),
                    graphics: vi.fn().mockReturnValue({
                        fillStyle: vi.fn(),
                        fillCircle: vi.fn(),
                        setPosition: vi.fn(),
                        setDepth: vi.fn(),
                        setScale: vi.fn(),
                        lineStyle: vi.fn(),
                        strokeCircle: vi.fn(),
                        arc: vi.fn(),
                        strokePath: vi.fn(),
                        beginPath: vi.fn(),
                        closePath: vi.fn(),
                        moveTo: vi.fn(),
                        lineTo: vi.fn(),
                        clear: vi.fn(),
                        setVisible: vi.fn(),
                        destroy: vi.fn(),
                        setAlpha: vi.fn(),
                        setBlendMode: vi.fn()
                    }),
                    image: vi.fn().mockReturnValue({
                        setTint: vi.fn(),
                        setScale: vi.fn(),
                        setDepth: vi.fn(),
                        setBlendMode: vi.fn(),
                        setVisible: vi.fn(),
                        setAlpha: vi.fn(),
                        setPosition: vi.fn(),
                        setOrigin: vi.fn(),
                        setAngle: vi.fn(),
                        setRotation: vi.fn(),
                        setData: vi.fn(),
                        getData: vi.fn()
                    }),
                    container: vi.fn().mockReturnValue({ add: vi.fn(), setDepth: vi.fn(), setPosition: vi.fn(), setRotation: vi.fn(), setScale: vi.fn(), destroy: vi.fn(), setVisible: vi.fn(), setAlpha: vi.fn() })
                };
                events = { on: vi.fn(), off: vi.fn() };
                time = { delayedCall: vi.fn(), addEvent: vi.fn() };
                make = {
                    graphics: vi.fn().mockReturnValue({
                        fillStyle: vi.fn(),
                        fillRect: vi.fn(),
                        generateTexture: vi.fn(),
                        lineStyle: vi.fn(),
                        strokeCircle: vi.fn(),
                        arc: vi.fn(),
                        strokePath: vi.fn(),
                        beginPath: vi.fn(),
                        closePath: vi.fn(),
                        moveTo: vi.fn(),
                        lineTo: vi.fn(),
                        clear: vi.fn()
                    })
                };
                tweens = {
                    add: vi.fn(),
                    killTweensOf: vi.fn(),
                    addCounter: vi.fn().mockReturnValue({
                        setCallback: vi.fn(),
                        play: vi.fn()
                    })
                };
                textures = {
                    exists: vi.fn().mockReturnValue(true),
                    createCanvas: vi.fn().mockReturnValue({
                        context: {
                            beginPath: vi.fn(),
                            arc: vi.fn(),
                            fillStyle: '',
                            fill: vi.fn()
                        },
                        refresh: vi.fn()
                    })
                };
            }
        }
    }
});

describe('PlanetRegistry', () => {
    let registry: PlanetRegistry;
    let mockScene: Phaser.Scene;

    beforeEach(() => {
        registry = new PlanetRegistry();
        mockScene = new Phaser.Scene('test');
    });

    it('should initialize planets correctly', () => {
        registry.initPlanets(mockScene, 800, 600);
        const planets = registry.getAll();

        expect(planets.length).toBeGreaterThan(0);

        const earth = registry.getById('earth');
        expect(earth).toBeDefined();
        // @ts-ignore
        expect(earth.unlocked).toBe(true);
    });

    it('should configure specific planets with correct properties', () => {
        registry.initPlanets(mockScene, 800, 600);

        const ringWorld = registry.getById('ring-world')!;
        expect(ringWorld.effects).toBeDefined();
        expect(ringWorld.effects!.length).toBeGreaterThan(0);

        expect(ringWorld?.tint).toBe(0xB8860B);

        const redMoon = registry.getById('red-moon')!;
        expect(redMoon.effects).toBeDefined();
        expect(redMoon.effects!.length).toBe(3); // 3 MiniMoons

        const gliese = registry.getById('gliese')!;
        expect(gliese).toBeDefined();
        expect(gliese.effects).toBeDefined();
        expect(gliese.effects!.length).toBe(1); // Satellite
        expect(gliese.unlocked).toBeFalsy();

        const darkMoon = registry.getById('dark-moon-pulse')!;
        expect(darkMoon.effects).toBeDefined();
        expect(darkMoon.effects!.length).toBe(1); // GhostShade
    });

    it('should update positions based on screen size', () => {
        registry.initPlanets(mockScene, 800, 600);
        const redMoon = registry.getById('red-moon')!;

        // Initial radius check
        const d1 = Phaser.Math.Distance.Between(redMoon.x, redMoon.y, 400, 300);
        expect(d1).toBeGreaterThan(90);

        // Resize to something smaller
        registry.updatePositions(400, 400);

        // Earth is center
        const earth = registry.getById('earth')!;
        expect(earth.x).toBe(200);
        expect(earth.y).toBe(200);

        // Red Moon should still be valid within new smaller bounds
        const d2 = Phaser.Math.Distance.Between(redMoon.x, redMoon.y, 200, 200);
        expect(d2).toBeGreaterThan(90);
        expect(d2).toBeLessThan(150);
    });

    it('should find nearest neighbor', () => {
        registry.initPlanets(mockScene, 800, 600);

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
        registry.initPlanets(mockScene, 800, 600);

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
