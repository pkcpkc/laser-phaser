
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Level, type LevelConfig } from '../../src/levels/level';


// Mock Phaser classes
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            Time: {
                TimerEvent: class {
                    remove = vi.fn();
                }
            },
            Math: {
                Between: (min: number, _max: number) => min
            },
            Physics: {
                Matter: {
                    Image: class {
                        setFixedRotation = vi.fn();
                        setMass = vi.fn();
                        setFrictionAir = vi.fn();
                        collisionFilter = {};
                        setOnCollide = vi.fn();
                        setCollidesWith = vi.fn();
                    },
                    Sprite: class {
                        setFixedRotation = vi.fn();
                        setMass = vi.fn();
                        setFrictionAir = vi.fn();
                        collisionFilter = {};
                        setOnCollide = vi.fn();
                        setCollidesWith = vi.fn();
                        anims = { play: vi.fn(), stop: vi.fn() };
                    }
                }
            },
            GameObjects: {
                Sprite: class {
                    setPosition = vi.fn();
                    setActive = vi.fn();
                    setVisible = vi.fn();
                    setDepth = vi.fn();
                    setRotation = vi.fn();
                    anims = { play: vi.fn(), stop: vi.fn() };
                }
            }
        }
    };
});

// Mock Ship removed as unused

// Mock Formation class
class MockFormation {
    static instances: MockFormation[] = [];
    spawn = vi.fn();
    update = vi.fn();
    destroy = vi.fn();
    isComplete = vi.fn().mockReturnValue(false);

    constructor(_scene: any, _shipClass: any, _collisionConfig: any, _config: any, _shipConfig: any) {
        MockFormation.instances.push(this);
    }
}

describe('Level', () => {
    let mockScene: any;
    let mockCollisionConfig: any;

    beforeEach(() => {
        MockFormation.instances = [];
        vi.useFakeTimers();
        mockScene = {
            time: {
                delayedCall: vi.fn((delay, callback) => {
                    setTimeout(callback, delay);
                    return { remove: vi.fn() };
                })
            },
            add: {
                existing: vi.fn()
            },
            physics: {
                add: {
                    existing: vi.fn()
                }
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
        mockCollisionConfig = {};
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('should spawn formations sequentially across steps', () => {
        class MockFormationType1 extends MockFormation { }
        class MockFormationType2 extends MockFormation { }

        const config: LevelConfig = {
            name: 'Test Level',
            formations: [
                [{ formationType: MockFormationType1 }],
                [{ formationType: MockFormationType2 }]
            ]
        };

        const level = new Level(mockScene, config, mockCollisionConfig);
        level.start();

        // First formation should spawn immediately
        expect(MockFormation.instances.length).toBe(1);
        const formation1 = MockFormation.instances[0];
        expect(formation1).toBeInstanceOf(MockFormationType1);
        expect(formation1.spawn).toHaveBeenCalled();

        // Second formation should NOT spawn yet
        // Since we check instances array, we know exactly what's there

        // Update level
        level.update(0, 0);
        expect(formation1.update).toHaveBeenCalled();

        // Complete first formation
        formation1.isComplete.mockReturnValue(true);
        level.update(0, 0); // Detect completion and cleanup

        expect(formation1.destroy).toHaveBeenCalled();

        // Next update or immediately?
        // Logic: activeRunners filter runs, if empty, spawnNextStep.
        // It happens in same update loop if filters run and then check empty.
        // Let's check if second formation is spawned.

        expect(MockFormation.instances.length).toBe(2);
        const formation2 = MockFormation.instances[1];
        expect(formation2).toBeInstanceOf(MockFormationType2);
        expect(formation2.spawn).toHaveBeenCalled();
    });

    it('should spawn formations in parallel', () => {
        class MockFormationType1 extends MockFormation { }
        class MockFormationType2 extends MockFormation { }

        const config: LevelConfig = {
            name: 'Test Level',
            formations: [
                [
                    { formationType: MockFormationType1 },
                    { formationType: MockFormationType2 }
                ]
            ]
        };

        const level = new Level(mockScene, config, mockCollisionConfig);
        level.start();

        expect(MockFormation.instances.length).toBe(2);
        expect(MockFormation.instances[0]).toBeInstanceOf(MockFormationType1);
        expect(MockFormation.instances[1]).toBeInstanceOf(MockFormationType2);

        const instance1 = MockFormation.instances[0];
        const instance2 = MockFormation.instances[1];

        expect(instance1.spawn).toHaveBeenCalled();
        expect(instance2.spawn).toHaveBeenCalled();

        level.update(0, 0);
        expect(instance1.update).toHaveBeenCalled();
        expect(instance2.update).toHaveBeenCalled();
    });

    it('should handle startDelay', () => {
        class MockFormationType1 extends MockFormation { }

        const config: LevelConfig = {
            name: 'Test Level',
            formations: [
                [{
                    formationType: MockFormationType1,
                    startDelay: 1000
                }]
            ]
        };

        const level = new Level(mockScene, config, mockCollisionConfig);
        level.start();

        // Should NOT have spawned yet (instances created but spawn called later? No, runner created but spawn delayed?)
        // Wait, FormationRunner constructor calls delayedCall if startDelay > 0.
        // And spawn() creates the instance.
        // So NO instance should be created yet.

        expect(MockFormation.instances.length).toBe(0);

        // Fast forward time
        vi.advanceTimersByTime(1000);

        expect(MockFormation.instances.length).toBe(1);
        expect(MockFormation.instances[0].spawn).toHaveBeenCalled();
    });

    it('should handle interval repeating', () => {
        class MockFormationType1 extends MockFormation { }

        const config: LevelConfig = {
            name: 'Test Level',
            formations: [
                [{
                    formationType: MockFormationType1,
                    count: 2,
                    interval: 500
                }]
            ]
        };

        const level = new Level(mockScene, config, mockCollisionConfig);
        level.start();

        // First spawn
        expect(MockFormation.instances.length).toBe(1);
        const instance1 = MockFormation.instances[0];
        expect(instance1.spawn).toHaveBeenCalled();

        // Complete first spawn
        instance1.isComplete.mockReturnValue(true);
        level.update(0, 0);
        expect(instance1.destroy).toHaveBeenCalled();

        // Should be waiting for interval. No new instance yet.
        expect(MockFormation.instances.length).toBe(1);

        // Advance time
        vi.advanceTimersByTime(500);

        // Second spawn
        expect(MockFormation.instances.length).toBe(2);
        const instance2 = MockFormation.instances[1];
        expect(instance2).toBeInstanceOf(MockFormationType1);
        expect(instance2.spawn).toHaveBeenCalled();

        // Complete second spawn
        instance2.isComplete.mockReturnValue(true);
        level.update(0, 0);
        expect(instance2.destroy).toHaveBeenCalled();

        // No more spawns should happen (count 2)
        vi.advanceTimersByTime(1000);
        expect(MockFormation.instances.length).toBe(2);
    });
});
