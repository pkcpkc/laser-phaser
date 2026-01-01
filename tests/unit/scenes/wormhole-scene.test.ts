import { describe, it, expect, vi, beforeEach } from 'vitest';
import WormholeScene from '../../../src/scenes/wormhole-scene';

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class {
                sys = {
                    settings: { data: {} }
                };
                scale = { width: 800, height: 600 };
                add = {
                    graphics: vi.fn(() => ({
                        clear: vi.fn(),
                        lineStyle: vi.fn(),
                        beginPath: vi.fn(),
                        moveTo: vi.fn(),
                        lineTo: vi.fn(),
                        strokePath: vi.fn(),
                        fillStyle: vi.fn(),
                        fillPoint: vi.fn(),
                        setDepth: vi.fn(),
                    })),
                    image: vi.fn(() => ({
                        setBlendMode: vi.fn(),
                        setAlpha: vi.fn(),
                        setScale: vi.fn(),
                        setDepth: vi.fn(),
                        setTint: vi.fn(),
                        setRandomPosition: vi.fn(),
                    })),
                };
                tweens = {
                    add: vi.fn(),
                };
                time = {
                    delayedCall: vi.fn(),
                };
                cameras = {
                    main: {
                        fade: vi.fn(),
                    }
                };
                textures = {
                    exists: vi.fn(() => false),
                    createCanvas: vi.fn(() => ({
                        getContext: vi.fn(() => ({
                            createRadialGradient: vi.fn(() => ({
                                addColorStop: vi.fn(),
                            })),
                            fillStyle: '',
                            fillRect: vi.fn(),
                        })),
                        refresh: vi.fn(),
                    })),
                };
                scene = {
                    start: vi.fn(),
                };
                constructor(key: string) { void key; }
            },
            Math: {
                Between: vi.fn(() => 100),
                FloatBetween: vi.fn(() => 1),
                Angle: {
                    Between: vi.fn(),
                },
                Clamp: vi.fn(),
            },
            Utils: {
                Array: {
                    GetRandom: vi.fn(() => 0xFFFFFF),
                }
            },
            BlendModes: {
                ADD: 1,
            }
        }
    };
});

describe('WormholeScene', () => {
    let scene: WormholeScene;

    beforeEach(() => {
        scene = new WormholeScene();
        // Manually inject mocks if needed, or rely on the class structure
        (scene as any).scale = { width: 800, height: 600 };
        (scene as any).add = {
            graphics: vi.fn(() => ({
                clear: vi.fn(),
                lineStyle: vi.fn(),
                beginPath: vi.fn(),
                moveTo: vi.fn(),
                lineTo: vi.fn(),
                strokePath: vi.fn(),
                fillStyle: vi.fn(),
                fillPoint: vi.fn(),
                setDepth: vi.fn(),
            })),
            image: vi.fn(() => ({
                setBlendMode: vi.fn(),
                setAlpha: vi.fn(),
                setScale: vi.fn(),
                setDepth: vi.fn(),
                setTint: vi.fn(),
                setRandomPosition: vi.fn(),
            })),
        };
        (scene as any).tweens = { add: vi.fn() };
        (scene as any).time = { delayedCall: vi.fn() };
        (scene as any).cameras = { main: { fade: vi.fn() } };
        (scene as any).scene = { start: vi.fn() };
    });

    it('should exist', () => {
        expect(scene).toBeDefined();
    });

    it('should initialize with galaxyId', () => {
        scene.init({ galaxyId: 'test-galaxy' });
        expect((scene as any).galaxyId).toBe('test-galaxy');
    });

    it('should create graphics and stars', () => {
        scene.create();
        expect((scene as any).add.graphics).toHaveBeenCalled();
        expect((scene as any).stars.length).toBeGreaterThan(0);
    });

    it('should start animation sequence', () => {
        scene.create();

        // We expect multiple delayed calls now.
        // 1. Static Start (1000ms)
        // 2. Color/Center (2000ms)
        // 3. Decel (4500ms)
        // 4. White Return (5000ms)

        const delayedCalls = (scene as any).time.delayedCall.mock.calls;
        expect(delayedCalls.length).toBeGreaterThanOrEqual(4);

        const startCall = delayedCalls.find((c: any[]) => c[0] === 1000);
        expect(startCall).toBeDefined();

        // Manually trigger the start callback to verify tween addition
        startCall[1]();
        expect((scene as any).tweens.add).toHaveBeenCalled();
    });
});
