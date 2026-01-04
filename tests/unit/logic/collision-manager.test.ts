import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollisionManager } from '../../../src/logic/collision-manager';

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Physics: {
                Matter: {
                    Events: {},
                    Image: class { }
                }
            },
            GameObjects: {
                GameObject: class { }
            }
        }
    };
});

describe('CollisionManager', () => {
    let collisionManager: CollisionManager;
    let mockScene: any;
    let mockWorld: any;
    let mockOnGameOver: any;

    beforeEach(() => {
        mockWorld = {
            nextCategory: vi.fn().mockReturnValueOnce(1).mockReturnValueOnce(2).mockReturnValueOnce(4).mockReturnValueOnce(8).mockReturnValueOnce(16),
            on: vi.fn()
        };

        mockScene = {
            matter: {
                world: mockWorld
            },
            time: {
                delayedCall: vi.fn().mockImplementation((_delay, callback) => callback())
            },
            add: {
                particles: vi.fn().mockReturnValue({
                    setDepth: vi.fn(),
                    explode: vi.fn(),
                    active: true,
                    destroy: vi.fn()
                })
            }
        };

        mockOnGameOver = vi.fn();

        collisionManager = new CollisionManager(mockScene);
        collisionManager.config(mockOnGameOver);
    });

    it('should initialize categories correctly', () => {
        const categories = collisionManager.getCategories();
        expect(categories.shipCategory).toBe(2);
        expect(categories.laserCategory).toBe(4);
        expect(categories.enemyCategory).toBe(8);
        expect(categories.enemyLaserCategory).toBe(16);
    });

    it('should setup collision listener', () => {
        collisionManager.setupCollisions();
        expect(mockWorld.on).toHaveBeenCalledWith('collisionstart', expect.any(Function));
    });

    describe('Collision Logic', () => {
        let collisionCallback: Function;

        beforeEach(() => {
            collisionManager.setupCollisions();
            // Get the callback passed to world.on
            collisionCallback = mockWorld.on.mock.calls[0][1];
        });

        it('should destroy laser when hitting world bounds (no gameObjectB)', () => {
            const mockLaserBody = {
                collisionFilter: { category: 4 }, // laserCategory
                gameObject: { destroy: vi.fn() }
            };
            const mockWorldBody = {
                collisionFilter: { category: 0 },
                gameObject: null
            };

            const event = {
                pairs: [
                    { bodyA: mockLaserBody, bodyB: mockWorldBody }
                ]
            };

            collisionCallback(event);

            expect(mockLaserBody.gameObject.destroy).toHaveBeenCalled();
        });

        it('should destroy laser and explode enemy when they collide', () => {
            const mockLaserBody = {
                collisionFilter: { category: 4 }, // laserCategory
                gameObject: { destroy: vi.fn(), active: true }
            };

            const mockShip = { explode: vi.fn(), takeDamage: vi.fn(), currentHealth: 0 };
            const mockEnemyBody = {
                collisionFilter: { category: 8 }, // enemyCategory
                gameObject: {
                    getData: vi.fn().mockReturnValue(mockShip),
                    active: true
                }
            };

            const event = {
                pairs: [
                    { bodyA: mockLaserBody, bodyB: mockEnemyBody }
                ]
            };

            collisionCallback(event);

            expect(mockLaserBody.gameObject.destroy).toHaveBeenCalled();
            expect(mockShip.takeDamage).toHaveBeenCalled();
        });

        it('should trigger game over when ship collides with enemy', () => {
            const mockShipBody = {
                collisionFilter: { category: 2 }, // shipCategory
                gameObject: {
                    active: true,
                    getData: vi.fn().mockReturnValue({ takeDamage: vi.fn(), currentHealth: 0 })
                }
            };

            const mockEnemyShip = { explode: vi.fn(), takeDamage: vi.fn(), currentHealth: 0 };
            const mockEnemyBody = {
                collisionFilter: { category: 8 }, // enemyCategory
                gameObject: {
                    getData: vi.fn().mockReturnValue(mockEnemyShip),
                    active: true
                }
            };

            const event = {
                pairs: [
                    { bodyA: mockShipBody, bodyB: mockEnemyBody }
                ]
            };

            collisionCallback(event);

            expect(mockEnemyShip.takeDamage).toHaveBeenCalled();
            expect(mockOnGameOver).toHaveBeenCalled();
        });

        it('should trigger game over when ship collides with enemy laser', () => {
            const mockShipBody = {
                collisionFilter: { category: 2 }, // shipCategory
                gameObject: {
                    active: true,
                    getData: vi.fn().mockReturnValue({ takeDamage: vi.fn(), currentHealth: 0 })
                }
            };

            const mockEnemyLaserBody = {
                collisionFilter: { category: 16 }, // enemyLaserCategory
                gameObject: {
                    active: true,
                    destroy: vi.fn()
                }
            };

            const event = {
                pairs: [
                    { bodyA: mockShipBody, bodyB: mockEnemyLaserBody }
                ]
            };

            collisionCallback(event);

            expect(mockEnemyLaserBody.gameObject.destroy).toHaveBeenCalled();
            expect(mockOnGameOver).toHaveBeenCalled();
        });
    });
});
