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
                        setPosition: vi.fn(),
                        setRotation: vi.fn(),
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
                setPosition: vi.fn(),
                setRotation: vi.fn(),
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


    it('should handle update loop correctly', () => {
        scene.create();

        // Mock data for update interaction
        (scene as any).warpSpeed = 20;
        (scene as any).centerMoveIntensity = 1;

        // Call update
        scene.update(1000, 16);

        // Check if graphics were cleared and redrawn
        expect((scene as any).graphics.clear).toHaveBeenCalled();
        expect((scene as any).graphics.strokePath).toHaveBeenCalled();

        // Check nebula updates if any exist
        if ((scene as any).nebulas.length > 0) {
            const nebula = (scene as any).nebulas[0];
            expect(nebula.setPosition).toHaveBeenCalled();
            expect(nebula.setRotation).toHaveBeenCalled();
        }
    });

    it('should generate nebula texture if missing', () => {
        // Force texture check to return false
        (scene as any).textures.exists.mockReturnValue(false);

        scene.create();

        expect((scene as any).textures.createCanvas).toHaveBeenCalledWith('nebula-cloud', 256, 256);
    });

    it('should execute full animation sequence via delayed calls', () => {
        scene.create();

        const delayedCalls = (scene as any).time.delayedCall.mock.calls;

        // sort calls by delay to ensure order
        delayedCalls.sort((a: any[], b: any[]) => a[0] - b[0]);

        // 1. Acceleration (1000ms)
        const accelCall = delayedCalls.find((c: any[]) => c[0] === 1000);
        expect(accelCall).toBeDefined();
        accelCall[1](); // Execute callback
        expect((scene as any).tweens.add).toHaveBeenCalledWith(expect.objectContaining({
            warpSpeed: 50,
            duration: 1500
        }));

        // 2. Color/Center (2000ms)
        const colorCall = delayedCalls.find((c: any[]) => c[0] === 2000);
        expect(colorCall).toBeDefined();
        colorCall[1]();
        expect((scene as any).tweens.add).toHaveBeenCalledWith(expect.objectContaining({
            colorIntensity: 1,
            centerMoveIntensity: 1
        }));

        // 3. Deceleration (4500ms) - Nested inside is the scene start
        const decelCall = delayedCalls.find((c: any[]) => c[0] === 4500);
        expect(decelCall).toBeDefined();
        decelCall[1]();
        expect((scene as any).tweens.add).toHaveBeenCalledWith(expect.objectContaining({
            warpSpeed: 0,
            duration: 1500
        }));

        // Find the tween config for deceleration to trigger onComplete
        const decelTweenConfig = (scene as any).tweens.add.mock.calls.find((call: any[]) => call[0].warpSpeed === 0)[0];
        // Trigger onComplete to test camera fade
        decelTweenConfig.onComplete();

        expect((scene as any).cameras.main.fade).toHaveBeenCalledWith(
            500, 0, 0, 0, false, expect.any(Function)
        );

        // Trigger camera fade complete callback
        const fadeCallback = (scene as any).cameras.main.fade.mock.calls[0][5];
        fadeCallback({} as any, 1); // progress = 1

        expect((scene as any).scene.start).toHaveBeenCalledWith('GalaxyScene', { galaxyId: '' });
    });
});
