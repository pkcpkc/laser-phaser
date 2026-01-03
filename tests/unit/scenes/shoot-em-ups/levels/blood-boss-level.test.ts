
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

    it('should have one formation wave', () => {
        expect(BloodBossLevel.formations.length).toBe(1);
        expect(BloodBossLevel.formations[0].length).toBe(1);
    });

    describe('Formation', () => {
        let formationConfig: any;
        let FormationClass: any;
        let mockScene: any;


        beforeEach(() => {
            formationConfig = BloodBossLevel.formations[0][0];
            FormationClass = formationConfig.formationType;

            mockScene = {
                scale: { width: 800, height: 600 },
                add: {
                    existing: vi.fn()
                }
            };

            // mockShipClass definition removed (unused)
        });

        it('should create formation with correct config', () => {
            expect(formationConfig.tacticConfig.fireDuration).toBe(4000);
        });

        it('should spawn ship off-screen', () => {
            // Instantiate the internal formation class
            // It expects: scene, shipClass, collisionConfig, _config, shipConfig
            // Instantiate the internal formation class
            // It expects: scene, shipClass, collisionConfig, _config, shipConfig
            // (Skipping unused instantiation check)

            // Spy on ship constructor or console log if we can't easily spy on constructor passed as arg without more complex setup
            // Easier: Stub the ship class to verify instantiation
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
