import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiamondFormation } from '../../../../../src/scenes/shoot-em-ups/formations/diamond-formation';
import { Ship } from '../../../../../src/ships/ship';
import type { ShipConfig } from '../../../../../src/ships/types';

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Math: {
                Between: vi.fn((min) => min),
            },
            Time: {
                TimerEvent: class { }
            }
        }
    };
});

// Mock Ship
vi.mock('../../../../../src/ships/ship', () => {
    return {
        Ship: class {
            sprite: any;
            config: any;
            constructor() {
                this.sprite = {
                    setData: vi.fn(),
                    setVelocityY: vi.fn(),
                    setVelocity: vi.fn(),
                    setPosition: vi.fn(),
                    setRotation: vi.fn(),
                    active: true,
                    y: 0,
                    x: 0
                };
                this.config = {
                    definition: {
                        gameplay: {
                            speed: 2
                        }
                    },
                    modules: []
                };
            }
            destroy = vi.fn();
            fireLasers = vi.fn();
        }
    };
});

const mockShipConfig: ShipConfig = {
    definition: {
        id: 'mock-ship',
        gameplay: { speed: 2 },
        hitbox: { radius: 10 }
    } as any,
    modules: []
};

describe('DiamondFormation', () => {
    let diamondFormation: DiamondFormation;
    let mockScene: any;
    let mockShipClass: any;
    let mockCollisionConfig: any;

    beforeEach(() => {
        mockScene = {
            scale: {
                width: 800,
                height: 600
            },
            time: {
                delayedCall: vi.fn().mockReturnValue({ remove: vi.fn() }),
                now: 0
            }
        };

        mockShipClass = Ship;
        mockCollisionConfig = {};

        diamondFormation = new DiamondFormation(mockScene, mockShipClass, mockCollisionConfig, {
            shipFormationGrid: [
                [mockShipConfig],
                [mockShipConfig, mockShipConfig],
                [mockShipConfig, mockShipConfig, mockShipConfig]
            ],
            startWidthPercentage: 0.5,
            endWidthPercentage: 0.5,
        });
    });

    it('should spawn 6 enemies in diamond pattern (1-2-3)', () => {
        diamondFormation.spawn();
        const enemies = diamondFormation.getShips();
        expect(enemies).toHaveLength(6);
    });

    it('should position ships in diamond formation', () => {
        diamondFormation.spawn();
        const enemies = diamondFormation.getShips();

        expect(enemies).toHaveLength(6);

        const yPositions = enemies.map(e => e.startY);
        const uniqueYPositions = [...new Set(yPositions)];
        expect(uniqueYPositions).toHaveLength(3);
    });

    it('should remove enemies when they go out of bounds', () => {
        diamondFormation.spawn();
        const enemies = diamondFormation.getShips();
        const firstEnemy = enemies[0];

        firstEnemy.ship.sprite.y = 900;

        diamondFormation.update(1000);

        expect(firstEnemy.ship.destroy).toHaveBeenCalled();
        expect(diamondFormation.getShips()).toHaveLength(5);
    });

    it('should be complete when all enemies are gone', () => {
        diamondFormation.spawn();
        const enemies = diamondFormation.getShips();

        enemies.forEach((e: any) => {
            e.ship.sprite.y = 900;
        });

        diamondFormation.update(1000);

        expect(diamondFormation.isComplete()).toBe(true);
    });

    it('should cleanup on destroy', () => {
        diamondFormation.spawn();
        const enemies = diamondFormation.getShips();
        const firstEnemyShip = enemies[0].ship;

        diamondFormation.destroy();

        expect(firstEnemyShip.destroy).toHaveBeenCalled();
        expect(diamondFormation.getShips()).toHaveLength(0);
    });

    it('should support custom formation grids', () => {
        diamondFormation = new DiamondFormation(mockScene, mockShipClass, mockCollisionConfig, {
            shipFormationGrid: [
                [mockShipConfig, mockShipConfig],
                [mockShipConfig, mockShipConfig, mockShipConfig, mockShipConfig]
            ],
            startWidthPercentage: 0.5,
            endWidthPercentage: 0.5,
        });

        diamondFormation.spawn();
        const enemies = diamondFormation.getShips();

        expect(enemies).toHaveLength(6);

        const yPositions = enemies.map((e: any) => e.startY);
        const uniqueYPositions = [...new Set(yPositions)];
        expect(uniqueYPositions).toHaveLength(2);

        const enemiesByY = new Map<number, number>();
        enemies.forEach((e: any) => {
            const y = e.startY ?? 0;
            const count = enemiesByY.get(y) || 0;
            enemiesByY.set(y, count + 1);
        });

        const counts = Array.from(enemiesByY.values());
        expect(counts).toContain(2);
        expect(counts).toContain(4);
    });

    it('should skip null positions in the grid', () => {
        diamondFormation = new DiamondFormation(mockScene, mockShipClass, mockCollisionConfig, {
            shipFormationGrid: [
                [null, mockShipConfig, null],
                [mockShipConfig, null, mockShipConfig]
            ],
            startWidthPercentage: 0.5,
            endWidthPercentage: 0.5,
        });

        diamondFormation.spawn();
        const enemies = diamondFormation.getShips();

        // Only 3 non-null positions
        expect(enemies).toHaveLength(3);
    });

    it('should fire lasers continuously in update when autoFire is true', () => {
        const formation = new DiamondFormation(mockScene, mockShipClass, mockCollisionConfig, {
            shipFormationGrid: [[mockShipConfig]],
            autoFire: true,
            startWidthPercentage: 0.5,
            endWidthPercentage: 0.5,
        });

        formation.spawn();
        const enemies = formation.getShips();
        const ship = enemies[0].ship;

        // Clear mock calls from spawn
        (ship.fireLasers as any).mockClear();

        // Update
        formation.update(16);

        // Expect fireLasers to be called
        expect(ship.fireLasers).toHaveBeenCalled();
    });

    it('should NOT fire lasers in update when autoFire is false', () => {
        const formation = new DiamondFormation(mockScene, mockShipClass, mockCollisionConfig, {
            shipFormationGrid: [[mockShipConfig]],
            autoFire: false,
            startWidthPercentage: 0.5,
            endWidthPercentage: 0.5,
        });

        formation.spawn();
        const enemies = formation.getShips();
        const ship = enemies[0].ship;

        (ship.fireLasers as any).mockClear();

        // Update
        formation.update(16);

        // Expect fireLasers NOT to be called
        expect(ship.fireLasers).not.toHaveBeenCalled();
    });
});
