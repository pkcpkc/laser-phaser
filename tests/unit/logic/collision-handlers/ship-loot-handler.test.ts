import { describe, it, expect, vi } from 'vitest';
import { ShipLootHandler } from '../../../../src/logic/collision-handlers/ship-loot-handler';
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

describe('ShipLootHandler', () => {
    const SHIP_CATEGORY = 2;
    const LOOT_CATEGORY = 32;
    const OTHER_CATEGORY = 99;

    const mockOnLootCollected = vi.fn();
    const handler = new ShipLootHandler(SHIP_CATEGORY, LOOT_CATEGORY, mockOnLootCollected);

    const mockScene = {} as Phaser.Scene;

    it('should handle collision between ship and loot', () => {
        const mockShipGO = {} as Phaser.GameObjects.GameObject;
        const mockLoot = {} as Phaser.GameObjects.GameObject;

        const result = handler.handle(mockScene, SHIP_CATEGORY, LOOT_CATEGORY, mockShipGO, mockLoot);

        expect(result).toBe(true);
        expect(mockOnLootCollected).toHaveBeenCalledWith(mockLoot);
    });

    it('should handle collision when ship is second argument', () => {
        const mockShipGO = {} as Phaser.GameObjects.GameObject;
        const mockLoot = {} as Phaser.GameObjects.GameObject;

        const result = handler.handle(mockScene, LOOT_CATEGORY, SHIP_CATEGORY, mockLoot, mockShipGO);

        expect(result).toBe(true);
        expect(mockOnLootCollected).toHaveBeenCalledWith(mockLoot);
    });

    it('should return false if categories non-matching', () => {
        const result = handler.handle(mockScene, OTHER_CATEGORY, LOOT_CATEGORY, {} as any, {} as any);
        expect(result).toBe(false);
    });
});
