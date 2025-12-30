import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseLaser } from '../../../../src/ships/modules/lasers/base-laser';
// import Phaser from 'phaser';

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
                        setVelocityX = vi.fn();
                        setVelocityY = vi.fn(); // Projectile calls this
                        setScale = vi.fn();
                        destroy = vi.fn();
                        once = vi.fn();
                        x = 0;
                        y = 0;
                        active = true;
                        scene: any;
                        constructor(world: any, x: number, y: number, _texture: string) {
                            this.x = x;
                            this.y = y;
                            this.scene = world.scene;
                        }
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
    readonly damage = 10;
}

describe('BaseLaser', () => {
    let laser: TestLaser;
    let mockScene: any;

    beforeEach(() => {
        const mockWorld = { scene: null };

        mockScene = {
            make: {
                graphics: vi.fn().mockReturnValue({
                    fillStyle: vi.fn(),
                    fillRect: vi.fn(),
                    fillCircle: vi.fn(),
                    generateTexture: vi.fn(),
                    destroy: vi.fn()
                })
            },
            textures: {
                exists: vi.fn().mockReturnValue(false)
            },
            matter: {
                world: mockWorld
            },
            time: {
                now: 1000,
                delayedCall: vi.fn()
            },
            scale: {
                width: 800,
                height: 600
            },
            add: {
                existing: vi.fn(),
                particles: vi.fn().mockReturnValue({
                    emitParticleAt: vi.fn(),
                    destroy: vi.fn()
                })
            },
            events: {
                on: vi.fn(),
                off: vi.fn()
            },
            cameras: {
                main: {
                    scrollX: 0,
                    scrollY: 0,
                    width: 800,
                    height: 600
                }
            }
        };
        mockWorld.scene = mockScene;

        laser = new TestLaser();
    });

    it('should create texture if not exists', () => {
        laser.createTexture(mockScene);
        expect(mockScene.make.graphics).toHaveBeenCalled();
        expect(mockScene.textures.exists).toHaveBeenCalledWith('test-laser');
    });

    it('should fire and setup projectile', () => {
        const result = laser.fire(mockScene, 100, 100, 0, 2, 4);

        expect(result).toBeDefined();
        // Check if added to scene
        expect(mockScene.add.existing).toHaveBeenCalledWith(result);

        // Check Physics init
        expect(result?.setFrictionAir).toHaveBeenCalledWith(0);
        expect(result?.setFixedRotation).toHaveBeenCalled();
        expect(result?.setRotation).toHaveBeenCalledWith(0);
        // setVelocity is called by Projectile
        expect(result?.setVelocity).toHaveBeenCalledWith(10, 0);
        expect(result?.setCollisionCategory).toHaveBeenCalledWith(2);
        expect(result?.setCollidesWith).toHaveBeenCalledWith(4);
    });

    it('should handle boundary checks in preUpdate', () => {
        // We need to simulate the Projectile behavior. 
        // Since we are mocking Phaser.Physics.Matter.Image, we need to ensure our Mock class or the returned object has preUpdate.
        // But Projectile defines preUpdate. So 'result' is an instance of Projectile (which extends Mock Image).

        const result: any = laser.fire(mockScene, 100, 100, 0, 2, 4);

        // In bounds logic
        result.x = 400;
        result.y = 300;
        // Projectile.preUpdate(time, delta)
        result.preUpdate(2000, 16);
        expect(result.destroy).not.toHaveBeenCalled();

        // Out of bounds logic (camera bounds + margin 100)
        // Camera 0,0 800x600. Margin 100.
        // Bounds: -100 to 900 x, -100 to 700 y.

        result.x = -200; // Left
        result.preUpdate(3000, 16);
        expect(result.destroy).toHaveBeenCalled();
    });
});
