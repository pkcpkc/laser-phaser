import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser module completely to avoid canvas issues
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            GameObjects: {
                Container: class { },
                Text: class { },
                Image: class { },
            }
        }
    };
});

// Import after mocking
import { GalaxyInteractionManager } from '../../../../src/scenes/galaxies/galaxy-interaction';

// Mock Phaser objects for the scene
const mockColorMatrix = {
    grayscale: vi.fn().mockReturnThis(),
    brightness: vi.fn().mockReturnThis(),
    saturate: vi.fn().mockReturnThis(),
    multiply: vi.fn().mockReturnThis(),
};

const mockPostFX = {
    addColorMatrix: vi.fn().mockReturnValue(mockColorMatrix),
    clear: vi.fn(),
};

const mockText = {
    setOrigin: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setText: vi.fn().mockReturnThis(),
    setRotation: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    postFX: mockPostFX,
    width: 100,
};

const mockContainer = {
    setVisible: vi.fn(),
    setDepth: vi.fn(),
    removeAll: vi.fn(),
    setPosition: vi.fn(),
    setAlpha: vi.fn(),
    add: vi.fn(),
    postFX: {
        clear: vi.fn(),
        addColorMatrix: vi.fn().mockReturnValue(mockColorMatrix),
    },
};

const mockScene = {
    add: {
        container: vi.fn().mockReturnValue(mockContainer),
        text: vi.fn().mockReturnValue(mockText),
    },
    tweens: {
        add: vi.fn(),
    },
    scene: {
        start: vi.fn(),
    },
} as any;

// Mock GameStatus
const mockIsPlanetDefeated = vi.fn().mockReturnValue(false);
vi.mock('../../../../src/logic/game-status', () => ({
    GameStatus: {
        getInstance: () => ({
            isPlanetDefeated: mockIsPlanetDefeated
        })
    }
}));

const mockGetIntroText = vi.fn().mockReturnValue(null);
vi.mock('../../../../src/logic/storyline-manager', () => ({
    StorylineManager: {
        getInstance: () => ({
            getIntroText: mockGetIntroText
        })
    }
}));

describe('GalaxyInteractionManager', () => {
    let manager: GalaxyInteractionManager;

    beforeEach(() => {
        vi.clearAllMocks();
        mockIsPlanetDefeated.mockReturnValue(false); // Default: not defeated
        manager = new GalaxyInteractionManager(mockScene);
        manager.setGalaxyId('test-galaxy');
    });

    it('should show all icons if planet has no level (peaceful)', () => {
        const planetData = {
            id: 'peaceful',
            name: 'Peaceful Planet',
            x: 0, y: 0,
            interaction: {
                hasShipyard: true,
                warpGalaxyId: 'some-galaxy'
            }
        };

        manager.showInteractionUI(planetData as any);
        // Should show 2 icons (Shipyard + Warp) + Planet Name text calls
        // Since play button is not added, we expect 2 icons
        // mockScene.add.text called 2 times for icons + curved text calls
        // Better to check specific icon content calls if possible, but for now check existence
        expect(mockScene.add.text).toHaveBeenCalledWith(0, 0, '🛠️', expect.any(Object));
        expect(mockScene.add.text).toHaveBeenCalledWith(0, 0, '🌀', expect.any(Object));
    });

    it('should HIDE shipyard/warp if planet has level and is NOT defeated', () => {
        const planetData = {
            id: 'hostile',
            name: 'Hostile Planet',
            x: 0, y: 0,
            interaction: {
                levelId: 'some-level',
                hasShipyard: true,
                warpGalaxyId: 'some-galaxy'
            }
        };

        manager.showInteractionUI(planetData as any);
        // Play button (🚀) should be present
        expect(mockScene.add.text).toHaveBeenCalledWith(0, 0, '🚀', expect.any(Object));
        // Shipyard/Warp should NOT be present
        expect(mockScene.add.text).not.toHaveBeenCalledWith(0, 0, '🛠️', expect.any(Object));
        expect(mockScene.add.text).not.toHaveBeenCalledWith(0, 0, '🌀', expect.any(Object));
    });

    it('should SHOW shipyard/warp if planet has level and IS DEFEATED', () => {
        mockIsPlanetDefeated.mockReturnValue(true); // Defeated!

        const planetData = {
            id: 'hostile',
            name: 'Hostile Planet',
            x: 0, y: 0,
            interaction: {
                levelId: 'some-level',
                hasShipyard: true,
                warpGalaxyId: 'some-galaxy'
            }
        };

        manager.showInteractionUI(planetData as any);
        expect(mockScene.add.text).toHaveBeenCalledWith(0, 0, '🚀', expect.any(Object));
        expect(mockScene.add.text).toHaveBeenCalledWith(0, 0, '🛠️', expect.any(Object));
        expect(mockScene.add.text).toHaveBeenCalledWith(0, 0, '🌀', expect.any(Object));
    });

    it('should SHOW shipyard/warp if showAlways is true, even if not defeated', () => {
        mockIsPlanetDefeated.mockReturnValue(false); // Not defeated

        const planetData = {
            id: 'hostile',
            name: 'Hostile Planet',
            x: 0, y: 0,
            interaction: {
                levelId: 'some-level',
                hasShipyard: true,
                warpGalaxyId: 'some-galaxy',
                showAlways: true
            }
        };

        manager.showInteractionUI(planetData as any);
        expect(mockScene.add.text).toHaveBeenCalledWith(0, 0, '🛠️', expect.any(Object));
        expect(mockScene.add.text).toHaveBeenCalledWith(0, 0, '🌀', expect.any(Object));
    });

    it('should apply grayscale and brightness to interaction icons', () => {
        const planetData = {
            id: 'test-planet',
            name: 'Test Planet',
            x: 100,
            y: 100,
            interaction: {
                levelId: 'test-level',
                hasShipyard: true,
            },
        };

        manager.showInteractionUI(planetData as any);

        // Text is called for icons AND curved planet name letters
        expect(mockScene.add.text).toHaveBeenCalled();

        // PostFX is applied to the icons (3 icons)
        expect(mockPostFX.clear).toHaveBeenCalled();
        expect(mockPostFX.addColorMatrix).toHaveBeenCalled();

        // Check for saturate call
        expect(mockColorMatrix.saturate).toHaveBeenCalledWith(-1);

        // Check for multiply (tint) call
        expect(mockColorMatrix.multiply).toHaveBeenCalled();
    });

    it('should show UI for astra', () => {
        const planetData = {
            id: 'astra',
            name: 'Astra',
            x: 0,
            y: 0,
        };

        manager.showInteractionUI(planetData as any);
        expect(mockContainer.setVisible).toHaveBeenCalledWith(true);
        expect(mockScene.add.text).toHaveBeenCalled();
    });
});
