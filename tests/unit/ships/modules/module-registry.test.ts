import { describe, it, expect, vi } from 'vitest';
import { calculateSellPrice, ModuleRegistry } from '../../../../src/ships/modules/module-registry';
import { LootType } from '../../../../src/ships/types';

vi.mock('phaser', () => ({
    default: {
        Scene: class { },
        Physics: { Matter: { Image: class { }, Sprite: class { } } },
        GameObjects: { Image: class { }, Text: class { }, Sprite: class { } },
        Math: { Between: vi.fn(), Vector2: class { } },
        Structs: { Size: class { } }
    }
}));

describe('ModuleRegistry and calculateSellPrice', () => {
    it('should correctly calculate sell prices for simple currencies', () => {
        // Red laser is 20 Silver
        const sellPrice = calculateSellPrice('laser-red');
        expect(sellPrice?.type).toBe(LootType.SILVER);
        expect(sellPrice?.amount).toBe(10); // 50% of 20
    });

    it('should correctly convert GEM to GOLD based on DIAMOND_TO_GOLD_RATIO', () => {
        // Dust drive is 2 Gems
        const sellPrice = calculateSellPrice('drive-dust');
        expect(sellPrice?.type).toBe(LootType.GOLD);
        // (2 Gems * 0.5) = 1 Gem worth -> ratio is 20 Gold per Gem -> 1 * 20 = 20
        expect(sellPrice?.amount).toBe(20);
    });

    it('should return minimum 1 amount if the original buy price was > 0', () => {
        // Suppose a theoretical item costs 1 Silver
        // Temporary mock for testing
        ModuleRegistry['test-item'] = {
            id: 'test-item',
            name: 'test',
            description: 'test',
            moduleClass: class { } as any,
            buyPrice: { type: LootType.SILVER, amount: 1 }
        };

        const sellPrice = calculateSellPrice('test-item');
        expect(sellPrice?.amount).toBe(1); // 0.5 rounded down would be 0, but minimum is 1

        delete ModuleRegistry['test-item'];
    });

    it('should return null for non-existent module', () => {
        const sellPrice = calculateSellPrice('non-existent-module');
        expect(sellPrice).toBeNull();
    });
});
