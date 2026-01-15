import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'reflect-metadata';

// Mock Phaser
vi.mock('phaser', () => {
    const MockText = class {
        setOrigin = vi.fn().mockReturnThis();
        setDepth = vi.fn().mockReturnThis();
        setText = vi.fn().mockReturnThis();
        setPosition = vi.fn().mockReturnThis();
        setVisible = vi.fn().mockReturnThis();
        destroy = vi.fn();
    };

    return {
        default: {
            Scene: class { },
            GameObjects: {
                Text: MockText
            }
        }
    };
});

// Mock GameStatus
vi.mock('../../../src/logic/game-status', () => ({
    GameStatus: {
        getInstance: vi.fn()
    }
}));

import { LootUI } from '../../../src/ui/loot-ui';
import { GameStatus } from '../../../src/logic/game-status';
import { LootType } from '../../../src/ships/types';
import Phaser from 'phaser';

describe('LootUI', () => {
    let mockScene: any;
    let lootUI: LootUI;
    let mockGameStatus: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockGameStatus = {
            getLoot: vi.fn().mockReturnValue({
                [LootType.SILVER]: 10,
                [LootType.GOLD]: 5,
                [LootType.GEM]: 2,
                [LootType.MODULE]: 1
            })
        };
        (GameStatus.getInstance as any).mockReturnValue(mockGameStatus);

        mockScene = {
            scale: { width: 800, height: 600 },
            add: {
                text: vi.fn().mockReturnValue(new Phaser.GameObjects.Text(null as any, 0, 0, '', {}))
            }
        };

        lootUI = new LootUI(mockScene);
    });

    it('should create loot UI elements', () => {
        lootUI.create(100);

        // 4 icons + 4 text counts = 8 calls
        expect(mockScene.add.text).toHaveBeenCalledTimes(8);
        expect(mockGameStatus.getLoot).toHaveBeenCalled();
    });

    it('should update counts for all types', () => {
        lootUI.create();
        const textInstances = mockScene.add.text.mock.results.map((r: any) => r.value);

        // Indices based on creation order:
        // 0: silver icon, 1: silver text
        // 2: gold icon, 3: gold text
        // 4: gem icon, 5: gem text
        // 6: module icon, 7: module text

        const silverText = textInstances[1];
        const goldText = textInstances[3];
        const gemText = textInstances[5];
        const moduleText = textInstances[7];

        // Test Silver
        lootUI.updateCounts(LootType.SILVER, 100);
        expect(silverText.setText).toHaveBeenCalledWith('100');

        // Test Gold
        lootUI.updateCounts(LootType.GOLD, 200);
        expect(goldText.setText).toHaveBeenCalledWith('200');

        // Test Gem
        lootUI.updateCounts(LootType.GEM, 50);
        expect(gemText.setText).toHaveBeenCalledWith('50');

        // Test Module
        lootUI.updateCounts(LootType.MODULE, 5);
        expect(moduleText.setText).toHaveBeenCalledWith('5');
    });

    it('should update positions', () => {
        lootUI.create();
        const textInstances = mockScene.add.text.mock.results.map((r: any) => r.value);

        mockScene.scale.width = 1000;
        lootUI.updatePositions();

        textInstances.forEach((text: any) => {
            expect(text.setPosition).toHaveBeenCalled();
        });
    });

    it('should set visible', () => {
        lootUI.create();
        const textInstances = mockScene.add.text.mock.results.map((r: any) => r.value);

        lootUI.setVisible(false);
        textInstances.forEach((text: any) => {
            expect(text.setVisible).toHaveBeenCalledWith(false);
        });
    });

    it('should destroy elements', () => {
        lootUI.create();
        const textInstances = mockScene.add.text.mock.results.map((r: any) => r.value);

        lootUI.destroy();
        textInstances.forEach((text: any) => {
            expect(text.destroy).toHaveBeenCalled();
        });
    });
    it('should safely handle method calls before create', () => {
        // These should not throw
        lootUI.updateCounts(LootType.SILVER, 1);
        lootUI.updatePositions();
        lootUI.setVisible(true);
        lootUI.destroy();
    });
});
