
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
                Arc: class { }
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
            destroy: vi.fn()
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
        x: 400,
        y: 300,
        angle: -90, // Upright
        setAngle: vi.fn((angle) => { this.sprite.angle = angle; }),
        setPosition: vi.fn((x, y) => { this.sprite.x = x; this.sprite.y = y; }),
        setVelocity: vi.fn(),
        setVelocityX: vi.fn(),
        setVelocityY: vi.fn(),
        once: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        destroy: vi.fn(),
        scene: {} as any,
        thrust: vi.fn(),
        thrustLeft: vi.fn(),
        thrustRight: vi.fn(),
        thrustBack: vi.fn()
    };
    fireLasers = vi.fn();
    config = {
        modules: []
    };
    maxSpeed = 10;
}

describe('PlayerController Edge Rotation', () => {
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

    it('should rotate back to upright when hitting the edge while moving to target', () => {
        // 1. Set target outside the screen (e.g., x = 900, screen width = 800)
        (controller as any).setTarget(900, 300);

        // 2. Mock Angle.BetweenPoints to return 0 (0 radians = right)
        vi.spyOn(Phaser.Math.Angle, 'BetweenPoints').mockReturnValue(0);

        // 3. Run an update to start moving
        controller.update(100);

        // Ensure the controller knows we are moving/tilted
        (controller as any).currentTiltDirection = 'moving';

        // 4. Move ship past the edge boundary (x > 800)
        ship.sprite.x = 850;

        // Reset calls to verify new calls
        scene.tweens.add.mockClear();

        // 5. Run update - this should trigger the boundary check and return to upright
        controller.update(200);

        // 6. Expect returnToUpright to be called (which adds a tween to -90)
        const tweenCalls = scene.tweens.add.mock.calls;
        const uprightTween = tweenCalls.find((call: any[]) => call[0].angle === -90);

        expect(uprightTween).toBeDefined();

        // Also verify targetPosition is cleared
        expect((controller as any).targetPosition).toBeNull();
    });
});
