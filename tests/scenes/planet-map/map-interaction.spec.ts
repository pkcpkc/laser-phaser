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
import { MapInteractionManager } from '../../../src/scenes/planet-map/map-interaction';

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

describe('MapInteractionManager', () => {
    let manager: MapInteractionManager;

    beforeEach(() => {
        vi.clearAllMocks();
        manager = new MapInteractionManager(mockScene);
    });

    it('should apply grayscale and brightness to interaction icons', () => {
        const planetData = {
            id: 'test-planet',
            name: 'Test Planet',
            x: 100,
            y: 100,
            interaction: {
                levelId: 'test-level',
                hasTrader: true,
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
