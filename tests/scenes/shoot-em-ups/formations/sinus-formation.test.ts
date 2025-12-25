import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SinusFormation } from '../../../../src/scenes/shoot-em-ups/formations/index';
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

describe('SinusFormation', () => {
    let sinusFormation: SinusFormation;
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
                delayedCall: vi.fn().mockReturnValue({ remove: vi.fn() })
            }
        };

        mockShipClass = Ship;
        mockCollisionConfig = {};

        sinusFormation = new SinusFormation(mockScene, mockShipClass, mockCollisionConfig, {
            enemyCount: { min: 3, max: 3 }, // Force 3 enemies
            shootingChance: 0 // Disable shooting for basic movement tests
        });
    });

    it('should spawn enemies correctly', () => {
        sinusFormation.spawn();
        const enemies = sinusFormation.getEnemies();
        expect(enemies).toHaveLength(3);
    });

    it('should update enemy positions', () => {
        sinusFormation.spawn();
        const enemies = sinusFormation.getEnemies();

        // Mock time update
        sinusFormation.update(1000);

        // Check if setPosition was called
        expect(enemies[0].ship.sprite.setPosition).toHaveBeenCalled();
        expect(enemies[0].ship.sprite.setRotation).toHaveBeenCalled();
    });

    it('should remove enemies when they go out of bounds', () => {
        sinusFormation.spawn();
        const enemies = sinusFormation.getEnemies();
        const firstEnemy = enemies[0];

        // Move enemy out of bounds
        firstEnemy.ship.sprite.y = 700; // > 600 + 50

        sinusFormation.update(1000);

        expect(firstEnemy.ship.destroy).toHaveBeenCalled();
        expect(sinusFormation.getEnemies()).toHaveLength(2);
    });

    it('should be complete when all enemies are gone', () => {
        sinusFormation.spawn();
        const enemies = sinusFormation.getEnemies();

        // Destroy all enemies
        enemies.forEach((e: any) => {
            e.ship.sprite.y = 700;
        });

        sinusFormation.update(1000);

        expect(sinusFormation.isComplete()).toBe(true);
    });

    it('should cleanup on destroy', () => {
        sinusFormation.spawn();
        const enemies = sinusFormation.getEnemies();
        const firstEnemyShip = enemies[0].ship;

        sinusFormation.destroy();

        expect(firstEnemyShip.destroy).toHaveBeenCalled();
        expect(sinusFormation.getEnemies()).toHaveLength(0);
    });
});
