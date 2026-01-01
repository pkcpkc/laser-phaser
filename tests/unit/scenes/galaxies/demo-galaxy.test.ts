import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Galaxy } from '../../../../src/scenes/galaxies/galaxy';
import { DemoGalaxyConfig } from '../../../../src/scenes/galaxies/demo-galaxy';
// @ts-ignore
import Phaser from 'phaser';

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
                Vector3: class {
                    x = 0; y = 0; z = 0;
                    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
                    normalize() { return this; }
                    crossVectors() { return this; }
                    transformQuat() { return this; }
                    dot() { return 0; }
                    length() { return 1; }
                },
                Quaternion: class {
                    setAxisAngle() { return this; }
                },
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
                    text: vi.fn().mockReturnValue({
                        setOrigin: vi.fn().mockReturnThis(),
                        setInteractive: vi.fn().mockReturnThis(),
                        on: vi.fn(),
                        setPosition: vi.fn(),
                        setScale: vi.fn(),
                        setDepth: vi.fn(),
                        setAlpha: vi.fn(),
                        clearTint: vi.fn(),
                        setAngle: vi.fn(),
                        setVisible: vi.fn(),
                        destroy: vi.fn(),
                        postFX: {
                            addColorMatrix: vi.fn().mockReturnValue({
                                saturate: vi.fn(),
                                multiply: vi.fn()
                            }),
                            addBloom: vi.fn()
                        }
                    }),
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
                        fillPath: vi.fn(),
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

describe('GalaxyRegistry (testing DemoGalaxy)', () => {
    let registry: Galaxy;
    let mockScene: Phaser.Scene;

    beforeEach(() => {
        registry = new Galaxy(DemoGalaxyConfig);
        mockScene = new Phaser.Scene('test');
    });

    it('should initialize planets correctly (Demo Galaxy)', () => {
        registry.init(mockScene, 800, 600);
        const planets = registry.getAll();

        expect(planets.length).toBeGreaterThan(0);

        const astra = registry.getById('astra');
        expect(astra).toBeDefined();
        // @ts-ignore
        expect(astra.hidden).toBe(false);
    });

    it('should configure specific planets with correct properties', () => {
        registry.init(mockScene, 800, 600);

        const aurelia = registry.getById('aurelia')!;
        expect(aurelia.effects).toBeDefined();
        expect(aurelia.effects!.length).toBeGreaterThan(0); // Solid Ring
        expect(aurelia?.tint).toBe(0xB8860B);

        const crimson = registry.getById('crimson')!;
        expect(crimson.effects).toBeDefined();
        expect(crimson.effects!.length).toBe(3); // 3 MiniMoons

        const veridia = registry.getById('veridia')!;
        expect(veridia).toBeDefined();
        expect(veridia.effects).toBeDefined();
        expect(veridia.effects!.length).toBe(2); // Rectangles + Satellite
        expect(veridia.hidden).toBeTruthy();
    });

    it('should update positions based on screen size', () => {
        registry.init(mockScene, 800, 600);
        const crimson = registry.getById('crimson')!;

        // Initial radius check
        const d1 = Phaser.Math.Distance.Between(crimson.x, crimson.y, 400, 300);
        expect(d1).toBeGreaterThan(90);

        // Resize to something smaller
        registry.updatePositions(400, 400);

        // Astra is center
        const astra = registry.getById('astra')!;
        expect(astra.x).toBe(200);
        expect(astra.y).toBe(200);

        // Crimson should still be valid within new smaller bounds
        const d2 = Phaser.Math.Distance.Between(crimson.x, crimson.y, 200, 200);
        expect(d2).toBeGreaterThan(90);
        expect(d2).toBeLessThan(150);
    });

    it('should find nearest neighbor', () => {
        registry.init(mockScene, 800, 600);

        // Manually position planets to form a distinct cross shape for testing
        const astra = registry.getById('astra')!;
        astra.x = 400; astra.y = 300;

        const crimson = registry.getById('crimson')!;
        crimson.x = 500; crimson.y = 300; // Right

        const aurelia = registry.getById('aurelia')!;
        aurelia.x = 400; aurelia.y = 200; // Up

        // Find neighbor to the right
        const rightNeighbor = registry.findNearestNeighbor('astra', 1, 0);
        expect(rightNeighbor).toBeDefined();
        expect(rightNeighbor?.id).toBe('crimson');

        // Aurelia is Up from Astra
        const upNeighbor = registry.findNearestNeighbor('astra', 0, -1);
        expect(upNeighbor?.id).toBe('aurelia');
    });

    it('should return null if no neighbor in direction', () => {
        registry.init(mockScene, 800, 600);

        // Manually position Astra
        const astra = registry.getById('astra')!;
        astra.x = 400; astra.y = 300;

        // Move all others far away or to the side, ensuring none are "down"
        registry.getAll().forEach((p: any) => {
            if (p.id !== 'astra') {
                p.x = 400;
                p.y = 200; // All up
            }
        });

        // Nothing below astra
        const downNeighbor = registry.findNearestNeighbor('astra', 0, 1);
        expect(downNeighbor).toBeNull();
    });

    it('should initialize Blood Hunters Galaxy', async () => {
        const { BloodHuntersGalaxyConfig: bloodHuntersGalaxyConfig } = await import('../../../../src/scenes/galaxies/blood-hunters-galaxy');
        const { Galaxy } = await import('../../../../src/scenes/galaxies/galaxy');
        const bloodHunters = new Galaxy(bloodHuntersGalaxyConfig);
        bloodHunters.init(mockScene, 800, 600);
        const planets = bloodHunters.getAll();

        expect(planets.length).toBeGreaterThan(0);

        const vortex = bloodHunters.getById('vortex');
        expect(vortex).toBeDefined();

        // Astra should NOT be here
        const astra = bloodHunters.getById('astra');
        expect(astra).toBeUndefined();
    });
});
