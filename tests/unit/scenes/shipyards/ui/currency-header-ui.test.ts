import { describe, it, expect, vi, beforeEach } from 'vitest';
import Phaser from 'phaser';

// Mock Phaser globally
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            GameObjects: {
                Text: class { }
            }
        }
    };
});

// Mock GameStatus
vi.mock('../../../../../src/logic/game-status', () => ({
    GameStatus: {
        getInstance: vi.fn().mockReturnValue({
            getLoot: vi.fn().mockReturnValue({ '🌕': 100, '🪙': 50, '💎': 10, '📦': 0 })
        })
    }
}));

import { CurrencyHeaderUI } from '../../../../../src/scenes/shipyards/ui/currency-header-ui';
import { GameStatus } from '../../../../../src/logic/game-status';
import { LootType } from '../../../../../src/ships/types';

describe('CurrencyHeaderUI', () => {
    let scene: any;
    let currencyHeader: CurrencyHeaderUI;
    let mockGameObject: any;

    beforeEach(() => {
        mockGameObject = {
            setOrigin: vi.fn().mockReturnThis(),
            setText: vi.fn()
        };

        const mockContainer = {
            add: vi.fn()
        };

        const mockGraphics = {
            clear: vi.fn().mockReturnThis(),
            fillStyle: vi.fn().mockReturnThis(),
            fillRoundedRect: vi.fn().mockReturnThis(),
            lineStyle: vi.fn().mockReturnThis(),
            strokeRoundedRect: vi.fn().mockReturnThis()
        };

        scene = {
            add: {
                text: vi.fn().mockReturnValue(mockGameObject),
                container: vi.fn().mockReturnValue(mockContainer),
                graphics: vi.fn().mockReturnValue(mockGraphics)
            },
            scale: {
                width: 800,
                height: 600
            }
        };

        currencyHeader = new CurrencyHeaderUI(scene as unknown as Phaser.Scene);
    });

    it('should create currency text elements and update initial values', () => {
        currencyHeader.create();

        // Should create 6 text elements (3 icons, 3 values)
        expect(scene.add.text).toHaveBeenCalledTimes(6);

        // Assert creation logic of icons
        expect(scene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), LootType.SILVER, expect.any(Object));
        expect(scene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), LootType.GOLD, expect.any(Object));
        expect(scene.add.text).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), LootType.GEM, expect.any(Object));

        // It sets initial text to string values of mock
        expect(mockGameObject.setText).toHaveBeenCalledWith('100');
        expect(mockGameObject.setText).toHaveBeenCalledWith('50');
        expect(mockGameObject.setText).toHaveBeenCalledWith('10');
    });

    it('should update text elements when update is called', () => {
        currencyHeader.create();

        // Clear previous interactions from `create`
        mockGameObject.setText.mockClear();

        // Update with new mock state
        const mockGetInstance = GameStatus.getInstance as any;
        mockGetInstance.mockReturnValueOnce({
            getLoot: vi.fn().mockReturnValue({ '🌕': 200, '🪙': 150, '💎': 99, '📦': 0 })
        });

        currencyHeader.update();

        expect(mockGameObject.setText).toHaveBeenCalledWith('200');
        expect(mockGameObject.setText).toHaveBeenCalledWith('150');
        expect(mockGameObject.setText).toHaveBeenCalledWith('99');
    });
});
