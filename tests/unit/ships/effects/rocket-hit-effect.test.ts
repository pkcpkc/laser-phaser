import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            GameObjects: {
                Image: class {
                    setOrigin = vi.fn();
                    setDepth = vi.fn();
                    setScale = vi.fn();
                    setVisible = vi.fn();
                },
                Container: class {
                    add = vi.fn();
                    setDepth = vi.fn();
                    setPosition = vi.fn();
                },
                Sprite: class {
                    play = vi.fn();
                    setOrigin = vi.fn();
                }
            },
            Math: {
                Vector2: class {
                    x = 0;
                    y = 0;
                    constructor(x = 0, y = 0) {
                        this.x = x;
                        this.y = y;
                    }
                    normalize() { return this; }
                    scale() { return this; }
                },
                Between: vi.fn(),
                FloatBetween: vi.fn(),
                RadToDeg: vi.fn(),
                DegToRad: vi.fn(),
                Angle: {
                    Between: vi.fn()
                }
            },
            Display: {
                Color: {
                    IntegerToColor: vi.fn().mockReturnValue({
                        color: 0xff4400,
                        clone: vi.fn().mockReturnValue({
                            brighten: vi.fn().mockReturnValue({ color: 0xff6622 }),
                            darken: vi.fn().mockReturnValue({ color: 0x882200 })
                        })
                    })
                }
            }
        }
    };
});

import { RocketHitEffect } from '../../../../src/ships/effects/rocket-hit-effect';

describe('RocketHitEffect', () => {
    let mockScene: any;
    let mockEmitter: any;
    const TEST_COLOR = 0xff4400;

    beforeEach(() => {
        mockEmitter = {
            setDepth: vi.fn(),
            explode: vi.fn(),
            active: true,
            destroy: vi.fn()
        };

        mockScene = {
            add: {
                particles: vi.fn().mockReturnValue(mockEmitter)
            },
            time: {
                delayedCall: vi.fn((_delay: number, callback: () => void) => {
                    (mockScene as any)._delayedCallback = callback;
                })
            },
            sys: {
                isActive: vi.fn().mockReturnValue(true)
            }
        };
    });

    it('should create six particle emitters (fireball, smoke, core, debris, shockwave, flash)', () => {
        new RocketHitEffect(mockScene, 100, 200, TEST_COLOR);

        // Should create 6 emitters now
        expect(mockScene.add.particles).toHaveBeenCalledTimes(6);
    });

    it('should create emitters with correct blend modes (Smoke is NORMAL, others ADD)', () => {
        new RocketHitEffect(mockScene, 100, 200, TEST_COLOR);

        // Most are ADD
        expect(mockScene.add.particles).toHaveBeenCalledWith(
            0, 0, 'flare-white',
            expect.objectContaining({
                blendMode: 'ADD'
            })
        );

        // Smoke is NORMAL
        expect(mockScene.add.particles).toHaveBeenCalledWith(
            0, 0, 'flare-white',
            expect.objectContaining({
                blendMode: 'NORMAL'
            })
        );
    });

    it('should use the provided color and variants', () => {
        new RocketHitEffect(mockScene, 100, 200, 0x123456);
        expect(mockScene.add.particles).toHaveBeenCalledTimes(6);
    });

    it('should set different depths for proper layering', () => {
        new RocketHitEffect(mockScene, 100, 200, TEST_COLOR);

        // Should call setDepth 6 times with different values
        expect(mockEmitter.setDepth).toHaveBeenCalledWith(198); // shockwave
        expect(mockEmitter.setDepth).toHaveBeenCalledWith(199); // smoke
        expect(mockEmitter.setDepth).toHaveBeenCalledWith(200); // fireball
        expect(mockEmitter.setDepth).toHaveBeenCalledWith(201); // debris
        expect(mockEmitter.setDepth).toHaveBeenCalledWith(202); // core
        expect(mockEmitter.setDepth).toHaveBeenCalledWith(203); // flash
    });

    it('should explode particles at specified position', () => {
        new RocketHitEffect(mockScene, 150, 250, TEST_COLOR);

        // Verify explosions occurred
        // Flash: 1, Shockwave: 1, Debris: 15, Smoke: 20, Fireball: 30, Core: 8
        expect(mockEmitter.explode).toHaveBeenCalledWith(1, 150, 250);
        expect(mockEmitter.explode).toHaveBeenCalledWith(6, 150, 250);
        expect(mockEmitter.explode).toHaveBeenCalledWith(20, 150, 250);
        expect(mockEmitter.explode).toHaveBeenCalledWith(30, 150, 250);
        expect(mockEmitter.explode).toHaveBeenCalledWith(8, 150, 250);
    });

    it('should schedule cleanup after effect completes', () => {
        new RocketHitEffect(mockScene, 100, 200, TEST_COLOR);

        expect(mockScene.time.delayedCall).toHaveBeenCalledWith(
            1000,
            expect.any(Function),
            undefined, // args
            mockScene  // scope
        );
    });

    it('should destroy all emitters on cleanup if still active', () => {
        new RocketHitEffect(mockScene, 100, 200, TEST_COLOR);

        // Trigger the delayed callback
        (mockScene as any)._delayedCallback();

        // Should destroy 6 times (once for each emitter)
        expect(mockEmitter.destroy).toHaveBeenCalledTimes(6);
    });
});



