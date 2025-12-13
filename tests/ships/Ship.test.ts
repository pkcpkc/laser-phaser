import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Ship } from '../../src/ships/ship';
import { Explosion } from '../../src/ships/effects/explosion';
import Phaser from 'phaser';

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Physics: {
                Matter: {
                    Image: class {
                        setAngle = vi.fn();
                        setFixedRotation = vi.fn();
                        setFrictionAir = vi.fn();
                        setMass = vi.fn();
                        setSleepThreshold = vi.fn();
                        setCollisionCategory = vi.fn();
                        setCollidesWith = vi.fn();
                        thrustBack = vi.fn();
                        destroy = vi.fn();
                        active = true;
                        x = 100;
                        y = 100;
                        rotation = 0;
                        scene = {};
                        width = 32;
                        height = 32;
                        setData = vi.fn();
                        setBounce = vi.fn();
                        setSensor = vi.fn();
                    }
                }
            }
        }
    };
});

// Mock Explosion
vi.mock('../../src/ships/effects/explosion', () => {
    return {
        Explosion: vi.fn()
    };
});

describe('Ship', () => {
    let ship: Ship;
    let mockScene: any;
    let mockConfig: any;
    let mockCollisionConfig: any;
    let mockLaserClass: any;
    let mockLaserInstance: any;

    beforeEach(() => {
        mockLaserInstance = {
            fire: vi.fn(),
            recoil: 5,
            createTexture: vi.fn(),
            visibleOnMount: false,
            TEXTURE_KEY: 'laser'
        };
        mockLaserClass = class {
            fire = mockLaserInstance.fire;
            recoil = mockLaserInstance.recoil;
            createTexture = mockLaserInstance.createTexture;
            visibleOnMount = mockLaserInstance.visibleOnMount;
            TEXTURE_KEY = mockLaserInstance.TEXTURE_KEY;
        };

        mockScene = {
            add: {
                existing: vi.fn(),
                sprite: vi.fn().mockReturnThis()
            },
            matter: {
                add: {
                    image: vi.fn().mockImplementation(() => new Phaser.Physics.Matter.Image(mockScene.matter.world, 0, 0, ''))
                }
            },
            time: {
                now: 0,
                delayedCall: vi.fn().mockImplementation((_delay, callback) => {
                    if (callback) callback();
                    return { remove: vi.fn() };
                })
            },
            textures: {
                exists: vi.fn().mockReturnValue(true)
            },
            registry: {
                values: {
                    levelConfigs: {}
                }
            }
        };

        mockConfig = {
            definition: {
                assetKey: 'ship',
                physics: {
                    initialAngle: 90,
                    fixedRotation: true,
                    frictionAir: 0.1,
                    mass: 10
                },
                explosion: {
                    someConfig: true
                },
                gameplay: {
                    speed: 5
                }
            },
            mounts: [{
                marker: { x: 10, y: 0, angle: 0 },
                weapon: mockLaserClass
            }]
        };

        mockCollisionConfig = {
            category: 1,
            collidesWith: [2],
            laserCategory: 4,
            laserCollidesWith: [8]
        };

        ship = new Ship(mockScene, 100, 100, mockConfig, mockCollisionConfig);
        (ship.sprite as any).scene = mockScene; // Fix for scene access
    });

    it('should initialize correctly', () => {
        expect(mockScene.matter.add.image).toHaveBeenCalledWith(100, 100, 'ship');
        expect(ship.sprite.setAngle).toHaveBeenCalledWith(90);
        expect(ship.sprite.setFixedRotation).toHaveBeenCalled();
        expect(ship.sprite.setFrictionAir).toHaveBeenCalledWith(0.1);
        expect(ship.sprite.setMass).toHaveBeenCalledWith(10);
        expect(ship.sprite.setCollisionCategory).toHaveBeenCalledWith(1);
        expect(ship.sprite.setCollidesWith).toHaveBeenCalledWith([2]);
    });

    it('should fire lasers', () => {
        ship.fireLasers();
        expect(mockLaserInstance.fire).toHaveBeenCalledWith(
            expect.anything(),
            94,
            84,
            0, // rotation
            4,
            [8]
        );
        expect(ship.sprite.thrustBack).toHaveBeenCalledWith(5);
    });

    it('should not fire lasers if sprite is inactive', () => {
        ship.sprite.active = false;
        ship.fireLasers();
        expect(mockLaserInstance.fire).not.toHaveBeenCalled();
    });

    it('should explode and destroy', () => {
        ship.explode();

        expect(Explosion).toHaveBeenCalled();
        expect(ship.sprite.destroy).toHaveBeenCalled();
    });

    it('should destroy correctly', () => {
        ship.destroy();
        expect(ship.sprite.destroy).toHaveBeenCalled();
    });

    it('should fire lasers from multiple mount points', () => {
        const multiMountConfig = {
            ...mockConfig,
            mounts: [
                { marker: { x: 10, y: 0, angle: 0 }, weapon: mockLaserClass },
                { marker: { x: -10, y: 0, angle: 180 }, weapon: mockLaserClass }
            ]
        };
        const multiMountShip = new Ship(mockScene, 100, 100, multiMountConfig, mockCollisionConfig);
        (multiMountShip.sprite as any).scene = mockScene;

        // Ensure sprite rotation is 0 for simplicity
        multiMountShip.sprite.rotation = 0;

        multiMountShip.fireLasers();

        expect(mockLaserInstance.fire).toHaveBeenCalledTimes(2);

        // First mount point: x=10, y=0, angle=0 -> absX=110, absY=100, absAngle=0
        expect(mockLaserInstance.fire).toHaveBeenCalledWith(
            expect.anything(),
            94,
            84,
            0,
            4,
            [8]
        );

        // Second mount point: x=-10, y=0, angle=180 -> absX=74, absY=84, absAngle=PI
        expect(mockLaserInstance.fire).toHaveBeenCalledWith(
            expect.anything(),
            74,
            84,
            Math.PI,
            4,
            [8]
        );
    });
});
