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



import PreloadScene from '../../../src/scenes/preload-scene';
import * as FlaresTexture from '../../../src/ships/textures/flares-texture';

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
            json: vi.fn(), // Added json spy
            on: vi.fn(), // For load event listeners
        };

        // ... rest of the mocks (keep existing)
        mockLogo = {
            setOrigin: vi.fn(),
            setAlpha: vi.fn(),
            setScale: vi.fn(),
            setPosition: vi.fn(),
            setDepth: vi.fn(),
            width: 100,
            height: 100,
            displayHeight: 100,
        };

        const mockBackground = { ...mockLogo };
        const mockHead = { ...mockLogo };

        mockLoadingText = {
            setOrigin: vi.fn().mockReturnThis(),
            setText: vi.fn(),
            setPosition: vi.fn(),
            setDepth: vi.fn(),
            width: 100,
        };

        mockAdd = {
            image: vi.fn().mockImplementation((_x, _y, key) => {
                if (key === 'logo') return mockLogo;
                if (key === 'background') return mockBackground;
                if (key === 'android-head') return mockHead;
                return mockLogo;
            }),
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
            addEvent: vi.fn().mockReturnValue({ destroy: vi.fn() }), // Return mock event with destroy
        };

        mockInput = {
            on: vi.fn(),
            keyboard: {
                on: vi.fn(),
                createCursorKeys: vi.fn(), // Ensure createCursorKeys is mocked usually called in create/init
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
        (preloadScene as any).registry = {
            set: vi.fn(),
            get: vi.fn()
        };

        // Mock texture generator
        vi.spyOn(FlaresTexture, 'createFlareTexture').mockImplementation(() => { });
    });

    it('should init correctly', () => {
        preloadScene.init();
        expect((preloadScene as any).startTime).toBeDefined();
    });

    it('should preload assets and setup visuals', () => {
        // Default behavior (en)
        preloadScene.preload();

        // 1. Background
        expect(mockAdd.image).toHaveBeenCalledWith(400, 300, 'background');

        // 2. Logo
        expect(mockAdd.image).toHaveBeenCalledWith(400, 300, 'logo');

        // 3. Android Head
        expect(mockAdd.image).toHaveBeenCalledWith(400, 300, 'android-head');

        // 4. Loading Text
        expect(mockAdd.text).toHaveBeenCalledWith(0, 0, 'LOADING...', expect.any(Object));

        // Load content
        expect(mockLoad.atlas).toHaveBeenCalledWith('ships', 'assets/sprites/ships.png', 'assets/sprites/ships.json');
        expect(mockLoad.image).toHaveBeenCalledWith('nebula', 'assets/images/nebula.png');
        expect(mockLoad.image).toHaveBeenCalledWith('blood_nebula', 'assets/images/blood_nebula.png');
    });

    it('should preload assets for requested locale', () => {
        // Mock URL search params
        const originalLocation = window.location;
        delete (window as any).location;
        (window as any).location = new URL('http://localhost/?locale=de');

        preloadScene.preload();

        // Should basically do same as default now, but it verify logic doesn't crash
        expect(mockLoad.atlas).toHaveBeenCalledWith('ships', 'assets/sprites/ships.png', 'assets/sprites/ships.json');

        // Restore window.location
        (window as any).location = originalLocation;
    });

    it('should generate flares on create', () => {
        preloadScene.create();
        expect(FlaresTexture.createFlareTexture).toHaveBeenCalledTimes(5); // 5 colors defined
        expect(mockScale.on).toHaveBeenCalledWith('resize', expect.any(Function), preloadScene);
    });

    it('should handle resize layout updates', () => {
        preloadScene.preload(); // Setup logo, text, etc

        // reset mocks calls to verify resize specifically
        mockLogo.setPosition.mockClear();
        mockLoadingText.setPosition.mockClear();

        (preloadScene as any).resize();

        expect(mockLogo.setScale).toHaveBeenCalled();
        expect(mockLogo.setPosition).toHaveBeenCalled();
        expect(mockLoadingText.setPosition).toHaveBeenCalled();
    });

    it('should wait 3s before starting WormholeScene after visual completion', () => {
        preloadScene.preload();

        // Mock visuals
        (preloadScene as any).background = { setAlpha: vi.fn(), setScale: vi.fn(), setPosition: vi.fn() };
        (preloadScene as any).androidHead = { setAlpha: vi.fn(), setScale: vi.fn(), setPosition: vi.fn() };
        (preloadScene as any).realProgress = 1; // Loaded
        (preloadScene as any).startTime = Date.now() - 4000; // > 3s elapsed

        // Trigger update to complete visuals
        (preloadScene as any).updateProgress();

        // Should trigger delayed call for 3000ms
        expect(mockTime.delayedCall).toHaveBeenCalledWith(3000, expect.any(Function));

        // Manually execute the delayed callback
        const callback = mockTime.delayedCall.mock.calls[0][1];
        callback();

        // Verify game started with WormholeScene
        expect(mockScale.off).toHaveBeenCalled();
        expect(mockScenePlugin.start).toHaveBeenCalledWith('WormholeScene');
    });

    it('should skip WormholeScene and start GalaxyScene if galaxyId is in URL', () => {
        // Mock URL search params
        const originalLocation = window.location;
        delete (window as any).location;
        (window as any).location = new URL('http://localhost/?galaxyId=test-galaxy');

        preloadScene.preload();

        // Mock visuals and completion
        (preloadScene as any).background = { setAlpha: vi.fn(), setScale: vi.fn(), setPosition: vi.fn() };
        (preloadScene as any).androidHead = { setAlpha: vi.fn(), setScale: vi.fn(), setPosition: vi.fn() };
        (preloadScene as any).realProgress = 1;
        (preloadScene as any).startTime = Date.now() - 4000;

        // Trigger update
        (preloadScene as any).updateProgress();

        // Execute delay
        const callback = mockTime.delayedCall.mock.calls[0][1];
        callback();

        expect(mockScenePlugin.start).toHaveBeenCalledWith('GalaxyScene', { galaxyId: 'test-galaxy', planetId: null, autoStart: false });

        // Restore window.location
        (window as any).location = originalLocation;
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
