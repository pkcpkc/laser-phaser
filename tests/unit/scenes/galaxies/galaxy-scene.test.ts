import { describe, it, expect, vi, beforeEach } from 'vitest';
import GalaxyScene from '../../../../src/scenes/galaxies/galaxy-scene';
import { StorylineManager } from '../../../../src/logic/storyline-manager';
import { GameStatus } from '../../../../src/logic/game-status';
import { GalaxyFactory } from '../../../../src/scenes/galaxies/galaxy-factory';
import { LocaleManager } from '../../../../src/config/locale-manager';
import { PlanetVisuals } from '../../../../src/scenes/galaxies/planets/planet-visuals';
import { GalaxyInteractionManager } from '../../../../src/scenes/galaxies/galaxy-interaction';
import { PlayerShipController } from '../../../../src/scenes/galaxies/player-ship-controller';
import { PlanetNavigator } from '../../../../src/scenes/galaxies/planet-navigator';
import { WarpStarfield } from '../../../../src/backgrounds/warp-starfield';
import { LootUI } from '../../../../src/ui/loot-ui';
import { PlanetIntroOverlay } from '../../../../src/scenes/galaxies/planets/planet-intro-overlay';
import { container } from '../../../../src/di/container';
// Mock dependencies
vi.mock('../../../../src/logic/storyline-manager');
vi.mock('../../../../src/logic/game-status');
vi.mock('../../../../src/scenes/galaxies/galaxy-factory');
vi.mock('../../../../src/config/locale-manager');
vi.mock('../../../../src/di/container', () => ({
    container: {
        get: vi.fn(),
        bind: vi.fn().mockReturnThis(),
        rebind: vi.fn().mockReturnThis(),
        isBound: vi.fn().mockReturnValue(false),
        toConstantValue: vi.fn()
    },
    bindScene: vi.fn()
}));
// Simple mocks without inversify logic since we mock the container
vi.mock('../../../../src/scenes/galaxies/galaxy-interaction', () => ({
    GalaxyInteractionManager: class {
        setGalaxyId = vi.fn();
        setStorylineCallback = vi.fn();
        showInteractionUI = vi.fn();
        hide = vi.fn();
        launchLevelIfAvailable = vi.fn();
    }
}));
vi.mock('../../../../src/scenes/galaxies/player-ship-controller', () => ({
    PlayerShipController: class {
        create = vi.fn().mockReturnValue({ x: 0, y: 0 });
        getShip = vi.fn().mockReturnValue({ x: 0, y: 0 });
        setPosition = vi.fn();
        travelTo = vi.fn();
    }
}));
vi.mock('../../../../src/scenes/galaxies/planet-navigator', () => ({
    PlanetNavigator: class {
        getCurrentPlanetId = vi.fn().mockReturnValue('planet-1');
        setCurrentPlanetId = vi.fn();
        areControlsEnabled = vi.fn().mockReturnValue(true);
        handlePlanetClick = vi.fn();
        travelToPlanet = vi.fn();
        moveToPlanet = vi.fn();
        navigate = vi.fn();
        showStoryline = vi.fn();
        checkAndShowIntro = vi.fn();
        config = vi.fn();
    }
}));
vi.mock('../../../../src/scenes/galaxies/planets/planet-intro-overlay', () => ({
    PlanetIntroOverlay: class {
        constructor(_scene?: any) { }
    }
}));
vi.mock('../../../../src/scenes/galaxies/planets/planet-visuals', () => ({
    PlanetVisuals: class {
        createVisuals = vi.fn();
        updateVisibility = vi.fn();
        update = vi.fn();
        animateUnlock = vi.fn();
    }
}));
vi.mock('../../../../src/backgrounds/warp-starfield', () => ({
    WarpStarfield: class {
        resize = vi.fn();
        setSpeed = vi.fn();
    }
}));
vi.mock('../../../../src/ui/loot-ui', () => ({
    LootUI: class {
        create = vi.fn();
        updatePositions = vi.fn();
        updateCounts = vi.fn();
        setVisible = vi.fn();
        destroy = vi.fn();
    }
}));

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class {
                sys = {
                    events: { on: vi.fn(), off: vi.fn() },
                    displayList: { remove: vi.fn() },
                    updateList: { remove: vi.fn() }
                };
                scale = { width: 800, height: 600, on: vi.fn() };
                input = { keyboard: { createCursorKeys: vi.fn() } };
                add = {
                    image: vi.fn().mockReturnThis(),
                    rectangle: vi.fn().mockReturnThis(),
                    text: vi.fn().mockReturnThis(),
                    container: vi.fn().mockReturnThis(),
                    existing: vi.fn()
                };
                tweens = { add: vi.fn() };
                time = { delayedCall: vi.fn() };
                cache = {
                    text: { exists: vi.fn(), get: vi.fn() },
                    json: { exists: vi.fn(), get: vi.fn() }
                };
                registry = { set: vi.fn(), get: vi.fn() };
            },
            GameObjects: {
                Image: class {
                    setOrigin = vi.fn().mockReturnThis();
                    setDepth = vi.fn().mockReturnThis();
                    setScale = vi.fn().mockReturnThis();
                    setVisible = vi.fn().mockReturnThis();
                    setAngle = vi.fn().mockReturnThis();
                    setPosition = vi.fn().mockReturnThis();
                    x = 0;
                    y = 0;
                },
                Container: class {
                    add = vi.fn();
                    setDepth = vi.fn();
                    setPosition = vi.fn();
                    destroy = vi.fn();
                }
            },
            Math: {
                Vector2: class {
                    x = 0;
                    y = 0;
                    constructor(x = 0, y = 0) {
                        this.x = x;
                        this.y = y;
                    }
                    distance() { return 0; }
                    copy() { return this; }
                },
                Clamp: vi.fn().mockReturnValue(0)
            },
            Input: {
                Keyboard: {
                    JustDown: vi.fn().mockReturnValue(false),
                    KeyCodes: {}
                }
            },
            Physics: {
                Matter: {
                    Image: class {
                        setOrigin = vi.fn().mockReturnThis();
                        setDepth = vi.fn().mockReturnThis();
                        setScale = vi.fn().mockReturnThis();
                        setVisible = vi.fn().mockReturnThis();
                        setAngle = vi.fn().mockReturnThis();
                        setPosition = vi.fn().mockReturnThis();
                    }
                }
            }
        }
    };
});

describe('GalaxyScene', () => {
    let scene: GalaxyScene;
    let mockStorylineManager: any;
    let mockGameStatus: any;
    let mockGalaxy: any;
    let mockLocaleManager: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup LocaleManager mock
        mockLocaleManager = {
            detectLocale: vi.fn().mockReturnValue('en'),
            getLocale: vi.fn().mockReturnValue('en')
        };
        (LocaleManager.getInstance as any).mockReturnValue(mockLocaleManager);

        // Setup Singleton Mocks
        mockStorylineManager = {
            initialized: true,
            init: vi.fn(),
            getIntroText: vi.fn()
        };
        (StorylineManager.getInstance as any).mockReturnValue(mockStorylineManager);

        mockGameStatus = {
            hasSeenIntro: vi.fn(),
            markIntroSeen: vi.fn(),
            getVictories: vi.fn().mockReturnValue(0),
            getLoot: vi.fn().mockReturnValue({ scrap: 0, modules: [] })
        };
        (GameStatus.getInstance as any).mockReturnValue(mockGameStatus);

        // Setup Galaxy Mock
        mockGalaxy = {
            id: 'test-galaxy',
            init: vi.fn(),
            getAll: vi.fn().mockReturnValue([{ id: 'planet-1', x: 100, y: 100, centralPlanet: true }]),
            getById: vi.fn().mockReturnValue({ id: 'planet-1', x: 100, y: 100 }),
            backgroundTexture: 'bg-texture',
            updatePositions: vi.fn()
        };
        (GalaxyFactory.create as any).mockReturnValue(mockGalaxy);

        scene = new GalaxyScene();
        // @ts-ignore
        scene.add = {
            image: vi.fn().mockImplementation(() => ({
                setOrigin: vi.fn().mockReturnThis(),
                setDepth: vi.fn().mockReturnThis(),
                setScale: vi.fn().mockReturnThis(),
                setVisible: vi.fn().mockReturnThis(),
                setAngle: vi.fn().mockReturnThis(),
                setPosition: vi.fn().mockReturnThis(),
                setAlpha: vi.fn().mockReturnThis(),
                x: 0,
                y: 0
            })),
            rectangle: vi.fn().mockImplementation(() => ({
                setOrigin: vi.fn().mockReturnThis(),
                setDepth: vi.fn().mockReturnThis(),
                setInteractive: vi.fn().mockReturnThis(),
                setAlpha: vi.fn().mockReturnThis()
            })),
            text: vi.fn().mockImplementation(() => ({
                setOrigin: vi.fn().mockReturnThis(),
                setScrollFactor: vi.fn().mockReturnThis(),
                setDepth: vi.fn().mockReturnThis(),
                setVisible: vi.fn().mockReturnThis(),
                setAlpha: vi.fn().mockReturnThis(),
                destroy: vi.fn()
            })),
            container: vi.fn().mockImplementation(() => ({
                add: vi.fn(),
                setDepth: vi.fn().mockReturnThis(),
                setScrollFactor: vi.fn().mockReturnThis(),
                setVisible: vi.fn().mockReturnThis()
            })),
            existing: vi.fn()
        } as any;
        // @ts-ignore
        scene.input = { keyboard: { createCursorKeys: vi.fn().mockReturnValue({}) } } as any;
        // @ts-ignore
        scene.time = { delayedCall: vi.fn() } as any;
        // @ts-ignore
        scene.registry = { get: vi.fn(), set: vi.fn() } as any;

        // Initialize scene cache mocks
        // Mock instances
        // Initialize scene cache mocks
        // Mock instances
        const mockVisuals = new PlanetVisuals(scene);
        const mockInteractions = new GalaxyInteractionManager(scene);
        const mockShipController = new PlayerShipController(scene);
        const mockLootUI = new LootUI(scene);
        const mockStarfield = new WarpStarfield(scene);
        const mockIntroOverlay = new PlanetIntroOverlay(scene);
        const mockNavigator = new PlanetNavigator(mockShipController, mockInteractions, mockIntroOverlay, mockLootUI);

        (container.get as any).mockImplementation((type: any) => {
            if (type === PlanetVisuals) return mockVisuals;
            if (type === GalaxyInteractionManager) return mockInteractions;
            if (type === PlayerShipController) return mockShipController;
            if (type === LootUI) return mockLootUI;
            if (type === WarpStarfield) return mockStarfield;
            if (type === PlanetNavigator) return mockNavigator;
            return null;
        });
    });

    it('is defined', () => {
        expect(GalaxyScene).toBeDefined();
    });

    describe('create', () => {
        it('initializes locale via LocaleManager', () => {
            scene.create();
            expect(mockLocaleManager.detectLocale).toHaveBeenCalled();
        });

        it('creates the galaxy from factory', () => {
            scene.create();
            expect(GalaxyFactory.create).toHaveBeenCalledWith('blood-hunters-galaxy');
        });

        it('creates player ship controller', () => {
            scene.create();
            expect((scene as any).shipController).toBeDefined();
        });

        it('creates planet navigator', () => {
            scene.create();
            expect((scene as any).navigator).toBeDefined();
        });
    });

    describe('init', () => {
        it('stores planet ID in registry', () => {
            scene.init({ planetId: 'test-planet' });
            expect((scene as any).registry.set).toHaveBeenCalledWith('initialPlanetId', 'test-planet');
        });

        it('stores galaxy ID in registry', () => {
            scene.init({ galaxyId: 'custom-galaxy' });
            expect((scene as any).registry.set).toHaveBeenCalledWith('targetGalaxyId', 'custom-galaxy');
        });

        it('sets autoStartLevel from data', () => {
            scene.init({ planetId: 'test-planet', autoStart: false });
            expect((scene as any).autoStartLevel).toBe(false);
        });

        it('handles autoLaunchPlanetId correctly', () => {
            scene.init({ autoLaunchPlanetId: 'launch-planet' });
            expect((scene as any).registry.set).toHaveBeenCalledWith('initialPlanetId', 'launch-planet');
            expect((scene as any).autoStartLevel).toBe(true);
        });
    });
});
