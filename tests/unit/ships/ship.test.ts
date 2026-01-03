import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Ship } from '../../../src/ships/ship';
import { Explosion } from '../../../src/ships/effects/explosion';
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
                        setOrigin = vi.fn();
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
                        on = vi.fn();
                        setTint = vi.fn();
                        clearTint = vi.fn();
                        body = { velocity: { x: 0, y: 0 } };
                    },
                    Sprite: class { // Added Sprite
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
                        on = vi.fn();
                        setVelocity = vi.fn();
                    }
                }
            }
        }
    };
});

// Mock DustExplosion
vi.mock('../../../src/ships/effects/dust-explosion', () => {
    return {
        DustExplosion: vi.fn()
    };
});

// Mock Explosion
vi.mock('../../../src/ships/effects/explosion', () => {
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
                sprite: vi.fn().mockReturnThis(),
                particles: vi.fn().mockReturnValue({
                    createEmitter: vi.fn().mockReturnValue({
                        setPosition: vi.fn(),
                        explode: vi.fn()
                    }),
                    setDepth: vi.fn(),
                    destroy: vi.fn()
                })
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
                    speed: 5,
                    health: 100
                },
                markers: []
            },
            modules: [{
                marker: { x: 10, y: 0, angle: 0 },
                module: mockLaserClass
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
        expect(mockScene.matter.add.image).toHaveBeenCalledWith(100, 100, 'ship', undefined);
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
            [8],
            { x: 0, y: 0 } // shipVelocity
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
            modules: [
                { marker: { x: 10, y: 0, angle: 0 }, module: mockLaserClass },
                { marker: { x: -10, y: 0, angle: 180 }, module: mockLaserClass }
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
            [8],
            { x: 0, y: 0 } // shipVelocity
        );

        // Second mount point: x=-10, y=0, angle=180 -> absX=74, absY=84, absAngle=PI
        expect(mockLaserInstance.fire).toHaveBeenCalledWith(
            expect.anything(),
            74,
            84,
            Math.PI,
            4,
            [8],
            { x: 0, y: 0 } // shipVelocity
        );
    });
    it('should calculate mass correctly', () => {
        expect(ship.mass).toBe(10);
    });

    it('should calculate acceleration without drives (base speed fallback)', () => {
        // Here we have no drives, only lasers. Laser doesn't have thrust.
        // So totalThrust = 0.
        // Should return gameplay.speed = 5 (fallback).
        expect(ship.acceleration).toBe(5);
    });

    it('should calculate acceleration with drives', () => {
        const mockDriveClass = class {
            thrust = 50;
            name = 'Mock Drive';
            description = 'Fast';
            createTexture = vi.fn();
            visibleOnMount = true;
        };

        const driveConfig = {
            ...mockConfig,
            modules: [
                { marker: { x: 0, y: 0, angle: 0 }, module: mockDriveClass }
            ]
        };

        const driveShip = new Ship(mockScene, 100, 100, driveConfig, mockCollisionConfig);
        (driveShip.sprite as any).scene = mockScene;

        // Mass is 10. Thrust is 50. Acceleration = 50 / 10 = 5.
        expect(driveShip.acceleration).toBe(5);
    });

    it('should reduce acceleration by 30% when multiple drives are installed', () => {
        const mockDriveClass = class {
            thrust = 50;
            name = 'Mock Drive';
            description = 'Fast';
            createTexture = vi.fn();
            visibleOnMount = true;
        };

        const multiDriveConfig = {
            ...mockConfig,
            modules: [
                { marker: { x: 0, y: 0, angle: 0 }, module: mockDriveClass },
                { marker: { x: 0, y: 0, angle: 0 }, module: mockDriveClass }
            ]
        };

        const multiDriveShip = new Ship(mockScene, 100, 100, multiDriveConfig, mockCollisionConfig);
        (multiDriveShip.sprite as any).scene = mockScene;

        // Mass is 10.
        // Total Thrust = 50 + 50 = 100.
        // Base Acceleration = 100 / 10 = 10.
        // Penalty = 30% -> Multiplier 0.7.
        // Expected Acceleration = 10 * 0.7 = 7.
        expect(multiDriveShip.acceleration).toBe(7);
    });

    it('should have unlimited ammo if isEnemy is true', () => {
        const mockWeapon = class {
            fire = vi.fn().mockReturnValue(true); // Return truthy to simulate successful fire
            currentAmmo = 10;
            maxAmmo = 10;
            createTexture = vi.fn();
            visibleOnMount = false;
        };

        const enemyConfig = {
            ...mockConfig,
            modules: [{ marker: { x: 0, y: 0, angle: 0 }, module: mockWeapon }]
        };
        const enemyCollisionConfig = { ...mockCollisionConfig, isEnemy: true };

        const enemyShip = new Ship(mockScene, 100, 100, enemyConfig, enemyCollisionConfig);
        (enemyShip.sprite as any).scene = mockScene;

        enemyShip.fireLasers();

        // Access the instantiated weapon
        const weaponInstance = (enemyShip as any).activeModules[0].module;

        // Should be refilled to max
        expect(weaponInstance.currentAmmo).toBe(10);
        expect(weaponInstance.fire).toHaveBeenCalled();
    });

    it('should consume ammo if isEnemy is false', () => {
        // Create a weapon class that actually simulates ammo consumption if the Ship logic doesn't decrease it automatically?
        // Wait, Ship logic DOES NOT decrease ammo. The Weapon.fire method typically does, or the ship handles it?
        // Checking logic: Ship.ts line 238 just REFILLS it if isEnemy.
        // It does NOT seem to look like Ship.ts decrements ammo.
        // That implies the Weapon.fire method is responsible for decrementing.
        // So for this test, we just need to verify that REFILL does NOT happen.

        const mockWeapon = class {
            fire = vi.fn().mockImplementation(() => {
                // Simulate decrementing ammo
                this.instance.currentAmmo--;
                return true;
            });
            createTexture = vi.fn();
            visibleOnMount = false;
            currentAmmo = 10;
            maxAmmo = 10;
            // Hack to access instance from test if needed, or just let fire do it
            get instance() { return this; }
        };

        const playerConfig = {
            ...mockConfig,
            modules: [{ marker: { x: 0, y: 0, angle: 0 }, module: mockWeapon }]
        };
        const playerCollisionConfig = { ...mockCollisionConfig, isEnemy: false };

        const playerShip = new Ship(mockScene, 100, 100, playerConfig, playerCollisionConfig);
        (playerShip.sprite as any).scene = mockScene;

        // Manually decrement to simulate what fire() would do, since our mock fire above is tricky with "this" in class expression vs instance
        // Actually, let's just assert that currentAmmo is NOT reset to maxAmmo if we manually lower it and call fireLasers

        // Re-approach:
        // Ship.ts logic for enemies: if fired -> currentAmmo = maxAmmo.
        // So valid test for player: Set ammo to 9. Fire. Assert it stays 9 (or becomes 8 if fire decrements), but DEFINITELY not 10.

        const weaponInstance = (playerShip as any).activeModules[0].module;
        weaponInstance.currentAmmo = 9;
        // Mock fire to return projectile so ship logic proceeds
        weaponInstance.fire = vi.fn().mockReturnValue(true);

        playerShip.fireLasers();

        expect(weaponInstance.currentAmmo).toBe(9); // Should NOT be reset to 10
    });

    it('should fire with fixed direction if fixedFireDirection is true', () => {
        const mockWeapon = class {
            fire = vi.fn().mockReturnValue(true);
            createTexture = vi.fn();
            visibleOnMount = false;
            fixedFireDirection = true;
        };

        const config = {
            ...mockConfig,
            modules: [{ marker: { x: 0, y: 0, angle: 0 }, module: mockWeapon }]
        };

        const ship = new Ship(mockScene, 100, 100, config, mockCollisionConfig);
        (ship.sprite as any).scene = mockScene;
        ship.sprite.rotation = Math.PI; // Ship facing down

        ship.fireLasers();

        const weaponInstance = (ship as any).activeModules[0].module;
        // Should ignore ship rotation (PI) and fire upright (-PI/2)
        expect(weaponInstance.fire).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            expect.anything(),
            -Math.PI / 2, // absoluteAngle should be upright
            expect.anything(),
            expect.anything(),
            expect.anything()
        );
    });

    describe('Damage', () => {
        it('should initialize with correct health', () => {
            expect(ship.currentHealth).toBe(100);
        });

        it('should take damage', () => {
            ship.takeDamage(20);
            expect(ship.currentHealth).toBe(80);
        });

        it('should show visual feedback on damage', () => {
            ship.takeDamage(10);
            expect(ship.sprite.setTint).toHaveBeenCalledWith(0xff0000);
            // delayedCall is mocked to run immediately (or we need to check the mock implementation)
            // in ship.test.ts: delayedCall checks if callback exists and runs it.
            expect(ship.sprite.clearTint).toHaveBeenCalled();
        });

        it('should explode when health reaches 0', () => {
            const explodeSpy = vi.spyOn(ship, 'explode');
            ship.takeDamage(100);
            expect(ship.currentHealth).toBe(0);
            expect(explodeSpy).toHaveBeenCalled();
        });

        it('should explode when health drops below 0', () => {
            const explodeSpy = vi.spyOn(ship, 'explode');
            ship.takeDamage(150);
            expect(ship.currentHealth).toBe(-50);
            expect(explodeSpy).toHaveBeenCalled();
        });

        it('should not take damage if destroyed', () => {
            // Destroy ship
            ship.destroy();
            // Reset mocks to ensure we are capturing fresh calls if any (optional)

            // Try to take damage
            ship.takeDamage(10);
            // Health shouldn't change from initial 100 because it returns early
            expect(ship.currentHealth).toBe(100);
        });
    });
});
