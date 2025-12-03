
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            Math: {
                Between: (min: number, max: number) => { void max; return min; }
            },
            Physics: {
                Matter: {
                    Image: class { }
                }
            }
        }
    };
});

import { Level, type LevelConfig } from '../../src/levels/level';
import { Ship } from '../../src/ships/ship';

// Mock Ship
class MockShip extends Ship {
    constructor(scene: any, x: number, y: number, collisionConfig: any) {
        super(scene, x, y, {
            id: 'test',
            assetKey: 'test',
            assetPath: 'test',
            markerPath: 'test',
            physics: {},
            gameplay: { health: 1, speed: 1, rotationSpeed: 1 },
            mounts: {},
            explosion: { frame: 'test', speed: { min: 0, max: 0 }, scale: { start: 0, end: 0 }, lifespan: 0, blendMode: 'ADD' }
        } as any, collisionConfig);
    }
}

// Mock Wave
class MockWave {
    static instances: MockWave[] = [];
    spawn = vi.fn();
    update = vi.fn();
    destroy = vi.fn();
    isComplete = vi.fn(() => true);
    constructor(scene: any, shipClass: any, collisionConfig: any, config: any) {
        void scene; void shipClass; void collisionConfig; void config;
        MockWave.instances.push(this);
    }
}

describe('Level', () => {
    let scene: any;
    let level: Level;

    beforeEach(() => {
        MockWave.instances = [];
        scene = {
            time: {
                delayedCall: vi.fn((_delay, callback) => callback())
            },
            matter: {
                add: {
                    image: vi.fn(() => ({
                        setAngle: vi.fn(),
                        setFixedRotation: vi.fn(),
                        setFrictionAir: vi.fn(),
                        setMass: vi.fn(),
                        setSleepThreshold: vi.fn(),
                        setCollisionCategory: vi.fn(),
                        setCollidesWith: vi.fn(),
                        destroy: vi.fn(),
                        scene: {}
                    }))
                }
            }
        };
    });

    it('should spawn waves correctly', () => {
        const config: LevelConfig = {
            name: 'Test Level',
            waves: [
                {
                    formationType: MockWave,
                    shipClass: MockShip,
                    count: 1
                }
            ]
        };

        level = new Level(scene, config, {} as any);
        level.start();

        expect(MockWave.instances.length).toBe(1);
        expect(MockWave.instances[0].spawn).toHaveBeenCalled();
    });

    it('should repeat waves', () => {
        const config: LevelConfig = {
            name: 'Test Level',
            waves: [
                {
                    formationType: MockWave,
                    shipClass: MockShip,
                    count: 2,
                    interval: 100
                }
            ]
        };

        level = new Level(scene, config, {} as any);
        level.start();

        expect(MockWave.instances.length).toBe(1);

        // Simulate update to complete wave
        level.update(0, 0);

        // Should have spawned second wave (delayedCall is mocked to execute immediately)
        expect(MockWave.instances.length).toBe(2);
    });
});
