import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SinusWave } from '../../src/waves/sinus/index';
import { Ship } from '../../src/ships/ship';

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
vi.mock('../../src/ships/ship', () => {
    return {
        Ship: class {
            sprite: any;
            config: any;
            constructor() {
                this.sprite = {
                    setData: vi.fn(),
                    setVelocityY: vi.fn(),
                    setPosition: vi.fn(),
                    setRotation: vi.fn(),
                    active: true,
                    y: 0,
                    x: 0
                };
                this.config = {
                    gameplay: {
                        speed: 2
                    }
                };
            }
            destroy = vi.fn();
            fireLasers = vi.fn();
        }
    };
});

describe('SinusWave', () => {
    let sinusWave: SinusWave;
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

        sinusWave = new SinusWave(mockScene, mockShipClass, mockCollisionConfig, {
            enemyCount: { min: 3, max: 3 }, // Force 3 enemies
            shootingChance: 0 // Disable shooting for basic movement tests
        });
    });

    it('should spawn enemies correctly', () => {
        sinusWave.spawn();
        const enemies = sinusWave.getEnemies();
        expect(enemies).toHaveLength(3);
    });

    it('should update enemy positions', () => {
        sinusWave.spawn();
        const enemies = sinusWave.getEnemies();

        // Mock time update
        sinusWave.update(1000);

        // Check if setPosition was called
        expect(enemies[0].ship.sprite.setPosition).toHaveBeenCalled();
        expect(enemies[0].ship.sprite.setRotation).toHaveBeenCalled();
    });

    it('should remove enemies when they go out of bounds', () => {
        sinusWave.spawn();
        const enemies = sinusWave.getEnemies();
        const firstEnemy = enemies[0];

        // Move enemy out of bounds
        firstEnemy.ship.sprite.y = 700; // > 600 + 50

        sinusWave.update(1000);

        expect(firstEnemy.ship.destroy).toHaveBeenCalled();
        expect(sinusWave.getEnemies()).toHaveLength(2);
    });

    it('should be complete when all enemies are gone', () => {
        sinusWave.spawn();
        const enemies = sinusWave.getEnemies();

        // Destroy all enemies
        enemies.forEach(e => {
            e.ship.sprite.y = 700;
        });

        sinusWave.update(1000);

        expect(sinusWave.isComplete()).toBe(true);
    });

    it('should cleanup on destroy', () => {
        sinusWave.spawn();
        const enemies = sinusWave.getEnemies();
        const firstEnemyShip = enemies[0].ship;

        sinusWave.destroy();

        expect(firstEnemyShip.destroy).toHaveBeenCalled();
        expect(sinusWave.getEnemies()).toHaveLength(0);
    });
});
