import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SolarFlareEffect } from '../../../../src/scenes/planet-map/effects/solar-flare-effect';
import type { PlanetData } from '../../../../src/scenes/planet-map/planet-registry';
// @ts-ignore
import Phaser from 'phaser';

vi.mock('phaser', () => {
    return {
        default: {
            Math: {
                DegToRad: (deg: number) => deg * (Math.PI / 180),
                Between: (min: number, max: number) => min + (max - min) / 2, // Mock middle value
                FloatBetween: (min: number, max: number) => min + (max - min) / 2,
            },
            Time: {
                TimerEvent: class {
                    remove = vi.fn();
                }
            },
            GameObjects: {
                Particles: {
                    ParticleEmitter: class {
                        setConfig = vi.fn();
                        start = vi.fn();
                        stop = vi.fn();
                        setDepth = vi.fn();
                        destroy = vi.fn();
                        setVisible = vi.fn();
                    }
                }
            }
        }
    }
});

describe('SolarFlareEffect', () => {
    let effect: SolarFlareEffect;
    let mockScene: any;
    let planetData: PlanetData;
    let createdEmitters: any[];

    beforeEach(() => {
        vi.clearAllMocks();
        createdEmitters = [];

        mockScene = {
            add: {
                particles: vi.fn().mockImplementation(() => {
                    const emitter = new (Phaser.GameObjects.Particles.ParticleEmitter as any)();
                    createdEmitters.push(emitter);
                    return emitter;
                })
            },
            time: {
                addEvent: vi.fn().mockImplementation((config) => {
                    return {
                        remove: vi.fn(),
                        callback: config.callback,
                        delay: config.delay,
                        loop: config.loop
                    };
                }),
                delayedCall: vi.fn().mockImplementation((_delay, callback) => {
                    if (callback) callback();
                }),
                now: 1000
            }
        };

        planetData = {
            id: 'sun',
            x: 100,
            y: 100,
            name: 'Sun',
            solarFlare: {
                color: 0xff0000,
                frequency: 2000,
                speed: 10
            },
            gameObject: { x: 100, y: 100 } as any
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create an update timer on instantiation', () => {
        effect = new SolarFlareEffect(mockScene, planetData);
        expect(mockScene.time.addEvent).toHaveBeenCalledWith(expect.objectContaining({
            delay: 100,
            loop: true
        }));
    });

    it('should NOT create timer if solarFlare config is missing', () => {
        const noFlareData = { ...planetData, solarFlare: undefined };
        effect = new SolarFlareEffect(mockScene, noFlareData);
        expect(mockScene.time.addEvent).not.toHaveBeenCalled();
    });

    it('should spawn a flare when random chance is met', () => {
        effect = new SolarFlareEffect(mockScene, planetData);

        const mainTimer = mockScene.time.addEvent.mock.results[0].value;
        expect(mainTimer.callback).toBeDefined();

        // Mock random to be 0 (always spawn)
        vi.spyOn(Math, 'random').mockReturnValue(0.01);

        mainTimer.callback();

        expect(mockScene.add.particles).toHaveBeenCalledTimes(3);
        expect(createdEmitters.length).toBe(3);
    });

    it('should spawn a flare when list is empty even if random chance fails', () => {
        effect = new SolarFlareEffect(mockScene, planetData);
        const mainTimer = mockScene.time.addEvent.mock.results[0].value;

        // Mock random to be 0.99 (chance fails)
        vi.spyOn(Math, 'random').mockReturnValue(0.99);

        // First call should spawn because list is empty
        mainTimer.callback();

        expect(mockScene.add.particles).toHaveBeenCalledTimes(3);

        // Second call should NOT spawn because list is not empty and chance fails
        vi.clearAllMocks();
        // Since we didn't add the flare to the active list locally in the test (because mockScene is just a mock), 
        // we can't easily simulate the "active list has item" state without exposing private property.
        // However, we CAN check that the first call worked.
    });

    it('should destroy all flares when setVisible(false) is called', () => {
        effect = new SolarFlareEffect(mockScene, planetData);
        const mainTimer = mockScene.time.addEvent.mock.results[0].value;

        // Spawn one
        vi.spyOn(Math, 'random').mockReturnValue(0.01);
        mainTimer.callback();

        expect(createdEmitters.length).toBe(3);

        effect.setVisible(false);

        createdEmitters.forEach(e => {
            expect(e.destroy).toHaveBeenCalled();
        });

        // Check array reset by spawning another and seeing length
        createdEmitters = [];
        effect.setVisible(true);
        mainTimer.callback();
        expect(createdEmitters.length).toBe(3);
    });

    it('should NOT spawn a flare when list is populated and random chance is NOT met', () => {
        effect = new SolarFlareEffect(mockScene, planetData);
        const mainTimer = mockScene.time.addEvent.mock.results[0].value;

        // Force a spawn first to populate list
        vi.spyOn(Math, 'random').mockReturnValue(0.01);
        mainTimer.callback();
        expect(mockScene.add.particles).toHaveBeenCalledTimes(3);
        vi.clearAllMocks();

        // Now mock chance failure
        vi.spyOn(Math, 'random').mockReturnValue(0.99);

        mainTimer.callback();

        // Should NOT spawn new ones (3 * 0 additional calls)
        expect(mockScene.add.particles).not.toHaveBeenCalled();
    });

    it('should clean up on destroy', () => {
        effect = new SolarFlareEffect(mockScene, planetData);
        const mainTimer = mockScene.time.addEvent.mock.results[0].value;

        effect.destroy();

        expect(mainTimer.remove).toHaveBeenCalled();
    });

    it('should spawn overlapping flare when active flare is dying', () => {
        effect = new SolarFlareEffect(mockScene, planetData);
        const mainTimer = mockScene.time.addEvent.mock.results[0].value;

        // Force spawn first flare
        vi.spyOn(Math, 'random').mockReturnValue(0.99); // Don't spawn randomly
        // effect.flares is empty so it should spawn
        mainTimer.callback();
        expect(createdEmitters.length).toBe(3);

        // Mock remaining time of the first flare
        const mockFlare = {
            isActive: true,
            remainingTime: 200, // Dying! (threshold < 500)
            destroy: vi.fn()
        };
        (effect as any).flares = [mockFlare]; // Inject dying flare

        mainTimer.callback();

        // Should have spawned another one
        expect(mockScene.add.particles).toHaveBeenCalledTimes(6);
    });
});
