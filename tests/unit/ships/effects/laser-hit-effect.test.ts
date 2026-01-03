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
            }
        }
    };
});

import { LaserHitEffect } from '../../../../src/ships/effects/laser-hit-effect';

describe('LaserHitEffect', () => {
    let mockScene: any;
    let mockEmitter: any;

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
                    // Store callback for testing
                    (mockScene as any)._delayedCallback = callback;
                })
            }
        };
    });

    it('should create a particle emitter with default white color', () => {
        new LaserHitEffect(mockScene, 100, 200);

        expect(mockScene.add.particles).toHaveBeenCalledWith(
            0, 0, 'flare-white',
            expect.objectContaining({
                tint: 0xffffff,
                blendMode: 'ADD',
                emitting: false
            })
        );
    });

    it('should create a particle emitter with custom color', () => {
        new LaserHitEffect(mockScene, 100, 200, 0xff0000);

        expect(mockScene.add.particles).toHaveBeenCalledWith(
            0, 0, 'flare-white',
            expect.objectContaining({
                tint: 0xff0000
            })
        );
    });

    it('should set depth and explode particles at specified position', () => {
        new LaserHitEffect(mockScene, 150, 250);

        expect(mockEmitter.setDepth).toHaveBeenCalledWith(200);
        expect(mockEmitter.explode).toHaveBeenCalledWith(6, 150, 250);
    });

    it('should schedule cleanup after effect completes', () => {
        new LaserHitEffect(mockScene, 100, 200);

        expect(mockScene.time.delayedCall).toHaveBeenCalledWith(
            300,
            expect.any(Function)
        );
    });

    it('should destroy emitter on cleanup if still active', () => {
        new LaserHitEffect(mockScene, 100, 200);

        // Trigger the delayed callback
        (mockScene as any)._delayedCallback();

        expect(mockEmitter.destroy).toHaveBeenCalled();
    });

    it('should not destroy emitter on cleanup if already inactive', () => {
        mockEmitter.active = false;
        new LaserHitEffect(mockScene, 100, 200);

        // Trigger the delayed callback
        (mockScene as any)._delayedCallback();

        expect(mockEmitter.destroy).not.toHaveBeenCalled();
    });
});
