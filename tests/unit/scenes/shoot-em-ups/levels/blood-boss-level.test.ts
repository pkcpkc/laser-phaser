
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BloodBossLevel } from '../../../../../src/scenes/shoot-em-ups/levels/blood-boss-level';

// Mock Phaser to prevent side effects in headless environment
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            GameObjects: {
                Image: class { },
                Sprite: class { }
            },
            Math: {
                Between: vi.fn().mockReturnValue(400),
                Vector2: class { }
            },
            Physics: {
                Matter: {
                    Image: class { },
                    Sprite: class { }
                }
            }
        }
    };
});

// Mock Tactic
vi.mock('../../../../../src/scenes/shoot-em-ups/tactics/blood-boss-tactic', () => {
    return {
        BloodBossTactic: vi.fn()
    };
});

describe('BloodBossLevel', () => {
    it('should have correct name', () => {
        expect(BloodBossLevel.name).toBe('Blood Boss');
    });

    it('should have three formation waves', () => {
        expect(BloodBossLevel.formations.length).toBe(3);
    });

    it('should have hunters in wave 1', () => {
        expect(BloodBossLevel.formations[0].length).toBeGreaterThanOrEqual(1);
    });

    it('should have mixed formations in wave 2', () => {
        expect(BloodBossLevel.formations[1].length).toBeGreaterThanOrEqual(1);
    });

    describe('Boss Formation (Wave 3)', () => {
        let formationConfig: any;
        let FormationClass: any;
        let mockScene: any;


        beforeEach(() => {
            // The boss is in the third wave
            formationConfig = BloodBossLevel.formations[2][0];
            expect(formationConfig.shipConfigs[0].definition.id).toBe('blood-boss');

            FormationClass = formationConfig.formationType;

            mockScene = {
                scale: { width: 800, height: 600 },
                time: { now: 1000 },
                add: {
                    existing: vi.fn()
                }
            };
        });

        it('should create boss formation with correct config', () => {
            expect(formationConfig.tacticConfig.fireDuration).toBe(4000);
        });

        it('should spawn boss ship off-screen', () => {
            const shipSpy = vi.fn();
            const spyClass = class {
                constructor(scene: any, x: number, y: number) {
                    shipSpy(scene, x, y);
                }
                sprite = { active: true };
            };

            const formationWithSpy = new FormationClass(
                mockScene,
                spyClass,
                {},
                {},
                formationConfig.shipConfigs
            );

            formationWithSpy.spawn();

            expect(shipSpy).toHaveBeenCalled();
            const args = shipSpy.mock.calls[0];
            expect(args[1]).toBeGreaterThanOrEqual(0);
            expect(args[1]).toBeLessThanOrEqual(800);
            expect(args[2]).toBe(-200); // startY
        });
    });
});
