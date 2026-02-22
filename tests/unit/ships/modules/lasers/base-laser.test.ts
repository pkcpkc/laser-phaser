import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseLaser } from '../../../../../src/ships/modules/lasers/base-laser';

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
                        setVelocityY = vi.fn();
                        setScale = vi.fn();
                        setActive = vi.fn();
                        setVisible = vi.fn();
                        setPosition = vi.fn();
                        setAngularVelocity = vi.fn();
                        setAwake = vi.fn();
                        destroy = vi.fn();
                        once = vi.fn();
                        x = 0;
                        y = 0;
                        active = true;
                        scene: any;
                        hitColor = 0;
                        isRocket = false;
                        constructor(world: any, x: number, y: number, _texture: string) {
                            this.x = x;
                            this.y = y;
                            if (world?.scene) this.scene = world.scene;
                        }
                    }
                }
            },
            Scene: class { },
            Math: {
                // ..
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
    let mockParticles: any;
    let mockEvents: any;

    beforeEach(() => {
        // Reset BaseLaser static state between tests
        (BaseLaser as any).globalEmitters = new Map();

        mockEvents = {
            on: vi.fn(),
            off: vi.fn(),
            once: vi.fn()
        };

        mockParticles = {
            emitParticleAt: vi.fn(),
            destroy: vi.fn(),
            setDepth: vi.fn()
        };

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
                delayedCall: vi.fn((_delay, callback) => callback())

            },
            scale: {
                width: 800,
                height: 600
            },
            add: {
                existing: vi.fn(),
                particles: vi.fn().mockReturnValue(mockParticles)
            },
            events: mockEvents,
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

    it('should fire and setup projectile with trail effects', () => {
        const result: any = laser.fire(mockScene, 100, 100, 0, 2, 4);

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

        // Check Trail Effect - particles emitter created
        expect(mockScene.add.particles).toHaveBeenCalledWith(0, 0, 'test-laser-trail', expect.objectContaining({
            lifespan: 150,
            blendMode: 'ADD',
            emitting: false
        }));

        // Check that particles depth is set
        expect(mockParticles.setDepth).toHaveBeenCalledWith(-1);

        // Check that emitTrail hook was added to the projectile
        expect(typeof result.emitTrail).toBe('function');
    });

    it('should emit particles via preUpdate hook', () => {
        const result: any = laser.fire(mockScene, 100, 100, 0, 2, 4);

        // Simulate update with active laser
        result.active = true;
        result.x = 150;
        result.y = 150;

        // Call preUpdate which should trigger emitTrail
        result.preUpdate(2000, 16);

        expect(mockParticles.emitParticleAt).toHaveBeenCalledWith(150, 150);
    });

    it('should register shutdown cleanup for emitters', () => {
        laser.fire(mockScene, 100, 100, 0, 2, 4);

        // Check that shutdown cleanup was registered
        expect(mockEvents.once).toHaveBeenCalledWith('shutdown', expect.any(Function));
    });

    it('should handle boundary checks', () => {
        const result: any = laser.fire(mockScene, 100, 100, 0, 2, 4);

        // In bounds logic
        result.x = 400;
        result.y = 300;
        // Projectile.preUpdate(time, delta)
        result.preUpdate(2000, 16);
        expect(result.destroy).not.toHaveBeenCalled();

        // Out of bounds logic
        result.x = -200; // Left
        result.preUpdate(3000, 16);
        expect(result.destroy).toHaveBeenCalled();
    });
});
