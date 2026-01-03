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
                } // Added Arc for targetEffect
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
import Phaser from 'phaser'; // This will now import the mock

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
            setPosition: vi.fn(), // Mock setPosition
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
}

describe('PlayerController', () => {
    let scene: MockScene;
    let ship: MockShip;
    let controller: PlayerController;
    let cursors: any;

    beforeEach(() => {
        scene = new MockScene();
        ship = new MockShip();
        ship.sprite.scene = scene; // meaningful reference
        cursors = scene.input.keyboard!.createCursorKeys();

        controller = new PlayerController(scene as unknown as Phaser.Scene, ship as unknown as Ship, cursors);
    });

    it('should register onDestroy listener on creation', () => {
        expect(ship.sprite.once).toHaveBeenCalledWith('destroy', expect.any(Function), expect.any(Object));
    });

    it('should clean up tweens when ship is destroyed', () => {
        // Trigger movement to start a tween (simulated)
        // Access private method or just simulate the state if possible, 
        // but since we can't easily trigger private methods, we'll verify the listener works.

        // Get the listener function
        const destroyListener = (ship.sprite.once as any).mock.calls.find((call: any[]) => call[0] === 'destroy')[1];
        const context = (ship.sprite.once as any).mock.calls.find((call: any[]) => call[0] === 'destroy')[2];

        expect(destroyListener).toBeDefined();

        // Mock a tween being active
        const stopMock = vi.fn();
        (controller as any).tiltTween = { stop: stopMock };

        // Mock a target effect being active
        const destroyEffectMock = vi.fn();
        const targetEffect = { destroy: destroyEffectMock };
        (controller as any).targetEffect = targetEffect;

        // Invoke the listener
        destroyListener.call(context);

        // Verify cleanup
        expect(stopMock).toHaveBeenCalled();
        expect(scene.tweens.killTweensOf).toHaveBeenCalledWith(targetEffect);
        expect(destroyEffectMock).toHaveBeenCalled();
        expect((controller as any).tiltTween).toBeNull();
        expect((controller as any).targetEffect).toBeNull();
    });

    it('should not throw error if destroyed multiple times or no tweens active', () => {
        const destroyListener = (ship.sprite.once as any).mock.calls.find((call: any[]) => call[0] === 'destroy')[1];
        const context = (ship.sprite.once as any).mock.calls.find((call: any[]) => call[0] === 'destroy')[2];

        // Ensure no tweens
        (controller as any).tiltTween = null;
        (controller as any).targetEffect = null;

        // Should not throw
        expect(() => destroyListener.call(context)).not.toThrow();
    });

    // --- Drag Support Tests ---

    it('should set drag state and target on pointerdown', () => {
        const pointerDownHandler = scene.input.on.mock.calls.find((call: any[]) => call[0] === 'pointerdown')[1];
        const pointer = { worldX: 200, worldY: 300, isDown: true };

        pointerDownHandler(pointer);

        // Check if isDragging is true (private property, cast to any)
        expect((controller as any).isDragging).toBe(true);
        // Check if targetPosition was updated
        expect((controller as any).targetPosition).toEqual(expect.objectContaining({ x: 200, y: 300 }));
    });

    it('should update target on pointermove when dragging', () => {
        // Activate drag
        (controller as any).isDragging = true;

        const pointerMoveHandler = scene.input.on.mock.calls.find((call: any[]) => call[0] === 'pointermove')[1];
        const pointer = { worldX: 400, worldY: 500 };

        pointerMoveHandler(pointer);

        expect((controller as any).targetPosition).toEqual(expect.objectContaining({ x: 400, y: 500 }));
    });

    it('should NOT update target on pointermove when NOT dragging', () => {
        // Deactivate drag
        (controller as any).isDragging = false;
        // Set an initial target
        const initialTarget = { x: 100, y: 100 };
        (controller as any).targetPosition = initialTarget;

        const pointerMoveHandler = scene.input.on.mock.calls.find((call: any[]) => call[0] === 'pointermove')[1];
        const pointer = { worldX: 400, worldY: 500 };

        pointerMoveHandler(pointer);

        // Target should be unchanged
        expect((controller as any).targetPosition).toEqual(initialTarget);
    });

    it('should reset drag state on pointerup', () => {
        (controller as any).isDragging = true;
        const pointerUpHandler = scene.input.on.mock.calls.find((call: any[]) => call[0] === 'pointerup')[1];

        pointerUpHandler();

        expect((controller as any).isDragging).toBe(false);
    });

    it('should move existing target effect instead of creating new one during updates', () => {
        // Setup existing target effect
        const existingEffect = { destroy: vi.fn(), setPosition: vi.fn() };
        (controller as any).targetEffect = existingEffect;

        // Directly call setTarget (private)
        (controller as any).setTarget(300, 400);

        // Should move, not destroy
        expect(existingEffect.destroy).not.toHaveBeenCalled();
        expect(existingEffect.setPosition).toHaveBeenCalledWith(300, 400);
        expect(scene.add.circle).not.toHaveBeenCalled(); // No new circle added
    });
});
