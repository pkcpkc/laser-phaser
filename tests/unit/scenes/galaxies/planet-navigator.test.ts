import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanetNavigator } from '../../../../src/scenes/galaxies/planet-navigator';
import { GameStatus } from '../../../../src/logic/game-status';
import { StorylineManager } from '../../../../src/logic/storyline-manager';
import { type PlanetData } from '../../../../src/scenes/galaxies/planets/planet-data';

// Mock dependencies to isolate PlanetNavigator and avoid loading Phaser
vi.mock('../../../../src/logic/game-status');
vi.mock('../../../../src/logic/storyline-manager');
vi.mock('../../../../src/scenes/galaxies/player-ship-controller');
vi.mock('../../../../src/scenes/galaxies/galaxy-interaction');
vi.mock('../../../../src/scenes/galaxies/planets/planet-intro-overlay');
vi.mock('../../../../src/ui/loot-ui');
vi.mock('../../../../src/scenes/galaxies/galaxy');

// Mock Phaser (keep it minimal but include base classes for inheritance)
vi.mock('phaser', () => {
    class MockGameObject {
        setOrigin() { return this; }
        setDepth() { return this; }
        setScale() { return this; }
        setVisible() { return this; }
        setAngle() { return this; }
        setPosition() { return this; }
        destroy() { }
    }
    return {
        default: {
            Scene: class { },
            GameObjects: {
                GameObject: MockGameObject,
                Image: class extends MockGameObject { },
                Container: class extends MockGameObject {
                    add() { }
                },
                Sprite: class extends MockGameObject {
                    play() { }
                }
            },
            Math: {
                Angle: {
                    Between: vi.fn()
                },
                Vector2: class {
                    x = 0; y = 0;
                    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
                    distance() { return 0; }
                    copy() { return this; }
                },
                Clamp: vi.fn()
            }
        }
    };
});

describe('PlanetNavigator', () => {
    let navigator: PlanetNavigator;
    let mockShipController: any;
    let mockInteractions: any;
    let mockIntroOverlay: any;
    let mockLootUI: any;
    let mockGalaxy: any;
    let mockGameStatus: any;
    let mockStorylineManager: any;

    const createPlanet = (overrides: Partial<PlanetData> = {}): PlanetData => ({
        id: 'p1',
        name: 'Test Planet',
        x: 100,
        y: 100,
        ...overrides
    } as PlanetData);

    beforeEach(() => {
        vi.clearAllMocks();

        mockShipController = {
            setPosition: vi.fn(),
            travelTo: vi.fn().mockImplementation((_x, _y, cb) => cb && cb())
        };

        mockInteractions = {
            showInteractionUI: vi.fn(),
            hide: vi.fn()
        };

        mockIntroOverlay = {
            visible: false,
            show: vi.fn().mockImplementation((_p, _t, cb) => cb && cb()),
            setVisible: vi.fn(),
            setAlpha: vi.fn()
        };

        mockLootUI = {
            setVisible: vi.fn()
        };

        mockGalaxy = {
            id: 'test-galaxy',
            getById: vi.fn(),
            findNearestNeighbor: vi.fn()
        };

        mockGameStatus = {
            getVictories: vi.fn().mockReturnValue(0),
            hasSeenIntro: vi.fn().mockReturnValue(false),
            markIntroSeen: vi.fn(),
            revealPlanet: vi.fn()
        };
        (GameStatus.getInstance as any).mockReturnValue(mockGameStatus);

        mockStorylineManager = {
            getIntroText: vi.fn().mockReturnValue(null)
        };
        (StorylineManager.getInstance as any).mockReturnValue(mockStorylineManager);

        navigator = new PlanetNavigator(
            mockShipController,
            mockInteractions,
            mockIntroOverlay,
            mockLootUI
        );
        navigator.config(mockGalaxy, 'en');
    });

    describe('isPlanetLocked', () => {
        it('returns false for planets with no victory requirement', () => {
            const planet = createPlanet();
            expect(navigator.isPlanetLocked(planet)).toBe(false);
        });

        it('returns true when victories are not met', () => {
            const planet = createPlanet({ id: 'p2', requiredVictories: 3 });
            mockGameStatus.getVictories.mockReturnValue(2);

            expect(navigator.isPlanetLocked(planet)).toBe(true);
        });

        it('returns false when victories are met', () => {
            const planet = createPlanet({ id: 'p3', requiredVictories: 3 });
            mockGameStatus.getVictories.mockReturnValue(5);

            expect(navigator.isPlanetLocked(planet)).toBe(false);
        });
    });

    describe('handlePlanetClick', () => {
        it('shows interaction UI when clicking current planet', () => {
            const planet = createPlanet();
            navigator.setCurrentPlanetId('p1');

            navigator.handlePlanetClick(planet);

            expect(mockInteractions.showInteractionUI).toHaveBeenCalledWith(planet);
        });

        it('travels to planet when clicking different planet', () => {
            const planet = createPlanet({ id: 'p2' });
            navigator.setCurrentPlanetId('p1');

            navigator.handlePlanetClick(planet);

            expect(mockInteractions.hide).toHaveBeenCalled();
            expect(mockShipController.travelTo).toHaveBeenCalled();
        });

        it('does nothing for locked planets', () => {
            const planet = createPlanet({ id: 'p2', requiredVictories: 5 });
            mockGameStatus.getVictories.mockReturnValue(1);

            navigator.handlePlanetClick(planet);

            expect(mockInteractions.showInteractionUI).not.toHaveBeenCalled();
            expect(mockShipController.travelTo).not.toHaveBeenCalled();
        });
    });

    describe('travelToPlanet', () => {
        it('hides interactions and starts travel', () => {
            const planet = createPlanet();

            navigator.travelToPlanet(planet);

            expect(mockInteractions.hide).toHaveBeenCalled();
            expect(mockShipController.travelTo).toHaveBeenCalledWith(
                40, // x - 60
                100,
                expect.any(Function)
            );
        });

        it('updates current planet on arrival', () => {
            const planet = createPlanet({ id: 'p2', x: 200, y: 200 });

            navigator.travelToPlanet(planet);

            expect(navigator.getCurrentPlanetId()).toBe('p2');
        });
    });

    describe('checkAndShowIntro', () => {
        it('shows intro when text exists and not seen', () => {
            const planet = createPlanet();
            mockStorylineManager.getIntroText.mockReturnValue('Hello Planet!');
            mockGameStatus.hasSeenIntro.mockReturnValue(false);

            const result = navigator.checkAndShowIntro(planet);

            expect(result).toBe(true);
            expect(mockIntroOverlay.show).toHaveBeenCalled();
            expect(mockLootUI.setVisible).toHaveBeenCalledWith(false);
        });

        it('does not show intro if already seen', () => {
            const planet = createPlanet();
            mockStorylineManager.getIntroText.mockReturnValue('Hello Planet!');
            mockGameStatus.hasSeenIntro.mockReturnValue(true);

            const result = navigator.checkAndShowIntro(planet);

            expect(result).toBe(false);
            expect(mockIntroOverlay.show).not.toHaveBeenCalled();
        });

        it('marks intro as seen after showing', () => {
            const planet = createPlanet();
            mockStorylineManager.getIntroText.mockReturnValue('Hello Planet!');
            mockGameStatus.hasSeenIntro.mockReturnValue(false);

            navigator.checkAndShowIntro(planet);

            expect(mockGameStatus.markIntroSeen).toHaveBeenCalledWith('p1');
        });
    });

    describe('navigate', () => {
        it('travels to nearest neighbor if unlocked', () => {
            const neighbor = createPlanet({ id: 'p2', x: 200 });
            navigator.setCurrentPlanetId('p1');
            mockGalaxy.findNearestNeighbor.mockReturnValue(neighbor);

            navigator.navigate(1, 0);

            expect(mockGalaxy.findNearestNeighbor).toHaveBeenCalledWith('p1', 1, 0);
            expect(mockShipController.travelTo).toHaveBeenCalled();
        });

        it('does not travel if neighbor is locked', () => {
            const neighbor = createPlanet({ id: 'p2', requiredVictories: 10 });
            mockGalaxy.findNearestNeighbor.mockReturnValue(neighbor);
            mockGameStatus.getVictories.mockReturnValue(0);

            navigator.navigate(1, 0);

            expect(mockShipController.travelTo).not.toHaveBeenCalled();
        });
    });

    describe('moveToPlanet', () => {
        let mockScene: any;

        beforeEach(() => {
            mockScene = {
                time: {
                    delayedCall: vi.fn().mockImplementation((_delay, callback) => callback())
                }
            };
            // Re-instantiate with scene
            navigator = new PlanetNavigator(
                mockShipController,
                mockInteractions,
                mockIntroOverlay,
                mockLootUI
            );
            navigator.config(mockGalaxy, 'en');
        });

        it('uses delayedCall for intro delay', () => {
            const planet = createPlanet();
            mockGalaxy.getById.mockReturnValue(planet);
            mockStorylineManager.getIntroText.mockReturnValue('Intro');
            mockGameStatus.hasSeenIntro.mockReturnValue(false);

            // instant=true, delay=1000
            navigator.moveToPlanet('p1', true, 1000);

            expect(mockScene.time.delayedCall).toHaveBeenCalledWith(1000, expect.any(Function));
        });
    });
});
