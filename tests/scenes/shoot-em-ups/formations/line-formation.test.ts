import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LineFormation } from '../../../../src/scenes/shoot-em-ups/formations/line-formation';
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
                    x: 0,
                    destroy: vi.fn()
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

describe('LineFormation', () => {
    let lineFormation: LineFormation;
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
                now: 1000
            }
        };

        mockShipClass = Ship;
        mockCollisionConfig = {};

        lineFormation = new LineFormation(mockScene, mockShipClass, mockCollisionConfig, {
            enemyCount: { min: 3, max: 3 }, // Force 3 enemies
            spacing: 100,
            shootingChance: 0
        });
    });

    it('should spawn enemies in a line', () => {
        lineFormation.spawn();
        const enemies = lineFormation.getShips();
        expect(enemies).toHaveLength(3);

        // Verify positions roughly
        // StartX is usually width/2. Spacing 100.
        // i=0: x = 400 + (0 - 1) * 100 = 300
        // i=1: x = 400 + (1 - 1) * 100 = 400
        // i=2: x = 400 + (2 - 1) * 100 = 500

        expect(enemies[0].startX).toBe(300);
        expect(enemies[1].startX).toBe(400);
        expect(enemies[2].startX).toBe(500);
    });

    it('should cleanup on destroy', () => {
        lineFormation.spawn();
        const enemies = lineFormation.getShips();
        const firstEnemyShip = enemies[0].ship;

        lineFormation.destroy();

        expect(firstEnemyShip.destroy).toHaveBeenCalled();
        expect(lineFormation.getShips()).toHaveLength(0);
    });
});
