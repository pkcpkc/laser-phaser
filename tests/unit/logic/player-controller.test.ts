// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            Math: {
                Vector2: class {
                    x: number;
                    y: number;
                    constructor(x: number = 0, y: number = 0) { this.x = x; this.y = y; }
                    distance(v: any) { return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2)); }
                },
                Angle: {
                    BetweenPoints: () => 0
                },
                RadToDeg: (rad: number) => rad * (180 / Math.PI),
                Clamp: (val: number, min: number, max: number) => Math.min(Math.max(val, min), max)
            },
            Input: {
                Keyboard: {}
            },
            GameObjects: {
                Image: class { },
                Text: class { },
                Arc: class {
                    setPosition(x: number, y: number) { this.x = x; this.y = y; }
                    x: number = 0;
                    y: number = 0;
                }
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
import { PlayerController } from '../../../src/logic/player-controller';
import { Ship } from '../../../src/ships/ship';
import Phaser from 'phaser';

// Mock Phaser classes
class MockScene {
    input = {
        on: vi.fn(),
        keyboard: {
            createCursorKeys: vi.fn(() => ({
                left: { isDown: false },
                right: { isDown: false },
                up: { isDown: false },
                down: { isDown: false },
                space: { isDown: false }
            })),
            checkDown: vi.fn()
        }
    } as any;
    tweens = {
        add: vi.fn(() => ({
            stop: vi.fn()
        })),
        killTweensOf: vi.fn()
    } as any;
    add = {
        circle: vi.fn(() => ({
            setDepth: vi.fn(),
            destroy: vi.fn(),
            setPosition: vi.fn(),
            alpha: 1
        })),
        text: vi.fn()
    } as any;
    scale = {
        width: 800,
        height: 600
    } as any;
    time = {
        delayedCall: vi.fn()
    } as any;

    constructor() { }
}

class MockShip {
    sprite = {
        active: true,
        x: 100,
        y: 100,
        angle: 0,
        setAngle: vi.fn(),
        setPosition: vi.fn(),
        setVelocity: vi.fn(),
        setVelocityX: vi.fn(),
        setVelocityY: vi.fn(),
        once: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        destroy: vi.fn(),
        scene: {} as any
    };
    config = {
        modules: []
    };
    maxSpeed = 10;
    fireLasers = vi.fn();
}

describe('PlayerController', () => {
    let scene: MockScene;
    let ship: MockShip;
    let controller: PlayerController;
    let cursors: any;

    beforeEach(() => {
        scene = new MockScene();
        ship = new MockShip();
        ship.sprite.scene = scene;
        cursors = scene.input.keyboard!.createCursorKeys();

        controller = new PlayerController(scene as unknown as Phaser.Scene, ship as unknown as Ship, cursors);
    });

    it('should register onDestroy listener on creation', () => {
        expect(ship.sprite.once).toHaveBeenCalledWith('destroy', expect.any(Function), expect.any(Object));
    });

    it('should clean up rotation and effects when ship is destroyed', () => {
        // Get the listener function
        const destroyListener = (ship.sprite.once as any).mock.calls.find((call: any[]) => call[0] === 'destroy')[1];
        const context = (ship.sprite.once as any).mock.calls.find((call: any[]) => call[0] === 'destroy')[2];

        expect(destroyListener).toBeDefined();

        // Mock a target effect being active
        const destroyEffectMock = vi.fn();
        const targetEffect = { destroy: destroyEffectMock, alpha: 1 };
        (controller as any).targetEffect = targetEffect;

        // Invoke the listener
        destroyListener.call(context);

        // Verify cleanup
        expect(scene.tweens.killTweensOf).toHaveBeenCalledWith(targetEffect);
        expect(destroyEffectMock).toHaveBeenCalled();
        expect((controller as any).targetEffect).toBeNull();
    });

    it('should not throw error if destroyed multiple times or no effects active', () => {
        const destroyListener = (ship.sprite.once as any).mock.calls.find((call: any[]) => call[0] === 'destroy')[1];
        const context = (ship.sprite.once as any).mock.calls.find((call: any[]) => call[0] === 'destroy')[2];

        // Ensure no effects
        (controller as any).targetEffect = null;

        // Should not throw
        expect(() => destroyListener.call(context)).not.toThrow();
    });

    // --- Drag Support Tests ---

    it('should set drag state on pointerdown via movement component', () => {
        const pointerDownHandler = scene.input.on.mock.calls.find((call: any[]) => call[0] === 'pointerdown')[1];
        const pointer = { worldX: 200, worldY: 300, isDown: true, x: 200, y: 300 };

        pointerDownHandler(pointer);

        // Check movement component's state
        expect((controller as any).movement.state.isDragging).toBe(true);
    });

    it('should update target on pointermove when dragging', () => {
        const pointerDownHandler = scene.input.on.mock.calls.find((call: any[]) => call[0] === 'pointerdown')[1];
        const pointerMoveHandler = scene.input.on.mock.calls.find((call: any[]) => call[0] === 'pointermove')[1];

        // Start dragging
        pointerDownHandler({ worldX: 100, worldY: 100, x: 100, y: 100 });

        // Move while dragging
        pointerMoveHandler({ worldX: 400, worldY: 500, x: 400, y: 500 });

        const target = (controller as any).movement.getTargetPosition();
        expect(target).toEqual(expect.objectContaining({ x: 400, y: 500 }));
    });

    it('should NOT update target on pointermove when NOT dragging', () => {
        const pointerMoveHandler = scene.input.on.mock.calls.find((call: any[]) => call[0] === 'pointermove')[1];
        const pointer = { worldX: 400, worldY: 500, x: 400, y: 500 };

        pointerMoveHandler(pointer);

        // Target should be null since we never started dragging
        expect((controller as any).movement.hasTarget()).toBe(false);
    });

    it('should reset drag state on pointerup', () => {
        const pointerDownHandler = scene.input.on.mock.calls.find((call: any[]) => call[0] === 'pointerdown')[1];
        const pointerUpHandler = scene.input.on.mock.calls.find((call: any[]) => call[0] === 'pointerup')[1];

        // Start dragging
        pointerDownHandler({ worldX: 100, worldY: 100, x: 100, y: 100 });
        expect((controller as any).movement.state.isDragging).toBe(true);

        // Release
        pointerUpHandler();
        expect((controller as any).movement.state.isDragging).toBe(false);
    });

    it('should move existing target effect instead of creating new one during drag', () => {
        // Setup existing target effect
        const existingEffect = { destroy: vi.fn(), setPosition: vi.fn(), alpha: 1 };
        (controller as any).targetEffect = existingEffect;

        // Simulate second tap (handleTargetInput)
        (controller as any).handleTargetInput(300, 400);

        // Should move, not destroy
        expect(existingEffect.destroy).not.toHaveBeenCalled();
        expect(existingEffect.setPosition).toHaveBeenCalledWith(300, 400);
    });
});
