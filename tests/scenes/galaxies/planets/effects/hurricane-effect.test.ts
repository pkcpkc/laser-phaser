import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HurricaneEffect } from '../../../../../src/scenes/galaxies/planets/effects/hurricane-effect';
import type { PlanetData } from '../../../../../src/scenes/galaxies/planets/planet-data';
// @ts-ignore
import Phaser from 'phaser';

vi.mock('phaser', () => {
    return {
        default: {
            Math: {
                DegToRad: (deg: number) => deg * (Math.PI / 180),
                Vector3: class {
                    x = 0; y = 0; z = 0;
                    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
                    normalize() { return this; }
                    set(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; return this; }
                    crossVectors() { return this; }
                    transformQuat() { return this; }
                    dot() { return 0; }
                    length() { return 1; }
                },
                Quaternion: class {
                    setAxisAngle() { return this; }
                },
            },
            Time: {
                TimerEvent: class {
                    remove = vi.fn();
                }
            },
            GameObjects: {
                Particles: {
                    ParticleEmitter: class {
                        setPosition = vi.fn();
                        start = vi.fn();
                        stop = vi.fn();
                        setDepth = vi.fn();
                        destroy = vi.fn();
                        setVisible = vi.fn();
                        emitParticle = vi.fn();
                        setAlpha = vi.fn();
                        setLifespan = vi.fn();
                        setParticleAlpha = vi.fn();
                    },
                    Particle: class { }
                }
            }
        }
    }
});

describe('HurricaneEffect', () => {
    let effect: HurricaneEffect;
    let mockScene: any;
    let planetData: PlanetData;
    let createdEmitters: any[];

    beforeEach(() => {
        vi.clearAllMocks();
        createdEmitters = [];

        mockScene = {
            events: {
                on: vi.fn(),
                off: vi.fn()
            },
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
                now: 1000
            },
            textures: {
                exists: vi.fn().mockReturnValue(true),
                createCanvas: vi.fn().mockReturnValue({
                    context: {
                        beginPath: vi.fn(),
                        arc: vi.fn(),
                        fillStyle: '',
                        fill: vi.fn()
                    },
                    refresh: vi.fn()
                })
            }
        };

        planetData = {
            id: 'earth',
            x: 100,
            y: 100,
            name: 'Earth',
            hidden: false, // Effects need planet to be visible
            visualScale: 1.0,
            effects: [], // Start empty, will be populated by registry in real app, but here we test effect isolation
            gameObject: { x: 100, y: 100 } as any
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create 1 arm emitter, 1 eyewall emitter and 1 eye emitter (3 total)', () => {
        effect = new HurricaneEffect(mockScene, planetData, { type: 'hurricane', color: 0xffffff });

        expect(mockScene.add.particles).toHaveBeenCalledTimes(3);
        expect(createdEmitters.length).toBe(3);
    });

    it('should emit particles along spiral on update', () => {
        effect = new HurricaneEffect(mockScene, planetData, { type: 'hurricane', color: 0xffffff });

        // Simulate update
        effect.update(1000, 16);

        // Cloud emitter should setAlpha
        expect(createdEmitters[0].setAlpha).toHaveBeenCalled();
    });

    it('should toggle visibility for all emitters', () => {
        effect = new HurricaneEffect(mockScene, planetData, { type: 'hurricane', color: 0xffffff });

        effect.setVisible(false);
        createdEmitters.forEach(emitter => {
            expect(emitter.setVisible).toHaveBeenCalledWith(false);
        });

        effect.setVisible(true);
        createdEmitters.forEach(emitter => {
            expect(emitter.setVisible).toHaveBeenCalledWith(true);
        });
    });

    it('should clean up on destroy', () => {
        effect = new HurricaneEffect(mockScene, planetData, { type: 'hurricane', color: 0xffffff });

        effect.destroy();

        createdEmitters.forEach(emitter => {
            expect(emitter.destroy).toHaveBeenCalled();
        });
    });
});
