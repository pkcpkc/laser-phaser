import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PathTactic } from '../../../../../src/scenes/shoot-em-ups/tactics/path-tactic';

// Mock Phaser global (minimal needed for PathTactic)
global.Phaser = {
    Math: {
        Angle: {
            RotateTo: (current: number, target: number, speed: number) => {
                const diff = target - current;
                if (Math.abs(diff) <= speed) return target;
                return current + Math.sign(diff) * speed;
            },
            Between: (x1: number, y1: number, x2: number, y2: number) => Math.atan2(y2 - y1, x2 - x1)
        }
    },
    Scene: class { }
} as any;

describe('PathTactic', () => {
    let pathTactic: PathTactic;
    let mockFormation: any;
    let mockEnemy: any;
    const SCENE_WIDTH = 800;
    const SCENE_HEIGHT = 600;

    beforeEach(() => {
        mockEnemy = {
            ship: {
                sprite: {
                    setPosition: vi.fn(),
                    setRotation: vi.fn(),
                    setVelocity: vi.fn(),
                    setVisible: vi.fn(),
                    setActive: vi.fn(),
                    x: 0,
                    y: 0,
                    rotation: 0,
                    active: true,
                    scene: {
                        scale: {
                            width: SCENE_WIDTH,
                            height: SCENE_HEIGHT
                        }
                    }
                },
                config: { definition: { gameplay: { speed: 100 } } },
                maxSpeed: 2, // 2 px/frame -> 120 px/sec
                fireLasers: vi.fn()
            },
            startX: 400, // Spawn typically at center if not specified, or formation logic sets it
            startY: -100,
            spawnTime: 0
        };

        mockFormation = {
            getShips: vi.fn().mockReturnValue([mockEnemy]),
            update: vi.fn(),
            isComplete: vi.fn().mockReturnValue(false)
        };
    });

    const initTactic = (tactic: PathTactic) => {
        const mockScene = mockEnemy.ship.sprite.scene;
        tactic.initialize(mockScene, null as any, {}, null, [], {} as any);
    };

    it('should initialize ship position to the first point in path', () => {
        // Path starts at (0.1, 0.1) -> (80, 60)
        pathTactic = new PathTactic({
            points: [[0.1, 0.1], [0.5, 0.5]]
        });
        initTactic(pathTactic);
        pathTactic.addFormation(mockFormation);

        // Update with tiny time to trigger initialization but minimal movement
        pathTactic.update(100, 0);

        const call = (mockEnemy.ship.sprite.setPosition as any).mock.calls[0];
        const newX = call[0];
        const newY = call[1];

        expect(newX).toBeCloseTo(80, 0);
        expect(newY).toBeCloseTo(60, 0);
    });

    it('should move towards the second point', () => {
        // Start (0, 0) -> Target (0.1, 0) -> (80, 0).
        // Distance 80.
        // Speed 120 px/sec.
        // Time 0.5 sec -> Move 60px.
        // Result X should be 60.
        pathTactic = new PathTactic({
            points: [[0, 0], [0.1, 0]]
        });
        initTactic(pathTactic);
        pathTactic.addFormation(mockFormation);

        // Update 500ms
        pathTactic.update(500, 500);

        const call = (mockEnemy.ship.sprite.setPosition as any).mock.calls[0];
        expect(call[0]).toBeCloseTo(60, 1);
        expect(call[1]).toBeCloseTo(0, 1);
    });

    it('should reach point and turn towards next point', () => {
        // Start (0, 0) -> P1 (0.1, 0) -> P2 (0.1, 0.1)
        // (0,0) -> (80,0) -> (80, 60)
        // Checkpoints.
        pathTactic = new PathTactic({
            points: [[0, 0], [0.1, 0], [0.1, 0.1]]
        });
        initTactic(pathTactic);
        pathTactic.addFormation(mockFormation);

        // 1. Move to Reach P1. Need 80px.
        // Time 1000ms -> 120px movement.
        // Should reach 80, then switch to P2 (Down), move remaining 40px down.
        // Result: X=80, Y=40.

        pathTactic.update(1000, 1000);

        const call = (mockEnemy.ship.sprite.setPosition as any).mock.calls[0];
        expect(call[0]).toBeCloseTo(80, 1);
        expect(call[1]).toBeCloseTo(40, 1);
    });

    it('should continue in last direction after finishing points', () => {
        // Start (0,0) -> P1 (0.01, 0) -> (8px, 0).
        // Update 1s -> 120px.
        // Reach 8px, finish. Last angle 0 (Right).
        // Continue remaining 112px Right.
        // Total X = 120.

        pathTactic = new PathTactic({
            points: [[0, 0], [0.01, 0]]
        });
        initTactic(pathTactic);
        pathTactic.addFormation(mockFormation);

        pathTactic.update(1000, 1000);

        const call = (mockEnemy.ship.sprite.setPosition as any).mock.calls[0];
        expect(call[0]).toBeCloseTo(120, 1);
        expect(call[1]).toBeCloseTo(0, 1);
    });

    it('should calculate target point towards player dynamically', () => {
        // Mock Player at (400, 400)
        mockEnemy.ship.sprite.scene.ship = {
            sprite: { x: 400, y: 400, active: true }
        };

        // Start (0, 0) -> Target Player with 0.5 approach.
        // Vector (400, 400). Distance = sqrt(400^2 + 400^2) = 565.68
        // Approach 0.5 -> Target should be at (200, 200).
        // Distance to target = sqrt(200^2 + 200^2) = 282.84

        pathTactic = new PathTactic({
            points: [
                [0, 0],
                { type: 'player', approach: 0.5 }
            ]
        });
        initTactic(pathTactic);
        pathTactic.addFormation(mockFormation);

        // Update with enough time to reach target?
        // Speed 120 px/sec. Target 282px away. Need ~2.4s.
        // Let's prevent reaching it first to check angle/direction.
        pathTactic.update(1000, 1000); // Move 120px.

        const call = (mockEnemy.ship.sprite.setPosition as any).mock.calls[0];
        const newX = call[0];
        const newY = call[1];

        // Should be on the line y=x.
        expect(newX).toBeCloseTo(newY, 1);

        // Exact check: 120px travel at 45 deg.
        // x = 120 * cos(45) = 120 * 0.707 = 84.8
        expect(newX).toBeCloseTo(84.85, 1);

        // Now verify that if player moves, the target does NOT change (calculated once)
        // 1. Reset tactic to ensure fresh start
        // Actually, we are mid-flight. If we updated again, resolvedTarget should be cached.

        // Move player to somewhere else
        mockEnemy.ship.sprite.scene.ship.sprite.x = 800;

        pathTactic.update(1000, 1000); // Move another 120px.

        const call2 = (mockEnemy.ship.sprite.setPosition as any).mock.calls[1];
        const x2 = call2[0];
        const y2 = call2[1];

        // Should continue towards original (200, 200), not new player pos.
        // Expected total dist 240. Still on y=x line.
        expect(x2).toBeCloseTo(y2, 1);
        expect(x2).toBeCloseTo(169.7, 1); // 240 * 0.707
    });

    describe('formation speed calculation', () => {
        it('should use minimum speed across all ships in the formation', () => {
            // Create two ships with different speeds
            // Use scene from the beforeEach mock
            const mockScene = mockEnemy.ship.sprite.scene;

            const fastEnemy = {
                ship: {
                    sprite: {
                        setPosition: vi.fn(),
                        setRotation: vi.fn(),
                        setVelocity: vi.fn(),
                        setVisible: vi.fn(),
                        x: 0,
                        y: 0,
                        rotation: 0,
                        active: true
                    },
                    maxSpeed: 4, // Fast ship: 4 px/frame -> 240 px/sec
                    fireLasers: vi.fn()
                },
                startX: 0, // Start at path origin
                startY: 0,
                spawnTime: 0
            };

            const slowEnemy = {
                ship: {
                    sprite: {
                        setPosition: vi.fn(),
                        setRotation: vi.fn(),
                        setVelocity: vi.fn(),
                        setVisible: vi.fn(),
                        x: 0,
                        y: 0,
                        rotation: 0,
                        active: true
                    },
                    maxSpeed: 1, // Slow ship: 1 px/frame -> 60 px/sec
                    fireLasers: vi.fn()
                },
                startX: 50, // Slightly offset
                startY: 0,
                spawnTime: 0
            };

            const mixedFormation = {
                getShips: vi.fn().mockReturnValue([fastEnemy, slowEnemy]),
                update: vi.fn(),
                isComplete: vi.fn().mockReturnValue(false),
                spawn: vi.fn(),
                destroy: vi.fn()
            };

            pathTactic = new PathTactic({
                points: [[0, 0], [1, 0]] // Move right across full width (800px)
            });
            // Use proper scene initialization
            pathTactic.initialize(mockScene, null as any, {}, null, [], {} as any);
            pathTactic.addFormation(mixedFormation as any);

            // Update 1s -> slow ship speed (60 px/sec) should be used
            pathTactic.update(1000, 1000);

            // Both ships should move at the slow ship's speed (60px in 1 sec)
            const fastCall = (fastEnemy.ship.sprite.setPosition as any).mock.calls[0];
            const slowCall = (slowEnemy.ship.sprite.setPosition as any).mock.calls[0];

            // Fast ship started at 0, displacement should be 60
            expect(fastCall[0]).toBeCloseTo(60, 1);
            // Slow ship started at 50, displacement should be 60
            expect(slowCall[0]).toBeCloseTo(110, 1);
        });

        it('should recalculate speed when slow ship is destroyed', () => {
            // Use scene from the beforeEach mock
            const mockScene = mockEnemy.ship.sprite.scene;

            const fastEnemy = {
                ship: {
                    sprite: {
                        setPosition: vi.fn(),
                        setRotation: vi.fn(),
                        setVelocity: vi.fn(),
                        setVisible: vi.fn(),
                        x: 0,
                        y: 0,
                        rotation: 0,
                        active: true
                    },
                    maxSpeed: 4, // Fast ship: 4 px/frame -> 240 px/sec
                    fireLasers: vi.fn()
                },
                startX: 0, // Start at path origin
                startY: 0,
                spawnTime: 0
            };

            const slowEnemy = {
                ship: {
                    sprite: {
                        setPosition: vi.fn(),
                        setRotation: vi.fn(),
                        setVelocity: vi.fn(),
                        setVisible: vi.fn(),
                        x: 0,
                        y: 0,
                        rotation: 0,
                        active: true
                    },
                    maxSpeed: 1, // Slow ship: 1 px/frame -> 60 px/sec
                    fireLasers: vi.fn()
                },
                startX: 50,
                startY: 0,
                spawnTime: 0
            };

            let currentShips = [fastEnemy, slowEnemy];
            const mixedFormation = {
                getShips: vi.fn(() => currentShips),
                update: vi.fn(),
                isComplete: vi.fn().mockReturnValue(false),
                spawn: vi.fn(),
                destroy: vi.fn()
            };

            pathTactic = new PathTactic({
                points: [[0, 0], [1, 0]] // Move right (long distance)
            });
            pathTactic.initialize(mockScene, null as any, {}, null, [], {} as any);
            pathTactic.addFormation(mixedFormation as any);

            // First update: both ships, slow speed (60 px/sec)
            pathTactic.update(1000, 1000);

            // "Destroy" slow ship by removing it from the formation
            currentShips = [fastEnemy];

            // Second update: only fast ship, fast speed (240 px/sec)
            pathTactic.update(2000, 1000);

            const calls = (fastEnemy.ship.sprite.setPosition as any).mock.calls;
            // Fast ship started at X=0
            const firstPosition = calls[0][0]; // After first update
            const secondPosition = calls[1][0]; // After second update

            // First position should be 60px (slow speed: 1 * 60 = 60)
            expect(firstPosition).toBeCloseTo(60, 1);
            // Second position should be 60 + 240 = 300px (slow + fast speed: 4 * 60 = 240)
            expect(secondPosition).toBeCloseTo(300, 1);
        });

        it('should use default speed when ship has no maxSpeed defined', () => {
            // Use scene from the beforeEach mock
            const mockScene = mockEnemy.ship.sprite.scene;

            const noSpeedEnemy = {
                ship: {
                    sprite: {
                        setPosition: vi.fn(),
                        setRotation: vi.fn(),
                        setVelocity: vi.fn(),
                        setVisible: vi.fn(),
                        x: 0,
                        y: 0,
                        rotation: 0,
                        active: true
                    },
                    maxSpeed: undefined, // No speed defined
                    fireLasers: vi.fn()
                },
                startX: 0, // Start at path origin
                startY: 0,
                spawnTime: 0
            };

            const noSpeedFormation = {
                getShips: vi.fn().mockReturnValue([noSpeedEnemy]),
                update: vi.fn(),
                isComplete: vi.fn().mockReturnValue(false),
                spawn: vi.fn(),
                destroy: vi.fn()
            };

            pathTactic = new PathTactic({
                points: [[0, 0], [1, 0]] // Move right
            });
            pathTactic.initialize(mockScene, null as any, {}, null, [], {} as any);
            pathTactic.addFormation(noSpeedFormation as any);

            // Update 1s -> should use default speed (2 px/frame -> 120 px/sec)
            pathTactic.update(1000, 1000);

            const call = (noSpeedEnemy.ship.sprite.setPosition as any).mock.calls[0];
            // Started at 0, displacement should be 120
            expect(call[0]).toBeCloseTo(120, 1);
        });
    });
});
