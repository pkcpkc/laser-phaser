import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser globally
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            GameObjects: {
                Image: class { },
                Text: class { }
            }
        }
    };
});

import PreloadScene from '../../src/scenes/preload-scene';
import * as TextureGenerator from '../../src/utils/texture-generator';

describe('PreloadScene', () => {
    let preloadScene: PreloadScene;
    let mockLoad: any;
    let mockAdd: any;
    let mockScale: any;
    let mockTime: any;
    let mockInput: any;
    let mockScenePlugin: any;
    let mockTweens: any;
    let mockLogo: any;
    let mockLoadingText: any;

    beforeEach(() => {
        preloadScene = new PreloadScene();

        // Mock sub-systems
        mockLoad = {
            image: vi.fn(),
            atlas: vi.fn(),
            text: vi.fn(),
            on: vi.fn(), // For load event listeners
        };

        mockLogo = {
            setOrigin: vi.fn(),
            setAlpha: vi.fn(),
            setScale: vi.fn(),
            setPosition: vi.fn(),
            width: 100,
            height: 100,
            displayHeight: 100,
        };

        mockLoadingText = {
            setOrigin: vi.fn().mockReturnThis(),
            setText: vi.fn(),
            setPosition: vi.fn(),
        };

        mockAdd = {
            image: vi.fn().mockReturnValue(mockLogo),
            text: vi.fn().mockReturnValue(mockLoadingText),
        };

        mockScale = {
            width: 800,
            height: 600,
            on: vi.fn(),
            off: vi.fn(),
        };

        mockTime = {
            delayedCall: vi.fn((_delay, callback) => callback()), // Execute immediately
            addEvent: vi.fn(), // For loading dots animation
        };

        mockInput = {
            on: vi.fn(),
            keyboard: {
                on: vi.fn(),
            },
        };

        mockScenePlugin = {
            start: vi.fn(),
        };

        mockTweens = {
            add: vi.fn(),
        };

        // Inject mocks
        (preloadScene as any).load = mockLoad;
        (preloadScene as any).add = mockAdd;
        (preloadScene as any).scale = mockScale;
        (preloadScene as any).time = mockTime;
        (preloadScene as any).input = mockInput;
        (preloadScene as any).scene = mockScenePlugin;
        (preloadScene as any).tweens = mockTweens;

        // Mock texture generator
        vi.spyOn(TextureGenerator, 'createFlareTexture').mockImplementation(() => { });
    });

    it('should init correctly', () => {
        preloadScene.init();
        expect((preloadScene as any).startTime).toBeDefined();
    });

    it('should preload assets', () => {
        preloadScene.preload();
        expect(mockAdd.image).toHaveBeenCalledWith(400, 300, 'logo');
        expect(mockLoad.atlas).toHaveBeenCalledWith('ships', 'assets/sprites/ships.png', 'assets/sprites/ships.json');
        expect(mockLoad.image).toHaveBeenCalledWith('nebula', 'assets/images/nebula.png');
        expect(mockLoad.image).toHaveBeenCalledWith('blood_nebula', 'assets/images/blood_nebula.png');
        expect(mockLoad.text).toHaveBeenCalledWith('storylines', 'assets/data/storylines.md');
    });

    it('should generate flares and setup loading text on create', () => {
        preloadScene.create();
        expect(TextureGenerator.createFlareTexture).toHaveBeenCalledTimes(5); // 5 colors defined
        expect(mockAdd.text).toHaveBeenCalledWith(0, 0, 'LOADING...', expect.any(Object));
        expect(mockScale.on).toHaveBeenCalledWith('resize', expect.any(Function), preloadScene);
    });

    it('should handle resize layout updates', () => {
        preloadScene.preload(); // Setup logo
        preloadScene.create(); // Setup text

        // reset mocks calls to verify resize specifically
        mockLogo.setPosition.mockClear();
        mockLoadingText.setPosition.mockClear();

        (preloadScene as any).resize();

        expect(mockLogo.setScale).toHaveBeenCalled();
        expect(mockLogo.setPosition).toHaveBeenCalled();
        expect(mockLoadingText.setPosition).toHaveBeenCalled();
    });

    it('should start PlanetMapScene automatically after loading', () => {
        preloadScene.preload();
        preloadScene.create(); // This triggers the delayedCall mock which executes onLoadingComplete and starts the game

        // Verify game started automatically
        expect(mockScale.off).toHaveBeenCalled();
        expect(mockScenePlugin.start).toHaveBeenCalledWith('GalaxyScene');
    });

    it('should calculate layout correctly', () => {
        // Setup state
        preloadScene.preload();
        preloadScene.create();

        // Change scale
        mockScale.width = 1000;
        mockScale.height = 800;

        (preloadScene as any).updateLayout();

        // Check if setPosition was called with valid numbers (not NaN)
        expect(mockLoadingText.setPosition).toHaveBeenCalledWith(expect.any(Number), expect.any(Number));
        expect(mockLogo.setPosition).toHaveBeenCalledWith(expect.any(Number), expect.any(Number));
    });
});
