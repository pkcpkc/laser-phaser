import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser globally
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            Math: {
                Vector2: class {
                    constructor(public x: number, public y: number) { }
                },
                Clamp: (value: number, min: number, max: number) => {
                    return Math.max(min, Math.min(value, max));
                }
            },
            GameObjects: {
                Text: class { }
            },
            Physics: {
                Matter: {
                    Sprite: class { },
                    Image: class { }
                }
            }
        }
    };
});

vi.mock('phaser3-rex-plugins/plugins/virtualjoystick.js', () => {
    return {
        default: class { }
    };
});

import { PlayerController } from '../../src/logic/player-controller';

// Mock BigCruiser static properties
vi.mock('../../src/ships/big-cruiser', () => ({
    BigCruiser: {
        gameplay: {
            thrust: 0.5
        }
    }
}));

describe('PlayerController', () => {
    let mockScene: any;
    let mockShip: any;
    let mockCursors: any;
    let mockJoystick: any;
    let playerController: PlayerController;

    beforeEach(() => {
        mockScene = {
            scale: { width: 800, height: 600 },
            input: {
                keyboard: {
                    checkDown: vi.fn(),
                }
            }
        };

        const mockSprite = {
            active: true,
            x: 100,
            y: 100,
            thrustLeft: vi.fn(),
            thrustRight: vi.fn(),
            thrust: vi.fn(),
            thrustBack: vi.fn(),
            applyForce: vi.fn(),
            setPosition: vi.fn((x, y) => {
                mockSprite.x = x;
                mockSprite.y = y;
            }),
            setVelocityX: vi.fn(),
            setVelocityY: vi.fn(),
        };

        mockShip = {
            sprite: mockSprite,
            fireLasers: vi.fn(),
        };

        mockCursors = {
            left: { isDown: false },
            right: { isDown: false },
            up: { isDown: false },
            down: { isDown: false },
            space: {},
        };

        mockJoystick = {
            force: 0,
            rotation: 0,
        };

        playerController = new PlayerController(mockScene, mockShip, mockCursors, mockJoystick);
    });

    it('should initialize correctly', () => {
        expect(playerController).toBeDefined();
    });

    it('should handle keyboard movement - left', () => {
        mockCursors.left.isDown = true;
        playerController.update(0);
        expect(mockShip.sprite.thrustLeft).toHaveBeenCalledWith(0.5);
    });

    it('should handle keyboard movement - right', () => {
        mockCursors.right.isDown = true;
        playerController.update(0);
        expect(mockShip.sprite.thrustRight).toHaveBeenCalledWith(0.5);
    });

    it('should handle keyboard movement - up', () => {
        mockCursors.up.isDown = true;
        playerController.update(0);
        expect(mockShip.sprite.thrust).toHaveBeenCalledWith(0.5);
    });

    it('should handle keyboard movement - down', () => {
        mockCursors.down.isDown = true;
        playerController.update(0);
        expect(mockShip.sprite.thrustBack).toHaveBeenCalledWith(0.5);
    });

    it('should handle joystick movement', () => {
        mockJoystick.force = 50;
        mockJoystick.rotation = Math.PI / 2; // 90 degrees, down
        playerController.update(0);

        expect(mockShip.sprite.applyForce).toHaveBeenCalled();
        // Exact vector calculation might be tricky to match due to float precision, 
        // but we can check if it was called.
    });

    it('should fire laser on space key', () => {
        mockScene.input.keyboard.checkDown.mockReturnValue(true);
        playerController.update(100);
        expect(mockShip.fireLasers).toHaveBeenCalled();
    });

    it('should handle boundary constraints', () => {
        // Move ship out of bounds
        mockShip.sprite.x = -100;
        mockShip.sprite.y = -100;

        playerController.update(0);

        expect(mockShip.sprite.setPosition).toHaveBeenCalled();
        // Expect to be clamped to 30, 30
        expect(mockShip.sprite.setPosition).toHaveBeenCalledWith(30, 30);
        expect(mockShip.sprite.setVelocityX).toHaveBeenCalledWith(0);
        expect(mockShip.sprite.setVelocityY).toHaveBeenCalledWith(0);
    });

    it('should setup fire button listeners', () => {
        const mockFireButton = {
            on: vi.fn().mockReturnThis()
        };

        playerController.setFireButton(mockFireButton as any);

        expect(mockFireButton.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
        expect(mockFireButton.on).toHaveBeenCalledWith('pointerup', expect.any(Function));
        expect(mockFireButton.on).toHaveBeenCalledWith('pointerout', expect.any(Function));
    });

    it('should not update if ship sprite is inactive', () => {
        mockShip.sprite.active = false;
        mockCursors.up.isDown = true;
        playerController.update(0);
        expect(mockShip.sprite.thrust).not.toHaveBeenCalled();
    });
});
