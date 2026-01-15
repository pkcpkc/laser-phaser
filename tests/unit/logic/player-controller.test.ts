
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Phaser from 'phaser';

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
                Clamp: (val: number, min: number, max: number) => {
                    if (val < min) return min;
                    if (val > max) return max;
                    return val;
                }
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
                    scale: number = 1;
                    alpha: number = 1;
                    destroy = vi.fn();
                    setDepth = vi.fn();
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

// Mock Dependencies
vi.mock('../../../src/logic/player-movement');
vi.mock('../../../src/logic/player-rotation');
vi.mock('../../../src/logic/player-firing');

import { PlayerController } from '../../../src/logic/player-controller';
import { Ship } from '../../../src/ships/ship';
import { PlayerMovement } from '../../../src/logic/player-movement';
import { PlayerRotation } from '../../../src/logic/player-rotation';
import { PlayerFiring } from '../../../src/logic/player-firing';

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
        add: vi.fn((config) => {
            if (config.onComplete) {
                (this.tweens as any)._lastOnComplete = config.onComplete;
            }
            return { stop: vi.fn() };
        }),
        killTweensOf: vi.fn()
    } as any;
    add = {
        circle: vi.fn(() => ({
            setDepth: vi.fn(),
            destroy: vi.fn(),
            setPosition: vi.fn(),
            alpha: 1,
            x: 0,
            y: 0
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
        setPosition: vi.fn((x, y) => { this.sprite.x = x; this.sprite.y = y; }),
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

    // Mocks
    let mockMovement: any;
    let mockRotation: any;
    let mockFiring: any;

    beforeEach(() => {
        scene = new MockScene();
        ship = new MockShip();
        ship.sprite.scene = scene;
        cursors = scene.input.keyboard!.createCursorKeys();

        // Reset mocks
        vi.clearAllMocks();

        // Setup mock implementations
        mockMovement = {
            state: { isDragging: false },
            setDragging: vi.fn((val) => mockMovement.state.isDragging = val),
            setTarget: vi.fn(),
            getTargetPosition: vi.fn(),
            hasTarget: vi.fn(),
            clearTarget: vi.fn(),
            updateKeyboard: vi.fn(),
            updateTargetMovement: vi.fn().mockReturnValue({ arrived: false, isDecelerating: false, angle: null })
        };
        (PlayerMovement as any).mockImplementation(function () { return mockMovement; });

        mockRotation = {
            destroy: vi.fn(),
            setMoving: vi.fn(),
            returnToUpright: vi.fn(),
            pointToAngle: vi.fn()
        };
        (PlayerRotation as any).mockImplementation(function () { return mockRotation; });

        mockFiring = {
            update: vi.fn(),
            isClickingFireButton: vi.fn(),
            setFireButton: vi.fn()
        };
        (PlayerFiring as any).mockImplementation(function () { return mockFiring; });

        controller = new PlayerController(scene as unknown as Phaser.Scene, ship as unknown as Ship, cursors);
    });

    it('should register onDestroy listener on creation', () => {
        expect(ship.sprite.once).toHaveBeenCalledWith('destroy', expect.any(Function), expect.any(Object));
    });

    it('should clean up rotation and effects when ship is destroyed', () => {
        const destroyListener = (ship.sprite.once as any).mock.calls.find((call: any[]) => call[0] === 'destroy')[1];
        const context = (ship.sprite.once as any).mock.calls.find((call: any[]) => call[0] === 'destroy')[2];

        const destroyEffectMock = vi.fn();
        const targetEffect = { destroy: destroyEffectMock, alpha: 1 };
        (controller as any).targetEffect = targetEffect;

        destroyListener.call(context);

        expect(scene.tweens.killTweensOf).toHaveBeenCalledWith(targetEffect);
        expect(destroyEffectMock).toHaveBeenCalled();
        expect((controller as any).targetEffect).toBeNull();
        expect(mockRotation.destroy).toHaveBeenCalled();
    });

    it('should update firing component', () => {
        controller.update(100);
        expect(mockFiring.update).toHaveBeenCalledWith(100);
    });

    it('should set fire button on firing component', () => {
        const mockBtn = {} as any;
        controller.setFireButton(mockBtn);
        expect(mockFiring.setFireButton).toHaveBeenCalledWith(mockBtn);
    });

    it('should set drag state on pointerdown', () => {
        const pointerDownHandler = scene.input.on.mock.calls.find((call: any[]) => call[0] === 'pointerdown')[1];
        mockFiring.isClickingFireButton.mockReturnValue(false);

        pointerDownHandler({ worldX: 200, worldY: 300 });

        expect(mockMovement.setDragging).toHaveBeenCalledWith(true);
        expect(mockMovement.setTarget).toHaveBeenCalledWith(200, 300);
    });

    it('should update target on pointermove when dragging', () => {
        const pointerMoveHandler = scene.input.on.mock.calls.find((call: any[]) => call[0] === 'pointermove')[1];

        mockMovement.state.isDragging = true;
        mockMovement.getTargetPosition.mockReturnValue({ x: 400, y: 500 });

        pointerMoveHandler({ worldX: 400, worldY: 500 });

        expect(mockMovement.setTarget).toHaveBeenCalledWith(400, 500);
    });

    it('should not update if ship is not active', () => {
        ship.sprite.active = false;
        controller.update(100);
        expect(mockFiring.update).not.toHaveBeenCalled();
    });

    it('should use keyboard movement if active', () => {
        mockMovement.updateKeyboard.mockReturnValue(true);
        controller.update(100);

        expect(mockMovement.updateKeyboard).toHaveBeenCalledWith(cursors);
        expect(mockMovement.updateTargetMovement).not.toHaveBeenCalled();
    });

    it('should use target movement if not moving with keys', () => {
        mockMovement.updateKeyboard.mockReturnValue(false);
        mockMovement.hasTarget.mockReturnValue(true);

        controller.update(100);

        expect(mockMovement.updateTargetMovement).toHaveBeenCalled();
    });

    it('should handle target arrival', () => {
        mockMovement.updateKeyboard.mockReturnValue(false);
        mockMovement.hasTarget.mockReturnValue(true);
        mockMovement.updateTargetMovement.mockReturnValue({ arrived: true });

        controller.update(100);

        expect(mockRotation.setMoving).toHaveBeenCalled();
        expect(mockRotation.returnToUpright).toHaveBeenCalled();
    });

    it('should handle target deceleration', () => {
        mockMovement.updateKeyboard.mockReturnValue(false);
        mockMovement.hasTarget.mockReturnValue(true);
        mockMovement.updateTargetMovement.mockReturnValue({ arrived: false, isDecelerating: true });

        controller.update(100);

        expect(mockRotation.returnToUpright).toHaveBeenCalled();
    });

    it('should point to angle during target movement', () => {
        mockMovement.updateKeyboard.mockReturnValue(false);
        mockMovement.hasTarget.mockReturnValue(true);
        mockMovement.updateTargetMovement.mockReturnValue({ arrived: false, isDecelerating: false, angle: 1.5 });

        controller.update(100);

        expect(mockRotation.pointToAngle).toHaveBeenCalledWith(1.5);
    });

    it('should clamp ship position to screen bounds', () => {
        ship.sprite.x = 900;
        ship.sprite.y = -50;

        controller.update(100);

        expect(ship.sprite.setPosition).toHaveBeenCalledWith(800, 0);
        expect(ship.sprite.setVelocityX).toHaveBeenCalledWith(0);
        expect(ship.sprite.setVelocityY).toHaveBeenCalledWith(0);
        expect(mockRotation.returnToUpright).toHaveBeenCalled();
    });

    it('should clear target if hitting wall while moving to target', () => {
        ship.sprite.x = 900;
        mockMovement.hasTarget.mockReturnValue(true);

        controller.update(100);

        expect(mockMovement.clearTarget).toHaveBeenCalled();
    });

    it('should cleanup target effect on tween complete', () => {
        mockMovement.getTargetPosition.mockReturnValue({ x: 100, y: 100 });
        const pointerDown = scene.input.on.mock.calls.find((c: any) => c[0] === 'pointerdown')[1];
        mockFiring.isClickingFireButton.mockReturnValue(false);
        pointerDown({ worldX: 100, worldY: 100 });

        const tweenConfig = scene.tweens.add.mock.calls[0][0];
        expect(tweenConfig).toBeDefined();

        const effect = scene.add.circle.mock.results[0].value;

        effect.alpha = 0;
        tweenConfig.onComplete();

        expect(effect.destroy).toHaveBeenCalled();
    });

    it('should destroy previous target effect if new one created', () => {
        mockMovement.getTargetPosition.mockReturnValue({ x: 100, y: 100 });
        const pointerDown = scene.input.on.mock.calls.find((c: any) => c[0] === 'pointerdown')[1];

        pointerDown({ worldX: 100, worldY: 100 });
        const effect1 = scene.add.circle.mock.results[0].value;
        (controller as any).targetEffect = effect1;

        pointerDown({ worldX: 200, worldY: 200 });
        expect(effect1.setPosition).toHaveBeenCalledWith(100, 100);
    });
});
