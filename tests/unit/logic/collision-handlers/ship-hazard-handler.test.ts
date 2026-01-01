import { describe, it, expect, vi } from 'vitest';
import { ShipHazardHandler } from '../../../../src/logic/collision-handlers/ship-hazard-handler';
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

describe('ShipHazardHandler', () => {
    const SHIP_CATEGORY = 2;
    const ENEMY_LASER_CATEGORY = 16;
    const OTHER_CATEGORY = 99;

    const mockOnGameOver = vi.fn();
    const handler = new ShipHazardHandler(SHIP_CATEGORY, ENEMY_LASER_CATEGORY, mockOnGameOver);

    // Mock scene
    const mockScene = {
        time: {
            delayedCall: vi.fn().mockImplementation((_delay, callback) => callback())
        }
    } as unknown as Phaser.Scene;

    it('should handle collision between ship and enemy laser', () => {
        const mockShipData = {
            takeDamage: vi.fn(),
            currentHealth: 0
        };
        const mockShipGO = {
            active: true,
            getData: vi.fn().mockReturnValue(mockShipData)
        } as unknown as Phaser.GameObjects.GameObject;
        const mockEnemyLaser = {
            active: true,
            destroy: vi.fn()
        } as unknown as Phaser.GameObjects.GameObject;

        const result = handler.handle(mockScene, SHIP_CATEGORY, ENEMY_LASER_CATEGORY, mockShipGO, mockEnemyLaser);

        expect(result).toBe(true);
        expect(mockEnemyLaser.destroy).toHaveBeenCalled();
        expect(mockOnGameOver).toHaveBeenCalled();
    });

    it('should return false if categories non-matching', () => {
        const result = handler.handle(mockScene, OTHER_CATEGORY, ENEMY_LASER_CATEGORY, {} as any, {} as any);
        expect(result).toBe(false);
    });
});
