import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MapInteractionManager } from '../../../src/scenes/planet-map/map-interaction';
import type { PlanetData } from '../../../src/scenes/planet-map/planet-registry';
// @ts-ignore
import Phaser from 'phaser';

vi.mock('phaser', () => {
    return {
        default: {
            GameObjects: {
                Container: class { },
                Text: class { },
                Image: class { },
                Graphics: class { }
            }
        }
    }
});

// Mock Scene
const mockScene = {
    add: {
        container: vi.fn().mockReturnValue({
            add: vi.fn(),
            setPosition: vi.fn(),
            setVisible: vi.fn(),
            setDepth: vi.fn(),
            removeAll: vi.fn(),
            destroy: vi.fn()
        }),
        image: vi.fn().mockReturnValue({
            setInteractive: vi.fn().mockReturnThis(),
            on: vi.fn().mockReturnThis(),
            setOrigin: vi.fn().mockReturnThis(),
            setScale: vi.fn().mockReturnThis()
        }),
        text: vi.fn().mockReturnValue({
            setOrigin: vi.fn().mockReturnThis()
        })
    },
    scene: {
        start: vi.fn()
    }
};

describe('MapInteractionManager', () => {
    let manager: MapInteractionManager;

    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-ignore
        manager = new MapInteractionManager(mockScene as unknown as Phaser.Scene);
    });

    it('should create container on initialization', () => {
        expect(mockScene.add.container).toHaveBeenCalled();
    });

    it('should show interaction UI for planet', () => {
        const planet: PlanetData = {
            id: 'test-planet',
            x: 100,
            y: 100,
            type: 'planet',
            name: 'Test Planet',
            unlocked: true,
            connections: [],
            visual: 'P'
        };

        manager.showInteractionUI(planet);
        expect(mockScene.add.container().setVisible).toHaveBeenCalledWith(true);
        expect(mockScene.add.container().setPosition).toHaveBeenCalledWith(100 + 60, 100);
    });

    it('should launch level if available', () => {
        const planet: PlanetData = {
            id: 'level-planet',
            x: 0, y: 0,
            type: 'moon',
            name: 'Level',
            unlocked: true,
            connections: [],
            visual: 'M',
            levelId: 'blood-hunters'
        };

        manager.launchLevelIfAvailable(planet);
        expect(mockScene.scene.start).toHaveBeenCalledWith('BloodHunters');
    });

    it('should not launch level if no levelId', () => {
        const planet: PlanetData = {
            id: 'safe-planet',
            x: 0, y: 0,
            type: 'main',
            name: 'Safe',
            unlocked: true,
            connections: [],
            visual: 'S'
        };

        manager.launchLevelIfAvailable(planet);
        expect(mockScene.scene.start).not.toHaveBeenCalled();
    });
});
