import { describe, it, expect, vi } from 'vitest';
import { LaserEnemyHandler } from '../../../src/logic/collision-handlers/laser-enemy-handler';
import Phaser from 'phaser';

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

describe('LaserEnemyHandler', () => {
    const LASER_CATEGORY = 4;
    const ENEMY_CATEGORY = 8;
    const OTHER_CATEGORY = 2;

    const handler = new LaserEnemyHandler(LASER_CATEGORY, ENEMY_CATEGORY);

    // Mock scene with delayedCall
    const mockScene = {
        time: {
            delayedCall: vi.fn().mockImplementation((_delay, callback) => callback())
        }
    } as unknown as Phaser.Scene;

    it('should handle collision between laser and enemy', () => {
        const mockLaser = { destroy: vi.fn(), active: true } as unknown as Phaser.GameObjects.GameObject;

        const mockShip = { explode: vi.fn() };
        const mockEnemy = {
            active: true,
            getData: vi.fn().mockReturnValue(mockShip),
            destroy: vi.fn()
        } as unknown as Phaser.Physics.Matter.Image;

        const result = handler.handle(mockScene, LASER_CATEGORY, ENEMY_CATEGORY, mockLaser, mockEnemy);

        expect(result).toBe(true);
        expect(mockShip.explode).toHaveBeenCalled();
        expect(mockLaser.destroy).toHaveBeenCalled();
    });

    it('should handle collision (swapped categories)', () => {
        const mockLaser = { destroy: vi.fn(), active: true } as unknown as Phaser.GameObjects.GameObject;

        const mockShip = { explode: vi.fn() };
        const mockEnemy = {
            active: true,
            getData: vi.fn().mockReturnValue(mockShip),
            destroy: vi.fn()
        } as unknown as Phaser.Physics.Matter.Image;

        const result = handler.handle(mockScene, ENEMY_CATEGORY, LASER_CATEGORY, mockEnemy, mockLaser);

        expect(result).toBe(true);
        expect(mockShip.explode).toHaveBeenCalled();
        expect(mockLaser.destroy).toHaveBeenCalled();
    });

    it('should fallback to destroy if enemy is not a ship', () => {
        const mockLaser = { destroy: vi.fn(), active: true } as unknown as Phaser.GameObjects.GameObject;

        // No 'ship' data
        const mockEnemy = {
            active: true,
            getData: vi.fn().mockReturnValue(null),
            destroy: vi.fn()
        } as unknown as Phaser.Physics.Matter.Image;

        const result = handler.handle(mockScene, LASER_CATEGORY, ENEMY_CATEGORY, mockLaser, mockEnemy);

        expect(result).toBe(true);
        expect(mockEnemy.destroy).toHaveBeenCalled();
        expect(mockLaser.destroy).toHaveBeenCalled();
    });

    it('should return false if categories do not match', () => {
        const mockA = {} as Phaser.GameObjects.GameObject;
        const mockB = {} as Phaser.GameObjects.GameObject;

        const result = handler.handle(mockScene, OTHER_CATEGORY, ENEMY_CATEGORY, mockA, mockB);
        expect(result).toBe(false);
    });

    it('should return false if gameObjects are missing', () => {
        const result = handler.handle(mockScene, LASER_CATEGORY, ENEMY_CATEGORY, null, null);
        expect(result).toBe(false);
    });
});
