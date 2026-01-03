import { describe, it, expect, vi, beforeEach } from 'vitest';
import GalaxyScene from '../../../../src/scenes/galaxies/galaxy-scene';
import { StorylineManager } from '../../../../src/logic/storyline-manager';
import { GameStatus } from '../../../../src/logic/game-status';
import { GalaxyFactory } from '../../../../src/scenes/galaxies/galaxy-factory';

// Mock dependencies
vi.mock('../../../../src/logic/storyline-manager');
vi.mock('../../../../src/logic/game-status');
vi.mock('../../../../src/scenes/galaxies/galaxy-factory');
vi.mock('../../../../src/scenes/galaxies/galaxy-interaction', () => {
    return {
        GalaxyInteractionManager: class {
            constructor() {
                // Ensure methods are spies
                this.setGalaxyId = vi.fn();
                this.setStorylineCallback = vi.fn();
                this.showInteractionUI = vi.fn();
                this.hide = vi.fn();
            }
            setGalaxyId: any;
            setStorylineCallback: any;
            showInteractionUI: any;
            hide: any;
        }
    };
});
vi.mock('../../../../src/scenes/galaxies/planets/planet-intro-overlay');
vi.mock('../../../../src/scenes/galaxies/planets/planet-visuals');
vi.mock('../../../../src/backgrounds/warp-starfield');
vi.mock('../../../../src/ui/loot-ui');



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
                },
                Sprite: class {
                    play = vi.fn();
                    setOrigin = vi.fn();
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
                Clamp: vi.fn(),
                Angle: {
                    Between: vi.fn()
                }
            },
            Input: {
                Keyboard: {
                    JustDown: vi.fn(),
                    KeyCodes: {}
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
    let mockInteractions: any;

    beforeEach(() => {
        vi.clearAllMocks();

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
            getAll: vi.fn().mockReturnValue([]),
            getById: vi.fn(),
            backgroundTexture: 'bg-texture'
        };
        (GalaxyFactory.create as any).mockReturnValue(mockGalaxy);

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
        scene.registry = { get: vi.fn(), set: vi.fn() } as any; // default galaxy

        // Initialize scene cache mocks
        (scene as any).cache = {
            json: {
                exists: vi.fn().mockReturnValue(true),
                get: vi.fn().mockReturnValue({})
            }
        };

        // Determine the mock object we want the constructor to return
        // Since we provided a class factory, new GalaxyInteractionManager() returns an instance with spies.
        // We will access access them via (scene as any).interactions after create().
    });

    it('is defined', () => {
        expect(GalaxyScene).toBeDefined();
    });

    describe('Intro Delay Logic', () => {
        it('should delay intro if intro is required and not seen', async () => {
            const planetId = 'planet-1';
            const planetData = { id: planetId, x: 100, y: 100 };
            mockGalaxy.getById.mockReturnValue(planetData);
            mockGalaxy.getAll.mockReturnValue([planetData]);

            // Storyline available and NOT seen
            mockStorylineManager.getIntroText.mockReturnValue('Intro Text');
            mockGameStatus.hasSeenIntro.mockReturnValue(false);

            // Execute create (which calls moveToPlanet -> delayed path)
            scene.create();

            // Capture the interactions instance created by the scene
            mockInteractions = (scene as any).interactions;

            // Verify controls are disabled during delay
            expect((scene as any).controlsEnabled).toBe(false);
            expect((scene as any).introPending).toBe(true);

            // Verify interactions hidden
            expect(mockInteractions.hide).toHaveBeenCalled();
        });

        it('should NOT delay if intro is already seen', async () => {
            const planetId = 'planet-1';
            const planetData = { id: planetId, x: 100, y: 100 };
            mockGalaxy.getById.mockReturnValue(planetData);
            mockGalaxy.getAll.mockReturnValue([planetData]);

            // Storyline available BUT seen
            mockStorylineManager.getIntroText.mockReturnValue('Intro Text');
            mockGameStatus.hasSeenIntro.mockReturnValue(true);

            scene.create();
            mockInteractions = (scene as any).interactions;

            // Should NOT call delayedCall for intro
            expect(scene.time.delayedCall).not.toHaveBeenCalled();
            // Should verify that interactions are shown immediately
            expect(mockInteractions.showInteractionUI).toHaveBeenCalledWith(planetData);
        });

        it('should use correct locale when fetching intro text', async () => {
            vi.useFakeTimers();
            const planetId = 'planet-1';
            const planetData = { id: planetId, x: 100, y: 100 };
            mockGalaxy.getById.mockReturnValue(planetData);
            mockGalaxy.getAll.mockReturnValue([planetData]);

            // Setup locale in URL params mock
            Object.defineProperty(window, 'location', {
                value: {
                    search: '?locale=de'
                },
                writable: true
            });

            // Storyline available and NOT seen
            mockStorylineManager.getIntroText.mockReturnValue('Intro Text DE');
            mockGameStatus.hasSeenIntro.mockReturnValue(false);

            // Mock introOverlay on the scene instance that will be created
            // We need to intercept the assignment or mock the class used.
            // Since `scene.introOverlay` is assigned in create(), we can't set it on `scene` before create easily 
            // without mocking the constructor or the class.
            // Actually, we are mocking the class `PlanetIntroOverlay`. 
            // Let's verify if the mocked class instance has the methods.

            // The file mocks `PlanetIntroOverlay` at line 28:
            // vi.mock('../../../../src/scenes/galaxies/planets/planet-intro-overlay');
            // By default this returns an auto-mocked class.

            // However, the previous error `TypeError: this.introOverlay.setVisible is not a function` suggests the auto-mock didn't include setVisible.
            // Let's explicitly mock the implementation of the class for this test.
            // Properly mock the constructor
            const { PlanetIntroOverlay } = await import('../../../../src/scenes/galaxies/planets/planet-intro-overlay');
            // @ts-ignore
            (PlanetIntroOverlay as any).mockImplementation(class {
                show = vi.fn().mockImplementation((_planet, _text, cb) => cb && cb());
                setVisible = vi.fn();
                setAlpha = vi.fn();
                visible = false;
            });

            scene.create();

            // First check: moveToPlanet calls getIntroText to decide if delay is needed.
            // This passed in the previous test run.
            expect(mockStorylineManager.getIntroText).toHaveBeenNthCalledWith(
                1,
                expect.any(String),
                planetId,
                'de'
            );

            // Advance timers to trigger the delayed checkAndShowIntro
            vi.advanceTimersByTime(2000);

            // Second check: checkAndShowIntro calls getIntroText effectively to show it.
            // THIS SHOULD FAIL if the code doesn't pass the locale.
            expect(mockStorylineManager.getIntroText).toHaveBeenNthCalledWith(
                2,
                expect.any(String),
                planetId,
                'de' // Expect 'de' here too
            );

            vi.useRealTimers();
        });

        it('should disable controls during delay', () => {
            // @ts-ignore
            scene.controlsEnabled = false;
            // @ts-ignore
            scene.introOverlay = {
                visible: false,
                setVisible: vi.fn(),
                setAlpha: vi.fn(),
                show: vi.fn() // Ensure show is present too
            };
            // @ts-ignore
            scene.cursorKeys = { up: { isDown: true } }; // Simulate input

            // Spy on navigate/movement
            const travelSpy = vi.spyOn(scene as any, 'travelToPlanet');

            // @ts-ignore
            scene.handleInput();

            expect(travelSpy).not.toHaveBeenCalled();
        });
    });
});
