import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollisionManager } from '../../src/logic/collision-manager';

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Physics: {
                Matter: {
                    Events: {}
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
            nextCategory: vi.fn().mockReturnValueOnce(1).mockReturnValueOnce(2).mockReturnValueOnce(4).mockReturnValueOnce(8),
            on: vi.fn()
        };

        mockScene = {
            matter: {
                world: mockWorld
            }
        };

        mockOnGameOver = vi.fn();

        collisionManager = new CollisionManager(mockScene, mockOnGameOver);
    });

    it('should initialize categories correctly', () => {
        const categories = collisionManager.getCategories();
        expect(categories.shipCategory).toBe(1);
        expect(categories.laserCategory).toBe(2);
        expect(categories.enemyCategory).toBe(4);
        expect(categories.enemyLaserCategory).toBe(8);
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
                collisionFilter: { category: 2 }, // laserCategory
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
                collisionFilter: { category: 2 }, // laserCategory
                gameObject: { destroy: vi.fn() }
            };

            const mockShip = { explode: vi.fn() };
            const mockEnemyBody = {
                collisionFilter: { category: 4 }, // enemyCategory
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
            expect(mockShip.explode).toHaveBeenCalled();
        });

        it('should trigger game over when ship collides with enemy', () => {
            const mockShipBody = {
                collisionFilter: { category: 1 }, // shipCategory
                gameObject: {}
            };

            const mockEnemyShip = { explode: vi.fn() };
            const mockEnemyBody = {
                collisionFilter: { category: 4 }, // enemyCategory
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

            expect(mockEnemyShip.explode).toHaveBeenCalled();
            expect(mockOnGameOver).toHaveBeenCalled();
        });

        it('should trigger game over when ship collides with enemy laser', () => {
            const mockShipBody = {
                collisionFilter: { category: 1 }, // shipCategory
                gameObject: {}
            };

            const mockEnemyLaserBody = {
                collisionFilter: { category: 8 }, // enemyLaserCategory
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
