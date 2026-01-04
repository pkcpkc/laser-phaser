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
        it('should apply thrust when left key is down', () => {
            const cursors = {
                left: { isDown: true },
                right: { isDown: false },
                up: { isDown: false },
                down: { isDown: false }
            } as any;

            const moving = movement.updateKeyboard(cursors);

            expect(moving).toBe(true);
            expect(ship.sprite.thrustLeft).toHaveBeenCalled();
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

        it('should return angle and set velocity when moving toward target', () => {
            movement.setTarget(300, 100); // Target to the right

            const result = movement.updateTargetMovement();

            expect(result.arrived).toBe(false);
            expect(result.angle).toBeDefined();
            expect(ship.sprite.setVelocity).toHaveBeenCalled();
        });
    });
});
