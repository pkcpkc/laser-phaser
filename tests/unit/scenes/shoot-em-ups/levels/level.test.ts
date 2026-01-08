
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Level, type LevelConfig } from '../../../../../src/scenes/shoot-em-ups/levels/level';


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

    getShips = vi.fn().mockReturnValue([]);

    constructor(_scene: any, _shipClass: any, _collisionConfig: any, _config: any, _shipConfig: any) {
        MockFormation.instances.push(this);
    }
}

// Mock Tactic class
class MockTactic {
    static instances: MockTactic[] = [];
    static lastSpawnedFormation: MockFormation | null = null;

    initialize = vi.fn((_scene, formationType, _formationConfig, shipClass, shipConfigs, collisionConfig) => {
        this.initData = { formationType, shipClass, shipConfigs, collisionConfig };
    });

    spawn = vi.fn(() => {
        const formation = new this.initData.formationType(
            {}, // scene mock
            this.initData.shipClass,
            this.initData.collisionConfig,
            {},
            this.initData.shipConfigs
        );
        MockTactic.lastSpawnedFormation = formation;
        formation.spawn();
    });

    update = vi.fn();
    destroy = vi.fn();
    isComplete = vi.fn().mockReturnValue(false);
    addFormation = vi.fn();

    private initData: any;

    constructor() {
        MockTactic.instances.push(this);
    }
}

describe('Level', () => {
    let mockScene: any;
    let mockCollisionConfig: any;

    beforeEach(() => {
        MockFormation.instances = [];
        MockTactic.instances = [];
        MockTactic.lastSpawnedFormation = null;
        vi.useFakeTimers();
        mockScene = {
            time: {
                delayedCall: vi.fn((delay, callback) => {
                    setTimeout(callback, delay);
                    return { remove: vi.fn() };
                })
            },
            sys: {
                isActive: vi.fn().mockReturnValue(true)
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
                [{ formationType: MockFormationType1, tacticType: MockTactic as any }],
                [{ formationType: MockFormationType2, tacticType: MockTactic as any }]
            ]
        };

        const level = new Level(mockScene, config, mockCollisionConfig);
        level.start();

        // Advance timers to trigger deferred spawn (time.delayedCall(0))
        vi.advanceTimersByTime(0);

        // First tactic should spawn after deferred call
        expect(MockTactic.instances.length).toBe(1);
        const tactic1 = MockTactic.instances[0];
        expect(tactic1.initialize).toHaveBeenCalled();
        expect(tactic1.spawn).toHaveBeenCalled();

        expect(MockFormation.instances.length).toBe(1);
        const formation1 = MockFormation.instances[0];
        expect(formation1).toBeInstanceOf(MockFormationType1);

        // Update level
        level.update(0, 0);
        expect(tactic1.update).toHaveBeenCalled();

        // Complete first formation
        tactic1.isComplete.mockReturnValue(true);
        level.update(0, 0);

        expect(tactic1.destroy).toHaveBeenCalled();

        // Advance timers to trigger deferred spawn of second wave
        vi.advanceTimersByTime(0);

        // Second wave should spawn
        expect(MockTactic.instances.length).toBe(2);
        const tactic2 = MockTactic.instances[1];
        expect(tactic2.spawn).toHaveBeenCalled();
        expect(MockFormation.instances.length).toBe(2);
        expect(MockFormation.instances[1]).toBeInstanceOf(MockFormationType2);
    });

    it('should spawn formations in parallel', () => {
        class MockFormationType1 extends MockFormation { }
        class MockFormationType2 extends MockFormation { }

        const config: LevelConfig = {
            name: 'Test Level',
            formations: [
                [
                    { formationType: MockFormationType1, tacticType: MockTactic as any },
                    { formationType: MockFormationType2, tacticType: MockTactic as any }
                ]
            ]
        };

        const level = new Level(mockScene, config, mockCollisionConfig);
        level.start();

        // Advance timers to trigger deferred spawn (time.delayedCall(0))
        vi.advanceTimersByTime(0);

        expect(MockTactic.instances.length).toBe(2);
        expect(MockFormation.instances.length).toBe(2);

        const tactic1 = MockTactic.instances[0];
        const tactic2 = MockTactic.instances[1];

        expect(tactic1.spawn).toHaveBeenCalled();
        expect(tactic2.spawn).toHaveBeenCalled();

        level.update(0, 0);
        expect(tactic1.update).toHaveBeenCalled();
        expect(tactic2.update).toHaveBeenCalled();
    });

    it('should handle startDelay', () => {
        class MockFormationType1 extends MockFormation { }

        const config: LevelConfig = {
            name: 'Test Level',
            formations: [
                [{
                    formationType: MockFormationType1,
                    tacticType: MockTactic as any,
                    startDelay: 1000
                }]
            ]
        };

        const level = new Level(mockScene, config, mockCollisionConfig);
        level.start();

        expect(MockTactic.instances.length).toBe(0);

        // Fast forward time
        vi.advanceTimersByTime(1000);

        expect(MockTactic.instances.length).toBe(1);
        expect(MockTactic.instances[0].spawn).toHaveBeenCalled();
        expect(MockFormation.instances.length).toBe(1);
    });



    it('should loop when loop is true', () => {
        class MockFormationType1 extends MockFormation { }

        const config: LevelConfig = {
            name: 'Loop Level',
            loop: true,
            formations: [
                [{ formationType: MockFormationType1, tacticType: MockTactic as any }]
            ]
        };

        const level = new Level(mockScene, config, mockCollisionConfig);
        level.start();

        // 1st Iteration
        vi.advanceTimersByTime(0);
        expect(MockTactic.instances.length).toBe(1);

        // Complete the tactic
        const tactic1 = MockTactic.instances[0];
        (tactic1.isComplete as any).mockReturnValue(true);
        level.update(0, 0);
        expect(tactic1.destroy).toHaveBeenCalled();

        // Trigger next loop
        level.update(0, 0);

        expect(MockTactic.instances.length).toBe(2);
    });
});
