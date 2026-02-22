import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BaseScene from '../../../src/scenes/base-scene';
import { GameManager } from '../../../src/logic/game-manager';
import { CollisionManager } from '../../../src/logic/collision-manager';
import { PlayerController } from '../../../src/logic/player-controller';
import { Starfield } from '../../../src/backgrounds/starfield';
import { Ship } from '../../../src/ships/ship';
import { EngineTrail } from '../../../src/ships/effects/engine-trail';
import { LootUI } from '../../../src/ui/loot-ui';
import { LootType } from '../../../src/ships/types';

import { container } from '../../../src/di/container';

// Mock Phaser globally
vi.mock('phaser', () => ({
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
}));

// Mock DI Container
vi.mock('../../../src/di/container', () => ({
    container: {
        get: vi.fn(),
        bind: vi.fn().mockReturnThis(),
        toConstantValue: vi.fn(),
        isBound: vi.fn().mockReturnValue(false),
        rebind: vi.fn().mockReturnThis()
    },
    bindScene: vi.fn()
}));

// Mock Logic & Systems
vi.mock('../../../src/logic/game-manager', () => ({ GameManager: vi.fn() }));
vi.mock('../../../src/logic/collision-manager', () => ({ CollisionManager: vi.fn() }));
vi.mock('../../../src/logic/player-controller', () => ({ PlayerController: vi.fn() }));
vi.mock('../../../src/backgrounds/starfield', () => ({ Starfield: vi.fn() }));
vi.mock('../../../src/ships/ship', () => ({ Ship: vi.fn() }));
vi.mock('../../../src/ships/effects/engine-trail', () => ({ EngineTrail: vi.fn() }));
vi.mock('../../../src/ui/loot-ui', () => ({ LootUI: vi.fn() }));

vi.mock('../../../src/logic/game-status', () => ({
    GameStatus: {
        getInstance: vi.fn().mockReturnValue({
            getLoot: vi.fn().mockReturnValue({ '🌕': 0, '🪙': 0, '💎': 0, '📦': 0 }),
            updateLoot: vi.fn(),
            isPlanetRevealed: vi.fn().mockReturnValue(false),
            revealPlanet: vi.fn(),
            getShipLoadout: vi.fn().mockReturnValue({}),
        })
    }
}));

vi.mock('phaser3-rex-plugins/plugins/virtualjoystick.js', () => ({
    default: class {
        setVisible = vi.fn();
        setPosition = vi.fn();
    }
}));

class ConcreteBaseScene extends BaseScene {
    constructor() {
        super('BaseSceneTest');
    }
}

describe('BaseScene', () => {
    let scene: ConcreteBaseScene;
    let mockGameObject: any;

    const mockGameManager = {
        isGameActive: vi.fn().mockReturnValue(true),
        isVictoryState: vi.fn().mockReturnValue(false),
        handleGameOver: vi.fn(),
        handleResize: vi.fn(),
    };

    const mockCollisionManager = {
        getCategories: vi.fn().mockReturnValue({
            shipCategory: 0x0001,
            laserCategory: 0x0002,
            enemyCategory: 0x0004,
            enemyLaserCategory: 0x0008,
            lootCategory: 0x0010,
            wallCategory: 0x0020
        }),
        setupCollisions: vi.fn(),
        config: vi.fn(),
    };

    const mockPlayerController = {
        setFireButton: vi.fn(),
        update: vi.fn(),
    };

    const mockStarfieldInstance = {
        config: vi.fn(),
        update: vi.fn(),
    };

    const mockLootUIInstance = {
        create: vi.fn(),
        updateCounts: vi.fn(),
        updatePositions: vi.fn(),
        destroy: vi.fn(),
    };

    const mockShipInstance = {
        setEffect: vi.fn(),
        sprite: {
            active: true,
            x: 100,
            y: 100,
            setFixedRotation: vi.fn(),
            setAngle: vi.fn(),
        },
        explode: vi.fn(),
        destroy: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup mock implementations
        (GameManager as any).mockImplementation(function () { return mockGameManager; });
        (CollisionManager as any).mockImplementation(function () { return mockCollisionManager; });
        (PlayerController as any).mockImplementation(function () { return mockPlayerController; });
        (Starfield as any).mockImplementation(function () { return mockStarfieldInstance; });
        (LootUI as any).mockImplementation(function () { return mockLootUIInstance; });
        (Ship as any).mockImplementation(function () { return mockShipInstance; });

        // Setup container.get return values
        (container.get as any).mockImplementation((type: any) => {
            if (type === GameManager) return mockGameManager;
            if (type === CollisionManager) return mockCollisionManager;
            if (type === PlayerController) return mockPlayerController;
            if (type === Starfield) return mockStarfieldInstance;
            if (type === LootUI) return mockLootUIInstance;
            return null;
        });

        scene = new ConcreteBaseScene();

        // Mock Phaser Scene properties manually
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
                createCursorKeys: vi.fn().mockReturnValue({}),
            },
        } as any;

        scene.registry = {
            get: vi.fn().mockImplementation((key) => {
                // Default behavior: godMode is disabled
                if (key === 'godMode') return false;
                return undefined;
            }),
            set: vi.fn(),
        } as any;

        scene.game = { canvas: { style: {} } } as any;
        scene.matter = { world: { setBounds: vi.fn() } } as any;
        scene.sys = { isActive: vi.fn().mockReturnValue(true) } as any;
        scene.time = { delayedCall: vi.fn((_delay, cb) => cb()) } as any;
    });

    it('should initialize managers and create ship on create', () => {
        scene.create();
        expect(container.get).toHaveBeenCalledWith(GameManager);
        expect(container.get).toHaveBeenCalledWith(CollisionManager);
        expect(container.get).toHaveBeenCalledWith(Starfield);

        expect(Ship).toHaveBeenCalled();
        expect(EngineTrail).toHaveBeenCalled();
    });

    it('should setup controls and UI', () => {
        scene.create();
        expect(scene.input.keyboard!.createCursorKeys).toHaveBeenCalled();
        expect(container.get).toHaveBeenCalledWith(PlayerController);
        expect(scene.add.text).toHaveBeenCalled();
    });

    it('should handle resize', () => {
        scene.create();
        (scene.matter.world.setBounds as any).mockClear();

        (scene as any).handleResize({ width: 1000, height: 800 });

        expect(scene.matter.world.setBounds).toHaveBeenCalledWith(-100, -100, 1200, 1000);
        expect(mockLootUIInstance.updatePositions).toHaveBeenCalled();
    });

    it('should handle loot collection - silver', () => {
        scene.create();

        const mockLoot = {
            active: true,
            value: 10,
            lootType: LootType.SILVER,
            config: { value: 10, type: LootType.SILVER },
            destroy: vi.fn(),
        };

        (scene as any).handleLootCollected(mockLoot);

        expect(mockLootUIInstance.updateCounts).toHaveBeenCalledWith(LootType.SILVER, 10);
        expect(scene.time.delayedCall).toHaveBeenCalledWith(
            0,
            expect.any(Function),
            undefined, // args
            scene // scope
        );
    });

    it('should handle game over', () => {
        scene.create();

        const gameOverCallback = mockCollisionManager.config.mock.calls[0][0];
        gameOverCallback();

        expect(mockShipInstance.explode).toHaveBeenCalled();
        expect(mockGameManager.handleGameOver).toHaveBeenCalled();
    });

    it('should allow collision with loot when (God Mode) is enabled', () => {
        // Setup registry to enable God Mode
        (scene.registry.get as any).mockImplementation((key: string) => {
            if (key === 'godMode') return true;
            return undefined;
        });

        const categories = mockCollisionManager.getCategories();

        scene.create();

        // Check that Ship was initialized with limited collision mask (only loot)
        expect(Ship).toHaveBeenCalledWith(
            expect.anything(), // scene
            expect.anything(), // x
            expect.anything(), // y
            expect.anything(), // config
            expect.objectContaining({
                collidesWith: categories.lootCategory
            })
        );
    });
    it('should recreate player ship', () => {
        scene.create();

        // Simulating that Ship is now bound
        (container.isBound as any).mockReturnValue(true);

        const oldShip = (scene as any).ship;
        const oldShipDestroySpy = vi.spyOn(oldShip, 'destroy');

        const newShipConfig = {
            definition: { id: 'new-ship', name: 'New Ship' }
        };

        // Call public recreatePlayerShip (need to cast accessed via logic or public method if BaseScene exposes it)
        // BaseScene exposes it as public method now.
        scene.recreatePlayerShip(newShipConfig as any);

        expect(oldShipDestroySpy).toHaveBeenCalled();
        expect(scene.registry.set).toHaveBeenCalledWith('playerShipConfig', newShipConfig);
        expect(Ship).toHaveBeenCalledTimes(2); // Initial creation + recreation
        expect(container.rebind).toHaveBeenCalledWith(Ship);
        expect(container.get).toHaveBeenCalledWith(PlayerController); // Should re-setup controls
    });
});
