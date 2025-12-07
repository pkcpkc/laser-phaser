import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseLaser } from '../../../../src/ships/mounts/lasers/base-laser';
import Phaser from 'phaser';

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Physics: {
                Matter: {
                    Image: class {
                        setFrictionAir = vi.fn();
                        setFixedRotation = vi.fn();
                        setSleepThreshold = vi.fn();
                        setRotation = vi.fn();
                        setVelocity = vi.fn();
                        setCollisionCategory = vi.fn();
                        setCollidesWith = vi.fn();
                        setOnCollide = vi.fn();
                        destroy = vi.fn();
                        x = 0;
                        y = 0;
                        active = true;
                    }
                }
            },
            Scene: class { },
            Math: {
                // ...
            }
        }
    };
});

class TestLaser extends BaseLaser {
    readonly TEXTURE_KEY = 'test-laser';
    readonly COLOR = 0xff0000;
    readonly SPEED = 10;
    readonly width = 10;
    readonly height = 20;
}

describe('BaseLaser', () => {
    let laser: TestLaser;
    let mockScene: any;
    let mockLaserImage: any;
    let mockTimer: any;

    beforeEach(() => {
        mockTimer = {
            remove: vi.fn()
        };

        mockScene = {
            make: {
                graphics: vi.fn().mockReturnValue({
                    fillStyle: vi.fn(),
                    fillRect: vi.fn(),
                    generateTexture: vi.fn(),
                    destroy: vi.fn()
                })
            },
            textures: {
                exists: vi.fn().mockReturnValue(false)
            },
            matter: {
                add: {
                    image: vi.fn().mockReturnValue(null) // Circular dependency if we use mockLaserImage here before init? No.
                },
                world: {}
            },
            time: {
                addEvent: vi.fn().mockReturnValue(mockTimer)
            },
            scale: {
                width: 800,
                height: 600
            }
        };

        // Use the mocked world
        mockLaserImage = new Phaser.Physics.Matter.Image(mockScene.matter.world as any, 0, 0, '');
        // Update the add.image mock to return our created image
        mockScene.matter.add.image.mockReturnValue(mockLaserImage);

        laser = new TestLaser();
    });

    it('should create texture if not exists', () => {
        laser.createTexture(mockScene);
        expect(mockScene.make.graphics).toHaveBeenCalled();
        expect(mockScene.textures.exists).toHaveBeenCalledWith('test-laser');
    });

    it('should fire and setup physics', () => {
        const result = laser.fire(mockScene, 100, 100, 0, 2, 4);

        expect(mockScene.matter.add.image).toHaveBeenCalledWith(100, 100, 'test-laser');
        expect(result).toBe(mockLaserImage);

        expect(mockLaserImage.setFrictionAir).toHaveBeenCalledWith(0);
        expect(mockLaserImage.setFixedRotation).toHaveBeenCalled();
        expect(mockLaserImage.setRotation).toHaveBeenCalledWith(0);
        expect(mockLaserImage.setVelocity).toHaveBeenCalledWith(10, 0); // 0 degrees
        expect(mockLaserImage.setCollisionCategory).toHaveBeenCalledWith(2);
        expect(mockLaserImage.setCollidesWith).toHaveBeenCalledWith(4);
    });

    it('should handle boundary checks in timer callback', () => {
        laser.fire(mockScene, 100, 100, 0, 2, 4);

        const timerCallback = mockScene.time.addEvent.mock.calls[0][0].callback;

        // In bounds
        mockLaserImage.x = 400;
        mockLaserImage.y = 300;
        timerCallback();
        expect(mockLaserImage.destroy).not.toHaveBeenCalled();

        // Out of bounds
        mockLaserImage.x = -200;
        timerCallback();
        expect(mockLaserImage.destroy).toHaveBeenCalled();
        expect(mockTimer.remove).toHaveBeenCalled();
    });

    it('should handle collision cleanup', () => {
        laser.fire(mockScene, 100, 100, 0, 2, 4);
        const collideCallback = mockLaserImage.setOnCollide.mock.calls[0][0];

        // Collide with world (no gameObject)
        collideCallback({ bodyB: { gameObject: null } });
        expect(mockLaserImage.destroy).toHaveBeenCalled();
        expect(mockTimer.remove).toHaveBeenCalled();
    });
});
