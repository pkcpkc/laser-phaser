import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayerController } from '../../src/logic/player-controller';
import Phaser from 'phaser';

// Mock Ship dependencies to avoid loading real Phaser classes
vi.mock('../../src/ships/ship', () => ({
    Ship: class { }
}));

vi.mock('../../src/ships/big-cruiser', () => ({
    BigCruiser: {
        gameplay: {
            thrust: 0.1
        }
    }
}));

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            GameObjects: {
                Text: class {
                    getBounds = vi.fn().mockReturnValue({ contains: vi.fn() });
                    on = vi.fn().mockReturnThis();
                },
                Arc: class {
                    destroy = vi.fn();
                    setDepth = vi.fn();
                    alpha = 1;
                }
            },
            Math: {
                Vector2: class {
                    constructor(public x = 0, public y = 0) { }
                    distance(other: any) {
                        return Math.hypot(this.x - other.x, this.y - other.y);
                    }
                },
                Angle: {
                    BetweenPoints: vi.fn()
                },
                Clamp: (v: number, min: number, max: number) => Math.max(min, Math.min(v, max))
            },
            Input: {
                Pointer: class { }
            }
        }
    };
});

describe('PlayerController', () => {
    let controller: PlayerController;
    let mockScene: any;
    let mockShip: any;
    let mockCursors: any;

    beforeEach(() => {
        mockScene = {
            input: {
                on: vi.fn(),
                keyboard: {
                    checkDown: vi.fn(),
                }
            },
            add: {
                circle: vi.fn().mockReturnValue(new Phaser.GameObjects.Arc(mockScene as any))
            },
            tweens: {
                add: vi.fn()
            },
            scale: {
                width: 800,
                height: 600
            }
        };

        mockShip = {
            sprite: {
                active: true,
                x: 100,
                y: 100,
                setPosition: vi.fn((x, y) => {
                    mockShip.sprite.x = x;
                    mockShip.sprite.y = y;
                }),
                setVelocity: vi.fn(),
                setVelocityX: vi.fn(),
                setVelocityY: vi.fn(),
                thrust: vi.fn(),
                thrustBack: vi.fn(),
                thrustLeft: vi.fn(),
                thrustRight: vi.fn(),
            },
            config: {
                modules: [] // Empty modules array to satisfy getEffectiveFiringInterval
            },
            fireLasers: vi.fn()
        };

        mockCursors = {
            left: { isDown: false },
            right: { isDown: false },
            up: { isDown: false },
            down: { isDown: false },
            space: { isDown: false }
        };

        controller = new PlayerController(mockScene, mockShip, mockCursors);
    });

    it('should initialize correctly', () => {
        expect(controller).toBeDefined();
        expect(mockScene.input.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    });

    it('should set target on pointer down', () => {
        // Trigger pointerdown handler
        const pointerHandler = mockScene.input.on.mock.calls[0][1];
        const mockPointer = { worldX: 200, worldY: 200, x: 200, y: 200 };

        pointerHandler(mockPointer);

        // Verify target effect is shown
        expect(mockScene.add.circle).toHaveBeenCalledWith(200, 200, expect.any(Number), expect.any(Number), expect.any(Number));
    });

    it('should move towards target in update', () => {
        // Set target
        (controller as any).setTarget(200, 200);

        // Mock angle calculation
        vi.spyOn(Phaser.Math.Angle, 'BetweenPoints').mockReturnValue(0); // 0 radians = right

        // Update
        controller.update(0);

        // Should have set velocity
        expect(mockShip.sprite.setVelocity).toHaveBeenCalled();
    });

    it('should stop when close to target', () => {
        // Set target very close
        (controller as any).setTarget(102, 100); // 2 pixels away

        controller.update(0);

        // Should snap to position and stop
        expect(mockShip.sprite.setPosition).toHaveBeenCalledWith(102, 100);
        expect(mockShip.sprite.setVelocity).toHaveBeenCalledWith(0, 0);
    });

    it('should respect boundary limits', () => {
        mockShip.sprite.x = -100; // Out of bounds

        controller.update(0);

        // Should be clamped
        const margin = 30;
        expect(mockShip.sprite.setPosition).toHaveBeenCalledWith(margin, expect.any(Number));
        expect(mockShip.sprite.setVelocityX).toHaveBeenCalledWith(0);
    });
});
