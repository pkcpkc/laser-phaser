import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BloodBossTactic } from '../../../../../src/scenes/shoot-em-ups/tactics/blood-boss-tactic';

// Define mocks outside to access them
const mockRotateTo = vi.fn((current: number, target: number, speed: number) => {
    if (Math.abs(target - current) <= speed) return target;
    return current + (target > current ? speed : -speed);
});

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Math: {
                Clamp: (v: number, min: number, max: number) => Math.min(Math.max(v, min), max),
                Interpolation: {
                    Linear: (v: number[], k: number) => {
                        const m = v.length - 1;
                        const f = m * k;
                        const i = Math.floor(f);
                        if (k < 0) return i < 0 ? v[0] : v[i];
                        if (k >= 1) return v[m];
                        return v[i] + (v[i + 1] - v[i]) * (f - i);
                    }
                },
                Angle: {
                    Between: (x1: number, y1: number, x2: number, y2: number) => Math.atan2(y2 - y1, x2 - x1),
                    RotateTo: (c: number, t: number, s: number) => mockRotateTo(c, t, s),
                    Wrap: (a: number) => a
                },
                Distance: {
                    Between: (x1: number, y1: number, x2: number, y2: number) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
                }
            }
        }
    }
});

describe('BloodBossTactic', () => {
    let tactic: BloodBossTactic;
    let mockScene: any;
    let mockShip: any;
    let mockFormation: any;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset default implementation
        mockRotateTo.mockImplementation((current: number, target: number, speed: number) => {
            if (Math.abs(target - current) <= speed) return target;
            return current + (target > current ? speed : -speed);
        });

        tactic = new BloodBossTactic();

        mockScene = {
            scale: { width: 800, height: 600 },
            ship: { // Player ship
                sprite: { x: 400, y: 500, active: true }
            }
        };

        mockShip = {
            sprite: {
                x: 400,
                y: 100,
                active: true,
                rotation: 0,
                setPosition: vi.fn((x, y) => {
                    mockShip.sprite.x = x;
                    mockShip.sprite.y = y;
                }),
                setRotation: vi.fn((r) => { mockShip.sprite.rotation = r; }),
                scene: mockScene
            },
            fireLasers: vi.fn(),
            maxSpeed: 100, // Mock maxSpeed
            config: {
                definition: {
                    gameplay: { rotationSpeed: 0.1 }
                }
            }
        };

        mockFormation = {
            getShips: () => [{ ship: mockShip, spawnTime: 0 }],
            update: vi.fn(),
            isComplete: () => false
        };

        // Mock Math.random to be deterministic
        // At 0.5: Target (200, 100). Movement starts at 400,100 -> moves left.
        vi.spyOn(Math, 'random').mockReturnValue(0.5);

        tactic.addFormation(mockFormation);
    });

    it('should start in MOVING state, set rotation, and move ship', () => {
        tactic.update(100, 100);
        expect(mockShip.sprite.setPosition).toHaveBeenCalled();
        expect(mockShip.sprite.setRotation).toHaveBeenCalled(); // Should rotate to face movement
        expect(mockShip.fireLasers).not.toHaveBeenCalled();
    });

    it('should transition to ROTATING after movement completes', () => {
        // 1. Start moving. Distance approx 200. Speed 100. Duration ~2000ms.
        tactic.update(0, 16);

        // 2. Advance time past 2000ms
        for (let i = 0; i < 2200 / 16; i++) {
            tactic.update(0, 16);
        }

        // Check if we entered ROTATING
        // Reset call count from initial MOVING rotation
        mockShip.sprite.setRotation.mockClear();

        tactic.update(0, 16);

        // Should rotate towards player now
        expect(mockShip.sprite.setRotation).toHaveBeenCalled();
        expect(mockShip.fireLasers).not.toHaveBeenCalled();

        // Explicitly check current state via reflection
        const state = (tactic as any).state;
        expect(state).toBe(1); // ROTATING
    });

    it('should transition to ATTACKING after rotation aligns', () => {
        // 1. Move (skip ahead)
        for (let i = 0; i < 2200 / 16; i++) tactic.update(0, 16);

        // 2. Rotate
        // Force instant rotation by mocking RotateTo to return target immediately
        mockRotateTo.mockImplementation((_c, t, _s) => t);

        // Run a few updates to allow transition
        for (let i = 0; i < 10; i++) {
            tactic.update(0, 16);
            if ((tactic as any).state === 2) break;
        }

        const state = (tactic as any).state;
        expect(state).toBe(2); // ATTACKING
    });

    it('should fire lasers continuously in ATTACKING state', () => {
        // 1. Move
        for (let i = 0; i < 2200 / 16; i++) tactic.update(0, 16);

        // 2. Rotate instant
        mockRotateTo.mockImplementation((_c, t, _s) => t);

        // Converge to ATTACKING
        for (let i = 0; i < 10; i++) {
            tactic.update(0, 16);
            if ((tactic as any).state === 2) break;
        }

        mockShip.fireLasers.mockClear();

        // Now should be attacking (waiting 4000ms)
        tactic.update(0, 16);
        expect(mockShip.fireLasers).toHaveBeenCalled();

        tactic.update(0, 16);
        expect(mockShip.fireLasers).toHaveBeenCalledTimes(2);
    });
});
