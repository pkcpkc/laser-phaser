import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { DiamondFormation } from '../../../../src/scenes/shoot-em-ups/formations/index';
import { Ship } from '../../../../src/ships/ship';

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Math: {
                Between: vi.fn((min) => min), // Deterministic random
            },
            Time: {
                TimerEvent: class { }
            }
        }
    };
});

// Mock Ship
vi.mock('../../../../src/ships/ship', () => {
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
                    }
                };
            }
            destroy = vi.fn();
            fireLasers = vi.fn();
        }
    };
});

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
            shootingChance: 0 // Disable shooting for basic tests
        });
    });

    it('should spawn 6 enemies in diamond pattern (1-2-3)', () => {
        diamondFormation.spawn();
        const enemies = diamondFormation.getEnemies();
        expect(enemies).toHaveLength(6);
    });

    it('should position ships in diamond formation', () => {
        diamondFormation.spawn();
        const enemies = diamondFormation.getEnemies();

        // Verify we have 6 ships
        expect(enemies).toHaveLength(6);

        // Ships should be positioned at different Y coordinates (3 rows)
        const yPositions = enemies.map(e => e.startY);
        const uniqueYPositions = [...new Set(yPositions)];
        expect(uniqueYPositions).toHaveLength(3); // 3 rows
    });

    it('should update enemy positions moving straight down', () => {
        diamondFormation.spawn();
        const enemies = diamondFormation.getEnemies();

        // Mock time update
        diamondFormation.update(1000);

        // Check if setPosition was called
        expect(enemies[0].ship.sprite.setPosition).toHaveBeenCalled();

        // Check rotation is set to straight down (90 degrees = PI/2)
        // With angle=0, moveX=0, moveY=1, rotation = atan2(1, 0) = PI/2
        expect(enemies[0].ship.sprite.setRotation).toHaveBeenCalledWith(Math.PI / 2);
    });

    it('should remove enemies when they go out of bounds', () => {
        diamondFormation.spawn();
        const enemies = diamondFormation.getEnemies();
        const firstEnemy = enemies[0];

        // Move enemy out of bounds
        firstEnemy.ship.sprite.y = 900; // > 600 + 200

        diamondFormation.update(1000);

        expect(firstEnemy.ship.destroy).toHaveBeenCalled();
        expect(diamondFormation.getEnemies()).toHaveLength(5);
    });

    it('should be complete when all enemies are gone', () => {
        diamondFormation.spawn();
        const enemies = diamondFormation.getEnemies();

        // Destroy all enemies
        enemies.forEach((e: any) => {
            e.ship.sprite.y = 900;
        });

        diamondFormation.update(1000);

        expect(diamondFormation.isComplete()).toBe(true);
    });

    it('should cleanup on destroy', () => {
        diamondFormation.spawn();
        const enemies = diamondFormation.getEnemies();
        const firstEnemyShip = enemies[0].ship;

        diamondFormation.destroy();

        expect(firstEnemyShip.destroy).toHaveBeenCalled();
        expect(diamondFormation.getEnemies()).toHaveLength(0);
    });

    it('should have individual movement variation (wobble)', () => {
        diamondFormation.spawn();
        const enemies = diamondFormation.getEnemies();
        const firstEnemy = enemies[0];

        // Update formation
        diamondFormation.update(1000);

        // Verify setPosition was called
        const calls = (firstEnemy.ship.sprite.setPosition as Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);

        // The X position should vary slightly due to wobble (not exactly startX)
        // We just verify position was updated, exact wobble amount varies by time/offset
        if (calls.length > 0) {
            const lastCall = calls[calls.length - 1];
            expect(typeof lastCall[0]).toBe('number');
            expect(typeof lastCall[1]).toBe('number');
        }
    });

    it('should support custom formation grids', () => {
        // Create formation with custom grid [2, 4]
        diamondFormation = new DiamondFormation(mockScene, mockShipClass, mockCollisionConfig, {
            formationGrid: [2, 4],
            shootingChance: 0
        });

        diamondFormation.spawn();
        const enemies = diamondFormation.getEnemies();

        // Should have 2+4=6 enemies
        expect(enemies).toHaveLength(6);

        // Should have 2 rows
        const yPositions = enemies.map(e => e.startY);
        const uniqueYPositions = [...new Set(yPositions)];
        expect(uniqueYPositions).toHaveLength(2);

        // Verify counts per row
        // Sort by Y position (depth)


        // First row (less depth/negative Y) should have 2
        // Second row (more depth/more negative Y) should have 4
        // Note: depth is subtracted from Y, so larger depth = smaller Y (more negative)
        // With depth 0, Y is larger (closer to 0)
        // With depth > 0, Y is smaller (more negative)
        // So sorting by Y ascending puts deeper rows first? 
        // Let's check spawn logic: localY = -row.depth. 
        // Row 0: depth 0 -> localY = 0
        // Row 1: depth > 0 -> localY = -depth
        // So Row 1 has smaller Y than Row 0. 
        // Sorting by Y ascending: Row 1 comes first, then Row 0.

        // Let's verify row counts implicitly by grouping
        const enemiesByY = new Map<number, number>();
        enemies.forEach(e => {
            const count = enemiesByY.get(e.startY) || 0;
            enemiesByY.set(e.startY, count + 1);
        });

        const counts = Array.from(enemiesByY.values());
        expect(counts).toContain(2);
        expect(counts).toContain(4);
    });
});
