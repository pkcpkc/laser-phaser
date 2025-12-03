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
                        scene = {};
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
            recoil: 5
        };
        mockLaserClass = class {
            fire = mockLaserInstance.fire;
            recoil = mockLaserInstance.recoil;
        };

        mockScene = {
            matter: {
                add: {
                    image: vi.fn().mockImplementation(() => new Phaser.Physics.Matter.Image(mockScene.matter.world, 0, 0, ''))
                }
            }
        };

        mockConfig = {
            assetKey: 'ship',
            physics: {
                initialAngle: 90,
                fixedRotation: true,
                frictionAir: 0.1,
                mass: 10
            },
            mounts: {
                primary: mockLaserClass
            },
            explosion: {
                someConfig: true
            }
        };

        mockCollisionConfig = {
            category: 1,
            collidesWith: [2],
            laserCategory: 4,
            laserCollidesWith: [8]
        };

        ship = new Ship(mockScene, 100, 100, mockConfig, mockCollisionConfig);
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
            100,
            100,
            undefined, // rotation
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
});
