import { describe, it, expect, vi } from 'vitest';
import { ShipEnemyHandler } from '../../../../src/logic/collision-handlers/ship-enemy-handler';
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

describe('ShipEnemyHandler', () => {
    const SHIP_CATEGORY = 2;
    const ENEMY_CATEGORY = 8;
    const OTHER_CATEGORY = 99;

    const mockOnGameOver = vi.fn();
    const handler = new ShipEnemyHandler(SHIP_CATEGORY, ENEMY_CATEGORY, mockOnGameOver);

    // Mock scene
    const mockScene = {
        time: {
            delayedCall: vi.fn().mockImplementation((_delay, callback) => callback())
        }
    } as unknown as Phaser.Scene;

    it('should handle collision between ship and enemy', () => {
        const mockShipData = {
            explode: vi.fn(),
            takeDamage: vi.fn(),
            currentHealth: 0
        };
        const mockShipGO = {
            active: true,
            getData: vi.fn().mockReturnValue(mockShipData)
        } as unknown as Phaser.GameObjects.GameObject;

        const mockEnemyShipData = {
            explode: vi.fn(),
            takeDamage: vi.fn(),
            currentHealth: 80
        };
        const mockEnemy = {
            active: true,
            getData: vi.fn().mockReturnValue(mockEnemyShipData),
            destroy: vi.fn()
        } as unknown as Phaser.Physics.Matter.Image;

        const result = handler.handle(mockScene, SHIP_CATEGORY, ENEMY_CATEGORY, mockShipGO, mockEnemy);

        expect(result).toBe(true);
        expect(mockShipData.takeDamage).toHaveBeenCalledWith(240);
        expect(mockOnGameOver).toHaveBeenCalled();
    });

    it('should fallback to destroy if enemy has no ship data', () => {
        const mockShipGO = { active: true, getData: vi.fn() } as unknown as Phaser.GameObjects.GameObject;

        const mockEnemy = {
            active: true,
            getData: vi.fn().mockReturnValue(null),
            destroy: vi.fn()
        } as unknown as Phaser.Physics.Matter.Image;

        const result = handler.handle(mockScene, SHIP_CATEGORY, ENEMY_CATEGORY, mockShipGO, mockEnemy);

        expect(result).toBe(true);
        expect(mockEnemy.destroy).toHaveBeenCalled();
        expect(mockOnGameOver).toHaveBeenCalled();
    });

    it('should return false if categories non-matching', () => {
        const result = handler.handle(mockScene, OTHER_CATEGORY, ENEMY_CATEGORY, {} as any, {} as any);
        expect(result).toBe(false);
    });

    it('should prevent healing if enemy takes fatal damage first', () => {
        const mockShipData = {
            takeDamage: vi.fn(),
            currentHealth: 100
        };
        const mockShipGO = {
            active: true,
            getData: vi.fn().mockReturnValue(mockShipData)
        } as unknown as Phaser.GameObjects.GameObject;

        // Enemy with low health that will die from collision
        let enemyHealth = 10;
        const mockEnemyShipData = {
            explode: vi.fn(),
            // Simulate damage reducing health immediately
            takeDamage: vi.fn().mockImplementation((amount) => {
                enemyHealth -= amount;
            }),
            get currentHealth() { return enemyHealth; }
        };

        const mockEnemy = {
            active: true,
            getData: vi.fn().mockReturnValue(mockEnemyShipData)
        } as unknown as Phaser.Physics.Matter.Image;

        const result = handler.handle(mockScene, SHIP_CATEGORY, ENEMY_CATEGORY, mockShipGO, mockEnemy);

        expect(result).toBe(true);
        // Enemy takes 100 damage, goes to -90
        expect(mockEnemyShipData.takeDamage).toHaveBeenCalledWith(100);
        expect(mockEnemyShipData.currentHealth).toBe(-90);

        // Player should take damage based on INITIAL positive health (10 * 3 = 30)
        // because we calculate player damage before damaging the enemy in the handler now.
        // OR if we rely on the fix that uses Math.max(0, current), it would be 0 if we did it wrong.
        // But since we moved the calculation up, it should capture the 10.
        expect(mockShipData.takeDamage).toHaveBeenCalledWith(30);
    });
});
