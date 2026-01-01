import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ColorCircleEffect } from '../../../../../../src/scenes/galaxies/planets/effects/color-circle-effect';
import type { PlanetData } from '../../../../../../src/scenes/galaxies/planets/planet-data';
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

describe('ColorCircleEffect', () => {
    let effect: ColorCircleEffect;
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
            id: 'prism',
            x: 100,
            y: 100,
            name: 'Prism',
            hidden: false,
            visualScale: 1.0,
            effects: [],
            gameObject: { x: 100, y: 100 } as any
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create emitters for each wave (default 3)', () => {
        effect = new ColorCircleEffect(mockScene, planetData, { type: 'color-circle' });

        expect(mockScene.add.particles).toHaveBeenCalledTimes(3);
        expect(createdEmitters.length).toBe(3);
    });

    it('should create custom number of wave emitters', () => {
        effect = new ColorCircleEffect(mockScene, planetData, {
            type: 'color-circle',
            waveCount: 5
        });

        expect(mockScene.add.particles).toHaveBeenCalledTimes(5);
        expect(createdEmitters.length).toBe(5);
    });

    it('should emit particles on update', () => {
        effect = new ColorCircleEffect(mockScene, planetData, { type: 'color-circle' });

        // Simulate update
        effect.update(1000, 16);

        // Wave emitters should setAlpha
        expect(createdEmitters[0].setAlpha).toHaveBeenCalled();
    });

    it('should toggle visibility for all wave emitters', () => {
        effect = new ColorCircleEffect(mockScene, planetData, { type: 'color-circle' });

        effect.setVisible(false);
        createdEmitters.forEach(emitter => {
            expect(emitter.setVisible).toHaveBeenCalledWith(false);
        });

        effect.setVisible(true);
        createdEmitters.forEach(emitter => {
            expect(emitter.setVisible).toHaveBeenCalledWith(true);
        });
    });

    it('should set depth for all wave emitters', () => {
        effect = new ColorCircleEffect(mockScene, planetData, { type: 'color-circle' });

        effect.setDepth(5);
        createdEmitters.forEach(emitter => {
            expect(emitter.setDepth).toHaveBeenCalledWith(5 + 1.1);
        });
    });

    it('should clean up on destroy', () => {
        effect = new ColorCircleEffect(mockScene, planetData, { type: 'color-circle' });

        effect.destroy();

        createdEmitters.forEach(emitter => {
            expect(emitter.destroy).toHaveBeenCalled();
        });
    });

    it('should not update when planet is hidden', () => {
        planetData.hidden = true;
        effect = new ColorCircleEffect(mockScene, planetData, { type: 'color-circle' });

        effect.update(1000, 16);

        // Should not emit particles when hidden
        createdEmitters.forEach(emitter => {
            expect(emitter.emitParticle).not.toHaveBeenCalled();
        });
    });

    it('should start hidden if planet is hidden', () => {
        planetData.hidden = true;
        effect = new ColorCircleEffect(mockScene, planetData, { type: 'color-circle' });

        createdEmitters.forEach(emitter => {
            expect(emitter.setVisible).toHaveBeenCalledWith(false);
        });
    });
});
