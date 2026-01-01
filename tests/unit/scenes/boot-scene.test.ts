import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser globally
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class {
                sys = { config: 'BootScene' };
            },
            GameObjects: {
                Image: class { },
                Text: class { }
            }
        }
    };
});

import BootScene from '../../../src/scenes/boot-scene';

describe('BootScene', () => {
    let bootScene: BootScene;
    let mockLoad: any;
    let mockScenePlugin: any;

    beforeEach(() => {
        bootScene = new BootScene();

        mockLoad = {
            image: vi.fn(),
        };

        mockScenePlugin = {
            start: vi.fn(),
        };

        // Inject mocks
        (bootScene as any).load = mockLoad;
        (bootScene as any).scene = mockScenePlugin;
    });

    it('should be named BootScene', () => {
        expect(bootScene.sys.config).toBe('BootScene');
    });

    it('should scale logo in preload', () => {
        bootScene.preload();
        expect(mockLoad.image).toHaveBeenCalledWith('logo', 'assets/images/laser-phaser-logo.png');
    });

    it('should start PreloadScene in create', () => {
        bootScene.create();
        expect(mockScenePlugin.start).toHaveBeenCalledWith('PreloadScene');
    });
});
