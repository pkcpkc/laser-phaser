import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShootEmUpScene } from '../../../../src/scenes/shoot-em-ups/shoot-em-up-scene';
import { Level } from '../../../../src/scenes/shoot-em-ups/levels/level';
import { Loot } from '../../../../src/ships/loot';
import { GameStatus } from '../../../../src/logic/game-status';
import * as LevelRegistry from '../../../../src/scenes/shoot-em-ups/level-registry';

const MockPhaser = vi.hoisted(() => {
    const mock = {
        Scene: class {
            sys = { settings: { key: 'TestScene' } };
            add = {
                text: vi.fn(),
                image: vi.fn()
            };
            scale = { width: 800, height: 600, on: vi.fn() };
            game = { canvas: { style: {} } };
            textures = { exists: vi.fn().mockReturnValue(true) };
            input = {
                addPointer: vi.fn(),
                keyboard: { once: vi.fn(), createCursorKeys: vi.fn(), on: vi.fn() }
            };
            matter = {
                world: {
                    setBounds: vi.fn(),
                    nextCategory: vi.fn().mockReturnValue(1),
                    on: vi.fn()
                }
            };
            create() { }
            update() { }
        },
        GameObjects: {
            Image: class { },
            Text: class { },
            Container: class { },
        },
        Physics: {
            Matter: {
                Image: class { },
                Sprite: class { }
            }
        },
        Input: {
            Keyboard: {
                Key: class { },
                KeyCodes: { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39 }
            }
        },
        Utils: {
            Objects: {
                GetValue: vi.fn((source, key, defaultValue) => source ? source[key] || defaultValue : defaultValue)
            }
        },
        Math: {
            Vector2: class { },
            Between: vi.fn(),
            FloatBetween: vi.fn(),
            Distance: {
                Between: vi.fn()
            },
            Angle: {
                Between: vi.fn()
            }
        },
        Geom: {
            Circle: class {
                static Contains = vi.fn();
            },
            Rectangle: class {
                static Contains = vi.fn();
            }
        }
    };
    (global as any).Phaser = mock; // Assign to global immediately
    return mock;
});

// Mock Phaser completely to avoid device feature detection side effects
vi.mock('phaser', () => {
    return {
        default: MockPhaser
    };
});

// Mock Level
vi.mock('../../../../src/scenes/shoot-em-ups/levels/level', () => {
    return {
        // Use a function declaration so it can be called with 'new'
        Level: vi.fn(function () {
            return {
                start: vi.fn(),
                update: vi.fn(),
                destroy: vi.fn()
            };
        })
    };
});

describe('ShootEmUpScene', () => {
    let scene: ShootEmUpScene;

    beforeEach(() => {
        // Mock phaser scene context - ShootEmUpScene is now concrete
        scene = new ShootEmUpScene();
        scene.sys = {
            settings: { key: 'ShootEmUpScene' }
        } as any;

        const mockGameObject = {
            setOrigin: vi.fn().mockReturnThis(),
            setInteractive: vi.fn().mockReturnThis(),
            on: vi.fn().mockReturnThis(),
            setVisible: vi.fn().mockReturnThis(),
            setScrollFactor: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
            setScale: vi.fn().mockReturnThis(),
            setAlpha: vi.fn().mockReturnThis(),
            setText: vi.fn().mockReturnThis(),
            setPosition: vi.fn().mockReturnThis()
        };

        // Mock standard scene properties
        scene.add = {
            text: vi.fn().mockReturnValue(mockGameObject),
            image: vi.fn().mockReturnValue(mockGameObject),
            sprite: vi.fn().mockReturnValue(mockGameObject),
            tileSprite: vi.fn().mockReturnValue(mockGameObject),
            container: vi.fn().mockReturnValue({ ...mockGameObject, add: vi.fn() }),
            graphics: vi.fn().mockReturnValue({
                clear: vi.fn().mockReturnThis(),
                lineStyle: vi.fn().mockReturnThis(),
                fillStyle: vi.fn().mockReturnThis(),
                fillRect: vi.fn().mockReturnThis(),
                strokeRect: vi.fn().mockReturnThis()
            })
        } as any;

        scene.scale = { width: 800, height: 600 } as any;

        // Mock Managers (base scene expected them)
        (scene as any).gameManager = {
            isGameActive: vi.fn().mockReturnValue(true),
            handleGameOver: vi.fn()
        };
        (scene as any).collisionManager = {
            getCategories: vi.fn().mockReturnValue({
                shipCategory: 1,
                enemyCategory: 2,
                laserCategory: 4,
                enemyLaserCategory: 8,
                lootCategory: 16
            })
        };
        scene.registry = {
            get: vi.fn(),
            set: vi.fn()
        } as any;
        scene.scene = {
            start: vi.fn(),
            key: 'ShootEmUpScene'
        } as any;
        scene.events = {
            on: vi.fn(),
            once: vi.fn(),
            off: vi.fn()
        } as any;
    });

    it('should start level on create', () => {
        // Hack: bypass super.create() complexity by just testing logic or mocking base create
        // Since BaseScene.create() does a lot, we might want to just call scene.create() 
        // IF we mock BaseScene methods. Or simpler: test startLevel if it was public.
        // It is private.

        // Let's call create and see if Level constructor is called.
        // We need to mock BaseScene.create if possible or provide all deps.
        // For now, let's assume dependencies are set (we mocked managers).

        // Use mocks from MockPhaser or existing setup
        scene.scale.on = vi.fn();

        // Mock createPlayerShip (protected method of BaseScene)
        (scene as any).createPlayerShip = vi.fn();
        (scene as any).createUI = vi.fn();
        (scene as any).setupControls = vi.fn();

        scene.create();

        expect(Level).toHaveBeenCalled();
    });
    it('should NOT destroy level on victory', () => {
        // Setup level
        (scene as any).createPlayerShip = vi.fn();
        (scene as any).createUI = vi.fn();
        (scene as any).setupControls = vi.fn();
        scene.scale.on = vi.fn();

        scene.create();

        const level = (scene as any).level;
        expect(level).toBeDefined();

        // Mock gameManager.handleVictory
        (scene as any).gameManager.handleVictory = vi.fn();

        // Trigger handleVictory
        (scene as any).handleVictory();

        // Level should persist
        expect(level.destroy).not.toHaveBeenCalled();
        expect((scene as any).gameManager.handleVictory).toHaveBeenCalled();
    });

    it('should transition to WormholeScene on victory when warpGalaxyId is present', () => {
        // Mock registry first because init() uses it
        scene.registry = {
            get: vi.fn().mockReturnValue('source-galaxy'),
            set: vi.fn()
        } as any;

        // Setup scene data
        scene.init({
            warpGalaxyId: 'target-galaxy',
            galaxyId: 'source-galaxy'
        });

        // Mock scene.scene.start
        scene.scene = {
            start: vi.fn()
        } as any;

        // Mock gameManager.isVictoryState
        (scene as any).gameManager.isVictoryState = vi.fn().mockReturnValue(true);

        // Trigger finishLevel (which is called by onGameOverInput on victory)
        (scene as any).finishLevel(true);

        expect(scene.scene.start).toHaveBeenCalledWith('WormholeScene', { galaxyId: 'target-galaxy' });
    });

    it('should transition to GalaxyScene on victory when warpGalaxyId is NOT present', () => {
        // Mock registry first because init() uses it
        scene.registry = {
            get: vi.fn().mockReturnValue('source-galaxy'),
            set: vi.fn()
        } as any;

        // Setup scene data
        scene.init({
            galaxyId: 'source-galaxy'
        });

        // Mock scene.scene.start
        scene.scene = {
            start: vi.fn()
        } as any;

        // Mock gameManager.isVictoryState
        (scene as any).gameManager.isVictoryState = vi.fn().mockReturnValue(true);

        // Trigger finishLevel
        (scene as any).finishLevel(true);

        expect(scene.scene.start).toHaveBeenCalledWith('GalaxyScene', expect.objectContaining({
            galaxyId: 'source-galaxy',
            victory: true, // Should be true for victory case
            autoStart: false
        }));
    });

    it('should transition to GalaxyScene on RETRY (game over) with autoStart: false', () => {
        // Mock registry
        scene.registry = {
            get: vi.fn().mockReturnValue('source-galaxy'),
            set: vi.fn()
        } as any;

        // Setup scene data
        scene.init({
            returnPlanetId: 'current-planet',
            galaxyId: 'source-galaxy'
        });

        // Mock scene.scene.start
        scene.scene = {
            start: vi.fn()
        } as any;

        // Mock gameManager.isVictoryState -> FALSE for Game Over
        (scene as any).gameManager.isVictoryState = vi.fn().mockReturnValue(false);

        // Mock cleanup methods
        (scene as any).level = { destroy: vi.fn() };
        (scene as any).ship = { destroy: vi.fn() };

        // Trigger onGameOverInput (NOT finishLevel directly, as logic is in onGameOverInput now for retry)
        // Actually onGameOverInput calls scene.start directly for retry case now.
        (scene as any).onGameOverInput();

        expect(scene.scene.start).toHaveBeenCalledWith('GalaxyScene', {
            planetId: 'current-planet',
            victory: false,
            galaxyId: 'source-galaxy',
            autoStart: false
        });
    });

    it('should override background in init if level entry has it', () => {
        // Mock getLevel to return background
        vi.spyOn(LevelRegistry, 'getLevel').mockReturnValue({ backgroundTexture: 'level-bg' } as any);

        scene.init({ levelId: 'some-level' });
        expect((scene as any).backgroundTexture).toBe('level-bg');
    });

    it('should handle ship-debug-level config and UI', () => {
        const categories = {
            shipCategory: 1,
            enemyCategory: 2,
            laserCategory: 4,
            enemyLaserCategory: 8,
            lootCategory: 16
        };
        (scene as any).collisionManager.getCategories.mockReturnValue(categories);
        (scene as any).createPlayerShip = vi.fn();
        (scene as any).createUI = vi.fn();
        (scene as any).setupControls = vi.fn();
        scene.scale.on = vi.fn();

        scene.init({ levelId: 'ship-debug-level' });

        const collisionConfig = (scene as any).getShipCollisionConfig();
        expect(collisionConfig.hasUnlimitedAmmo).toBe(true);

        // create() should call createShipDebugUI
        const documentSpy = vi.spyOn(document, 'createElement');
        scene.create();
        expect(documentSpy).toHaveBeenCalledWith('select');

        // Mocking DOM is tricky but this verifies the branch was hit
        documentSpy.mockRestore();
    });

    it('should record victory in GameStatus', () => {
        const gameStatusMock = {
            addVictory: vi.fn(),
            markIntroSeen: vi.fn(),
            markPlanetDefeated: vi.fn()
        };

        vi.spyOn(GameStatus, 'getInstance').mockReturnValue(gameStatusMock as any);

        // Use a registry mock that actually stores something
        let activeGalaxyId = 'test-galaxy';
        vi.mocked(scene.registry.get).mockImplementation((key: string | string[]) => key === 'activeGalaxyId' ? activeGalaxyId : undefined);

        scene.init({ returnPlanetId: 'test-planet', galaxyId: activeGalaxyId });
        scene.scene = { start: vi.fn() } as any;

        (scene as any).finishLevel(true);

        expect(gameStatusMock.addVictory).toHaveBeenCalledWith('test-galaxy');
        expect(gameStatusMock.markIntroSeen).toHaveBeenCalledWith('test-planet');
    });

    it('should prevent continuing victory if loot remains', () => {
        (scene as any).gameManager.isVictoryState = vi.fn().mockReturnValue(true);
        (scene as any).gameManager.isGameActive = vi.fn().mockReturnValue(false);
        (scene as any).gameManager.setRestartMessage = vi.fn();

        // Simulate loot child using the real class prototype for instanceof check
        const loot = Object.create(Loot.prototype);
        loot.active = true;
        (scene as any).children = { list: [loot] };

        // Test onGameOverInput
        (scene as any).onGameOverInput();
        // Should NOT call scene.start
        expect(scene.scene.start).not.toHaveBeenCalled();

        // Test update message
        scene.update(0, 16);
        expect((scene as any).gameManager.setRestartMessage).toHaveBeenCalledWith('COLLECT ALL LOOT');
    });

    it('should handle getLevelClass fallback', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        scene.init({ levelId: 'invalid-level' });

        const config = (scene as any).getLevelClass();
        expect(config.name).toBe('Unknown');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
        consoleSpy.mockRestore();
    });
});
