import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameStatus } from '../../src/logic/game-status';
import { LootType } from '../../src/ships/types';

// Mock Phaser by default as many files depend on it
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            GameObjects: {
                Image: class {
                    setOrigin = vi.fn();
                    setDepth = vi.fn();
                    setScale = vi.fn();
                    setVisible = vi.fn();
                },
                Container: class {
                    add = vi.fn();
                    setDepth = vi.fn();
                    setPosition = vi.fn();
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
                    normalize() { return this; }
                    scale() { return this; }
                },
                Between: vi.fn(),
                FloatBetween: vi.fn(),
                RadToDeg: vi.fn(),
                DegToRad: vi.fn(),
                Angle: {
                    Between: vi.fn()
                }
            }
        }
    };
});

describe('GameStatus', () => {
    let gameStatus: GameStatus;

    beforeEach(() => {
        // Reset the singleton by accessing the private instance
        // We need to reset to get a clean state for each test
        (GameStatus as any).instance = undefined;
        gameStatus = GameStatus.getInstance();
        gameStatus.reset(); // Ensure clean state
    });

    describe('Singleton Pattern', () => {
        it('should return the same instance', () => {
            const instance1 = GameStatus.getInstance();
            const instance2 = GameStatus.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('Victory Management', () => {
        it('should return 0 victories for a new universe', () => {
            expect(gameStatus.getVictories('test-universe')).toBe(0);
        });

        it('should increment victories when addVictory is called', () => {
            gameStatus.addVictory('test-universe');
            expect(gameStatus.getVictories('test-universe')).toBe(1);
        });

        it('should increment victories multiple times', () => {
            gameStatus.addVictory('test-universe');
            gameStatus.addVictory('test-universe');
            gameStatus.addVictory('test-universe');
            expect(gameStatus.getVictories('test-universe')).toBe(3);
        });

        it('should track victories separately per universe', () => {
            gameStatus.addVictory('universe-a');
            gameStatus.addVictory('universe-a');
            gameStatus.addVictory('universe-b');

            expect(gameStatus.getVictories('universe-a')).toBe(2);
            expect(gameStatus.getVictories('universe-b')).toBe(1);
            expect(gameStatus.getVictories('universe-c')).toBe(0);
        });

        it('should reset victories when reset is called', () => {
            gameStatus.addVictory('test-universe');
            gameStatus.addVictory('test-universe');
            expect(gameStatus.getVictories('test-universe')).toBe(2);

            gameStatus.reset();
            expect(gameStatus.getVictories('test-universe')).toBe(0);
        });
    });

    describe('Loot Management', () => {
        it('should initialize with zero loot', () => {
            const loot = gameStatus.getLoot();
            expect(loot[LootType.GOLD]).toBe(0);
            expect(loot[LootType.GEM]).toBe(0);
            expect(loot[LootType.MODULE]).toBe(0);
            expect(loot[LootType.SILVER]).toBe(0);
        });

        it('should update loot correctly', () => {
            gameStatus.updateLoot(LootType.GOLD, 100);
            expect(gameStatus.getLoot()[LootType.GOLD]).toBe(100);
        });

        it('should accumulate loot', () => {
            gameStatus.updateLoot(LootType.GOLD, 50);
            gameStatus.updateLoot(LootType.GOLD, 25);
            expect(gameStatus.getLoot()[LootType.GOLD]).toBe(75);
        });
    });

    describe('Planet Management', () => {
        it('should return false for unrevealed planets', () => {
            expect(gameStatus.isPlanetRevealed('planet-x')).toBe(false);
        });

        it('should return true after revealing a planet', () => {
            gameStatus.revealPlanet('planet-x');
            expect(gameStatus.isPlanetRevealed('planet-x')).toBe(true);
        });

        it('should track multiple revealed planets', () => {
            gameStatus.revealPlanet('planet-a');
            gameStatus.revealPlanet('planet-b');

            expect(gameStatus.isPlanetRevealed('planet-a')).toBe(true);
            expect(gameStatus.isPlanetRevealed('planet-b')).toBe(true);
            expect(gameStatus.isPlanetRevealed('planet-c')).toBe(false);
        });
    });

    describe('Planet Position Management', () => {
        it('should return undefined for unknown planet positions', () => {
            expect(gameStatus.getPlanetPosition('universe-x', 'planet-y')).toBeUndefined();
        });

        it('should store and retrieve planet positions', () => {
            const position = { orbitAngle: 45, orbitRadius: 100 };
            gameStatus.setPlanetPosition('universe-a', 'planet-b', position);

            expect(gameStatus.getPlanetPosition('universe-a', 'planet-b')).toEqual(position);
        });

        it('should store positions with compound key (universeId:planetId)', () => {
            const posA = { orbitAngle: 30, orbitRadius: 50 };
            const posB = { orbitAngle: 60, orbitRadius: 150 };

            gameStatus.setPlanetPosition('universe-1', 'planet-x', posA);
            gameStatus.setPlanetPosition('universe-2', 'planet-x', posB);

            expect(gameStatus.getPlanetPosition('universe-1', 'planet-x')).toEqual(posA);
            expect(gameStatus.getPlanetPosition('universe-2', 'planet-x')).toEqual(posB);
        });
    });
});
