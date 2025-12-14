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

import TraderScene from '../../../src/scenes/traders/trader-scene';

describe('TraderScene', () => {
    let scene: TraderScene;
    let mockGameObject: any;
    let mockScenePlugin: any;

    beforeEach(() => {
        scene = new TraderScene();

        mockGameObject = {
            setOrigin: vi.fn().mockReturnThis(),
            setInteractive: vi.fn().mockReturnThis(),
            on: vi.fn().mockReturnThis(),
        };

        scene.add = {
            text: vi.fn().mockReturnValue(mockGameObject),
        } as any;

        scene.scale = {
            width: 800,
            height: 600,
        } as any;

        mockScenePlugin = {
            start: vi.fn(),
        };
        scene.scene = mockScenePlugin;
    });

    it('should create title and back button', () => {
        scene.create();
        expect(scene.add.text).toHaveBeenCalledTimes(2);
        expect(scene.add.text).toHaveBeenCalledWith(400, 300, expect.stringContaining('TRADER'), expect.any(Object));
    });

    it('should navigate back to map', () => {
        scene.create();
        const callback = mockGameObject.on.mock.calls[0][1];
        callback();
        expect(mockScenePlugin.start).toHaveBeenCalledWith('PlanetMapScene');
    });
});
