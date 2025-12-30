import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { GameManager } from '../../src/logic/game-manager';

describe('GameManager', () => {
    let mockScene: any;
    let gameManager: GameManager;
    let mockGameOverText: any;
    let mockRestartText: any;

    beforeEach(() => {
        mockGameOverText = {
            setOrigin: vi.fn().mockReturnThis(),
            setVisible: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
            setPosition: vi.fn().mockReturnThis(),
            setText: vi.fn().mockReturnThis(),
            setColor: vi.fn().mockReturnThis(),
            setScale: vi.fn().mockReturnThis(),
        };

        mockRestartText = {
            setOrigin: vi.fn().mockReturnThis(),
            setVisible: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
            setPosition: vi.fn().mockReturnThis(),
        };

        mockScene = {
            scale: { width: 800, height: 600 },
            add: {
                text: vi.fn((_x, _y, text) => {
                    if (text === '' || text === 'GAME OVER' || text === 'RETRY' || text === 'VICTORY') return mockGameOverText;
                    if (text === 'Press FIRE') return mockRestartText;
                    return mockGameOverText; // default to game over text
                }),
            },
            tweens: {
                add: vi.fn(),
                killTweensOf: vi.fn(),
            }
        };

        gameManager = new GameManager(mockScene);
    });

    it('should initialize with game over state false', () => {
        expect(gameManager.isGameActive()).toBe(true);
    });

    it('should create texts on initialization', () => {
        expect(mockScene.add.text).toHaveBeenCalledTimes(2);
        expect(mockGameOverText.setVisible).toHaveBeenCalledWith(false);
        expect(mockRestartText.setVisible).toHaveBeenCalledWith(false);
    });

    it('should handle game over correcty', () => {
        gameManager.handleGameOver();
        expect(gameManager.isGameActive()).toBe(false);
        expect(mockGameOverText.setText).toHaveBeenCalledWith('RETRY');
        expect(mockGameOverText.setVisible).toHaveBeenCalledWith(true);
        expect(mockRestartText.setVisible).toHaveBeenCalledWith(true);
    });

    it('should stay active on victory', () => {
        gameManager.handleVictory('#ffffff');
        expect(gameManager.isGameActive()).toBe(true);
        expect(gameManager.isVictoryState()).toBe(true);
    });

    it('should reset game state', () => {
        gameManager.handleGameOver(); // set to game over first
        gameManager.reset();

        expect(gameManager.isGameActive()).toBe(true);
        expect(mockGameOverText.setVisible).toHaveBeenCalledWith(false);
        expect(mockRestartText.setVisible).toHaveBeenCalledWith(false);
    });

    it('should handle resize', () => {
        const newWidth = 1000;
        const newHeight = 800;
        gameManager.handleResize(newWidth, newHeight);

        expect(mockGameOverText.setPosition).toHaveBeenCalledWith(newWidth * 0.5, newHeight * 0.4);
        expect(mockRestartText.setPosition).toHaveBeenCalledWith(newWidth * 0.5, newHeight * 0.4 + 60);
    });
});
