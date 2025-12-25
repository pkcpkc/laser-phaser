import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser globally
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            GameObjects: {
                Text: class { },
                Image: class { },
                Sprite: class { }
            },
            Math: {
                Vector2: class { },
                Clamp: vi.fn()
            },
            Physics: {
                Matter: {
                    Sprite: class { },
                    Image: class { }
                }
            },
            Structs: {
                Size: class {
                    constructor(public width = 0, public height = 0) { }
                }
            }
        }
    };
});

import BaseScene from '../../src/scenes/base-scene';
import { GameManager } from '../../src/logic/game-manager';
import { CollisionManager } from '../../src/logic/collision-manager';
import { PlayerController } from '../../src/logic/player-controller';
import { Starfield } from '../../src/backgrounds/starfield';
import { BigCruiserWhiteLaser } from '../../src/ships/configurations/big-cruiser-white-laser';
import { Ship } from '../../src/ships/ship';
import { EngineTrail } from '../../src/ships/effects/engine-trail';
import { LootUI } from '../../src/ui/loot-ui';

// Mocks
vi.mock('../../src/logic/game-manager', () => ({
    GameManager: vi.fn()
}));
vi.mock('../../src/logic/collision-manager', () => ({
    CollisionManager: vi.fn()
}));
vi.mock('../../src/logic/player-controller', () => ({
    PlayerController: vi.fn()
}));
vi.mock('../../src/backgrounds/starfield', () => ({
    Starfield: vi.fn()
}));
vi.mock('../../src/ships/ship', () => ({
    Ship: vi.fn()
}));
vi.mock('../../src/ships/effects/engine-trail', () => ({
    EngineTrail: vi.fn()
}));
vi.mock('../../src/logic/game-status', () => ({
    GameStatus: {
        getInstance: vi.fn().mockReturnValue({
            getLoot: vi.fn().mockReturnValue({ gold: 0, silver: 0, gems: 0, mounts: 0 }),
            updateLoot: vi.fn(),
            isPlanetRevealed: vi.fn().mockReturnValue(false),
            revealPlanet: vi.fn(),
        })
    }
}));
vi.mock('../../src/ui/loot-ui', () => ({
    LootUI: vi.fn()
}));
vi.mock('phaser3-rex-plugins/plugins/virtualjoystick.js', () => {
    return {
        default: class {
            setVisible = vi.fn();
            setPosition = vi.fn();
        }
    };
});

class ConcreteBaseScene extends BaseScene {
    constructor() {
        super('BaseSceneTest');
    }
}

describe('BaseScene', () => {
    let scene: ConcreteBaseScene;
    let mockGameObject: any;

    beforeEach(() => {
        vi.clearAllMocks();
        scene = new ConcreteBaseScene();

        // Mock Phaser Scene stuff
        mockGameObject = {
            setOrigin: vi.fn().mockReturnThis(),
            setVisible: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
            setInteractive: vi.fn().mockReturnThis(),
            on: vi.fn().mockReturnThis(),
            setText: vi.fn(),
            setPosition: vi.fn(),
        };

        scene.add = {
            text: vi.fn().mockReturnValue(mockGameObject),
            circle: vi.fn().mockReturnValue(mockGameObject),
            image: vi.fn().mockReturnValue(mockGameObject),
        } as any;

        scene.scale = {
            width: 800,
            height: 600,
            on: vi.fn(),
        } as any;

        scene.input = {
            addPointer: vi.fn(),
            on: vi.fn(),
            keyboard: {
                once: vi.fn(),
                on: vi.fn(),
                createCursorKeys: vi.fn(),
            },
        } as any;

        scene.game = {
            canvas: { style: {} }
        } as any;

        scene.matter = {
            world: {
                setBounds: vi.fn(),
            }
        } as any;

        scene.sys = {
            isActive: vi.fn().mockReturnValue(true)
        } as any;

        scene.time = {
            delayedCall: vi.fn((_delay, cb) => cb()),
        } as any;

        // Setup mock implementations for managers
        (GameManager as any).mockImplementation(function () {
            return {
                isGameActive: vi.fn().mockReturnValue(true),
                handleGameOver: vi.fn(),
                handleResize: vi.fn(),
            };
        });

        (CollisionManager as any).mockImplementation(function () {
            return {
                getCategories: vi.fn().mockReturnValue({ shipCategory: 1 }),
                setupCollisions: vi.fn(),
            };
        });

        (PlayerController as any).mockImplementation(function () {
            return {
                setFireButton: vi.fn(),
                update: vi.fn(),
            };
        });

        // Mock LootUI
        (LootUI as any).mockImplementation(function () {
            return {
                create: vi.fn(),
                updateCounts: vi.fn(),
                updatePositions: vi.fn(),
                destroy: vi.fn(),
            };
        });

        (Ship as any).mockImplementation(function () {
            return {
                setEffect: vi.fn(),
                sprite: {
                    active: true,
                    x: 100,
                    y: 100
                },
                explode: vi.fn(),
            };
        });
    });

    it('should initialize managers and create ship on create', () => {
        scene.create();
        expect(GameManager).toHaveBeenCalledWith(scene);
        expect(CollisionManager).toHaveBeenCalledWith(scene, expect.any(Function), expect.any(Function));
        expect(Starfield).toHaveBeenCalledWith(scene, 'nebula', undefined);
        expect(Ship).toHaveBeenCalledWith(expect.any(Object), expect.any(Number), expect.any(Number), BigCruiserWhiteLaser, expect.any(Object));
        expect(EngineTrail).toHaveBeenCalled();
    });

    it('should setup controls and UI', () => {
        scene.create();
        expect(scene.input.keyboard!.createCursorKeys).toHaveBeenCalled();
        expect(PlayerController).toHaveBeenCalled();
        expect(scene.add.text).toHaveBeenCalled();
    });

    it('should handle resize', () => {
        scene.create();
        (scene.matter.world.setBounds as any).mockClear();

        // Invoke resize manually via the callback registered
        // Or directly call protected method if casted
        (scene as any).handleResize({ width: 1000, height: 800 });

        expect(scene.matter.world.setBounds).toHaveBeenCalledWith(0, 0, 1000, 800);
        // Verify lootUI.updatePositions was called
        const lootUIInstance = (LootUI as any).mock.instances[0];
        expect(lootUIInstance.updatePositions).toHaveBeenCalled();
    });

    it('should handle loot collection - silver', () => {
        scene.create();

        const mockLoot = {
            active: true,
            config: { value: 10, type: 'silver' },
            destroy: vi.fn(),
        };

        // Invoke directly to test logic
        (scene as any).handleLootCollected(mockLoot);

        // Verify lootUI.updateCounts was called with accumulated count
        const lootUIInstance = (LootUI as any).mock.instances[0];
        // Since silverCount starts at 0 (from GameStatus mock), it should be 10
        expect(lootUIInstance.updateCounts).toHaveBeenCalledWith('silver', 10);

        // Verify delayed call
        expect(scene.time.delayedCall).toHaveBeenCalledWith(0, expect.any(Function));
    });

    it('should handle game over', () => {
        scene.create();

        // Extract handleGameOver callback passed to CollisionManager
        const gameOverCallback = (CollisionManager as any).mock.calls[0][1];

        gameOverCallback();

        // Expect ship explode
        const shipInstance = (Ship as any).mock.instances[0];
        expect(shipInstance.explode).toHaveBeenCalled();

        // Expect game manager handle game over
        const gameManagerInstance = (GameManager as any).mock.instances[0];
        expect(gameManagerInstance.handleGameOver).toHaveBeenCalled();
    });
});
