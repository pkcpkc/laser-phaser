import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MapInteractionManager } from '../../../src/scenes/planet-map/map-interaction';
import type { PlanetData } from '../../../src/scenes/planet-map/planet-data';
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
            setAlpha: vi.fn(),
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
            setOrigin: vi.fn().mockReturnThis(),
            setInteractive: vi.fn().mockReturnThis(), // Added setInteractive
            on: vi.fn().mockReturnThis(), // Added on for chaining
            setPosition: vi.fn().mockReturnThis(), // Added setPosition
            setVisible: vi.fn().mockReturnThis(),
            setText: vi.fn().mockReturnThis(),
            setRotation: vi.fn().mockReturnThis(),
            setAngle: vi.fn().mockReturnThis(),
            setAlpha: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
            destroy: vi.fn(),
            width: 100,
            postFX: {
                clear: vi.fn(),
                addColorMatrix: vi.fn().mockReturnValue({
                    saturate: vi.fn(),
                    multiply: vi.fn()
                })
            }
        })
    },
    scene: {
        start: vi.fn()
    },
    tweens: {
        add: vi.fn()
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
            name: 'Test Planet',
            hidden: false,
            visualScale: 1.0,
            interaction: {
                levelId: 'some-level'
            }
        };

        manager.showInteractionUI(planet);
        expect(mockScene.add.container().setVisible).toHaveBeenCalledWith(true);
        // Base Radius 30 * Scale 1.0 + Gap 5 + HalfHeight 12 = 47 offset
        expect(mockScene.add.container().setPosition).toHaveBeenCalledWith(100, 100 + 47);
    });

    it('should launch level if available', () => {
        const planet: PlanetData = {
            id: 'level-planet',
            x: 0, y: 0,
            name: 'Level',
            hidden: false,
            visualScale: 1.0,
            interaction: {
                levelId: 'blood-hunters'
            },
            tint: 0xffff00  // yellow
        };

        manager.launchLevelIfAvailable(planet);
        expect(mockScene.scene.start).toHaveBeenCalledWith('BloodHunters', {
            returnPlanetId: 'level-planet',
            warpUniverseId: undefined,
            planetColor: '#ffff00'
        });
    });

    it('should not launch level if no levelId', () => {
        const planet: PlanetData = {
            id: 'safe-planet',
            x: 0, y: 0,
            name: 'Safe',
            hidden: false,
            visualScale: 1.0,
            interaction: {}
        };

        manager.launchLevelIfAvailable(planet);
        expect(mockScene.scene.start).not.toHaveBeenCalled();
    });
});
