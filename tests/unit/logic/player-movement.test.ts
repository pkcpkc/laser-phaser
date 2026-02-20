vi.mock('phaser', () => {
    return {
        default: {
            Math: {
                Vector2: class {
                    x: number;
                    y: number;
                    constructor(x: number = 0, y: number = 0) { this.x = x; this.y = y; }
                    distance(v: any) { return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2)); }
                },
                Angle: {
                    BetweenPoints: (a: any, b: any) => Math.atan2(b.y - a.y, b.x - a.x)
                },
                Clamp: (val: number, min: number, max: number) => Math.min(Math.max(val, min), max)
            },
            Physics: {
                Matter: {
                    Image: class { }
                }
            }
        }
    };
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayerMovement } from '../../../src/logic/player-movement';
import type { Ship } from '../../../src/ships/ship';

class MockScene {
    scale = { width: 800, height: 600 };
}

class MockShip {
    sprite = {
        active: true,
        x: 100,
        y: 100,
        setPosition: vi.fn(),
        setVelocity: vi.fn(),
        thrustLeft: vi.fn(),
        thrustRight: vi.fn(),
        thrust: vi.fn(),
        thrustBack: vi.fn()
    };
    maxSpeed = 10;
}

describe('PlayerMovement', () => {
    let scene: MockScene;
    let ship: MockShip;
    let movement: PlayerMovement;

    beforeEach(() => {
        scene = new MockScene();
        ship = new MockShip();
        movement = new PlayerMovement(scene as any, ship as unknown as Ship);
    });

    describe('state management', () => {
        it('should start with no target', () => {
            expect(movement.hasTarget()).toBe(false);
            expect(movement.getTargetPosition()).toBeNull();
        });

        it('should track dragging state', () => {
            expect(movement.state.isDragging).toBe(false);
            movement.setDragging(true);
            expect(movement.state.isDragging).toBe(true);
        });
    });

    describe('setTarget', () => {
        it('should set target position', () => {
            movement.setTarget(200, 300);

            expect(movement.hasTarget()).toBe(true);
            expect(movement.getTargetPosition()).toEqual(expect.objectContaining({ x: 200, y: 300 }));
        });

        it('should clamp target to screen bounds', () => {
            movement.setTarget(-50, 900);

            const target = movement.getTargetPosition();
            expect(target?.x).toBe(0);
            expect(target?.y).toBe(600);
        });
    });

    describe('clearTarget', () => {
        it('should clear target and speed', () => {
            movement.setTarget(200, 300);
            movement.clearTarget();

            expect(movement.hasTarget()).toBe(false);
            expect(movement.state.currentSpeed).toBe(0);
        });
    });

    describe('updateKeyboard', () => {
        it('should apply thrust for all directions', () => {
            const directions = ['left', 'right', 'up', 'down'] as const;
            directions.forEach(dir => {
                ship.sprite.thrustLeft.mockClear();
                ship.sprite.thrustRight.mockClear();
                ship.sprite.thrust.mockClear();
                ship.sprite.thrustBack.mockClear();

                const cursors = {
                    left: { isDown: dir === 'left' },
                    right: { isDown: dir === 'right' },
                    up: { isDown: dir === 'up' },
                    down: { isDown: dir === 'down' }
                } as any;

                const moving = movement.updateKeyboard(cursors);
                expect(moving).toBe(true);

                if (dir === 'left') expect(ship.sprite.thrustLeft).toHaveBeenCalled();
                if (dir === 'right') expect(ship.sprite.thrustRight).toHaveBeenCalled();
                if (dir === 'up') expect(ship.sprite.thrust).toHaveBeenCalled();
                if (dir === 'down') expect(ship.sprite.thrustBack).toHaveBeenCalled();
            });
        });

        it('should cancel target when keys are pressed', () => {
            movement.setTarget(200, 300);

            const cursors = {
                left: { isDown: true },
                right: { isDown: false },
                up: { isDown: false },
                down: { isDown: false }
            } as any;

            movement.updateKeyboard(cursors);

            expect(movement.hasTarget()).toBe(false);
        });

        it('should return false when no keys pressed', () => {
            const cursors = {
                left: { isDown: false },
                right: { isDown: false },
                up: { isDown: false },
                down: { isDown: false }
            } as any;

            const moving = movement.updateKeyboard(cursors);

            expect(moving).toBe(false);
        });
    });

    describe('updateTargetMovement', () => {
        it('should return no movement if no target', () => {
            const result = movement.updateTargetMovement();

            expect(result.arrived).toBe(false);
            expect(result.angle).toBeNull();
        });

        it('should mark as arrived when close to target', () => {
            movement.setTarget(102, 102); // Very close to ship at 100,100

            const result = movement.updateTargetMovement();

            expect(result.arrived).toBe(true);
            expect(ship.sprite.setPosition).toHaveBeenCalled();
            expect(ship.sprite.setVelocity).toHaveBeenCalledWith(0, 0);
        });

        it('should accelerate toward target', () => {
            movement.setTarget(500, 500);
            (movement as any).currentSpeed = 0;

            const result = movement.updateTargetMovement();

            expect(result.arrived).toBe(false);
            expect((movement as any).currentSpeed).toBeGreaterThan(0);
            expect(result.isDecelerating).toBe(false);
        });

        it('should clamp to max speed during acceleration', () => {
            movement.setTarget(1000, 1000);
            const maxSpeed = ship.maxSpeed * 3; // TAP_SPEED_MULTIPLIER = 3
            (movement as any).currentSpeed = maxSpeed - 1;

            movement.updateTargetMovement();

            expect((movement as any).currentSpeed).toBe(maxSpeed);
        });

        it('should decelerate when close to target braking distance', () => {
            movement.setTarget(150, 150);
            // distance is sqrt(50^2 + 50^2) = 70.7
            // currentSpeed = 30. DECELERATION = 3.0.
            // brakingDistance = (30 * 30) / (2 * 3) = 900 / 6 = 150.
            // 70.7 <= 150 -> should decelerate.
            (movement as any).currentSpeed = 30;

            const result = movement.updateTargetMovement();

            expect(result.isDecelerating).toBe(true);
            expect((movement as any).currentSpeed).toBe(27); // 30 - 3
        });


        it('should return correct state', () => {
            movement.setTarget(200, 200);
            const state = movement.state;
            expect(state.targetPosition).toBeDefined();
            expect(state.isDecelerating).toBeDefined();
        });
    });
});
