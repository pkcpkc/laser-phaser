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
import { BigCruiser } from '../../src/ships/big-cruiser';
import { EngineTrail } from '../../src/ships/effects/engine-trail';

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
vi.mock('../../src/ships/big-cruiser', () => ({
    BigCruiser: vi.fn()
}));
vi.mock('../../src/ships/effects/engine-trail', () => ({
    EngineTrail: vi.fn()
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

        (BigCruiser as any).mockImplementation(function () {
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
        expect(Starfield).toHaveBeenCalledWith(scene);
        expect(BigCruiser).toHaveBeenCalled();
        expect(EngineTrail).toHaveBeenCalled();
    });

    it('should setup controls and UI', () => {
        scene.create();
        expect(scene.input.keyboard!.createCursorKeys).toHaveBeenCalled();
        expect(PlayerController).toHaveBeenCalled();
        expect(scene.add.text).toHaveBeenCalledTimes(6); // silver, gold, gem, mount, joystick thumb, fire button
    });

    it('should handle resize', () => {
        scene.create();
        // Invoke resize manually via the callback registered
        // Or directly call protected method if casted
        (scene as any).handleResize({ width: 1000, height: 800 });

        expect(scene.matter.world.setBounds).toHaveBeenCalledWith(0, 0, 1000, 800);
        // Verify mock calls on text objects
        expect(mockGameObject.setPosition).toHaveBeenCalled();
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

        expect(mockGameObject.setText).toHaveBeenCalledWith('10 🪙');

        // Verify delayed call
        expect(scene.time.delayedCall).toHaveBeenCalledWith(0, expect.any(Function));
    });

    it('should handle game over', () => {
        scene.create();

        // Extract handleGameOver callback passed to CollisionManager
        const gameOverCallback = (CollisionManager as any).mock.calls[0][1];

        gameOverCallback();

        // Expect ship explode
        const shipInstance = (BigCruiser as any).mock.instances[0];
        expect(shipInstance.explode).toHaveBeenCalled();

        // Expect game manager handle game over
        const gameManagerInstance = (GameManager as any).mock.instances[0];
        expect(gameManagerInstance.handleGameOver).toHaveBeenCalled();
    });
});
