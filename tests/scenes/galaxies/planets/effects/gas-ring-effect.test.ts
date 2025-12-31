import { describe, it, expect, vi, beforeEach } from 'vitest';
// @ts-ignore
import Phaser from 'phaser';

vi.mock('phaser', () => {
    return {
        default: {
            Math: {
                DegToRad: (deg: number) => deg * (Math.PI / 180),
                RadToDeg: (rad: number) => rad * (180 / Math.PI),
                FloatBetween: () => 1.5, // Predictable random
                Between: () => 1000,
                Linear: (p0: number, p1: number, t: number) => p0 + t * (p1 - p0),
                Vector2: class { x = 0; y = 0; },
                GetSpeed: () => 0,
            },
            BlendModes: { ADD: 1 },
            GameObjects: {
                Particles: {
                    ParticleEmitter: class {
                        setPosition = vi.fn();
                        setDepth = vi.fn();
                        setVisible = vi.fn();
                        destroy = vi.fn();
                        active = true;
                    },
                    Particle: class { x = 0; y = 0; velocityX = 0; velocityY = 0; }
                },
                Graphics: class {
                    fillStyle = vi.fn();
                    fillCircle = vi.fn();
                    setPosition = vi.fn();
                    setDepth = vi.fn();
                    setScale = vi.fn();
                    setVisible = vi.fn();
                    destroy = vi.fn();
                    clear = vi.fn();
                    lineStyle = vi.fn();
                    beginPath = vi.fn();
                    moveTo = vi.fn();
                    lineTo = vi.fn();
                    strokePath = vi.fn();
                    active = true;
                    alpha = 1;
                },
                Container: class {
                    setDepth = vi.fn();
                    setVisible = vi.fn();
                    destroy = vi.fn();
                    add = vi.fn();
                    setPosition = vi.fn();
                    active = true;
                },
                Image: class {
                    setTint = vi.fn();
                    setBlendMode = vi.fn();
                    setPosition = vi.fn();
                    setRotation = vi.fn();
                    setScale = vi.fn();
                    setData = vi.fn();
                    setAlpha = vi.fn();
                    getData = vi.fn();
                }
            },
            Scene: class {
                add = {
                    graphics: vi.fn(() => new Phaser.GameObjects.Graphics({} as Phaser.Scene)),
                    particles: vi.fn(() => new Phaser.GameObjects.Particles.ParticleEmitter({} as Phaser.Scene)),
                    container: vi.fn(() => new Phaser.GameObjects.Container({} as Phaser.Scene)),
                    image: vi.fn(() => new Phaser.GameObjects.Image({} as Phaser.Scene, 0, 0, '')),
                };
                tweens = {
                    add: vi.fn(),
                    addCounter: vi.fn(),
                };
            }
        }
    }
});

import { GasRingEffect, type GasRingConfig } from '../../../../../src/scenes/galaxies/planets/effects/gas-ring-effect';
import type { PlanetData } from '../../../../../src/scenes/galaxies/planets/planet-data';

describe('GasRingEffect', () => {
    let scene: Phaser.Scene;
    let planet: PlanetData;
    let config: GasRingConfig;

    beforeEach(() => {
        scene = {
            add: {
                graphics: vi.fn().mockReturnValue({
                    fillStyle: vi.fn(),
                    fillCircle: vi.fn(),
                    setPosition: vi.fn(),
                    setDepth: vi.fn(),
                    setScale: vi.fn(),
                    setVisible: vi.fn(),
                    destroy: vi.fn(),
                    clear: vi.fn(),
                }),
                particles: vi.fn().mockReturnValue({
                    setDepth: vi.fn(),
                    setVisible: vi.fn(),
                    destroy: vi.fn(),
                    active: true,
                    setPosition: vi.fn(),
                }),
                container: vi.fn().mockReturnValue({
                    setDepth: vi.fn(),
                    setVisible: vi.fn(),
                    destroy: vi.fn(),
                    add: vi.fn(),
                    setPosition: vi.fn(),
                }),
                image: vi.fn().mockReturnValue({
                    setTint: vi.fn(),
                    setBlendMode: vi.fn(),
                    setPosition: vi.fn(),
                    setRotation: vi.fn(),
                    setScale: vi.fn(),
                    setData: vi.fn(),
                    setAlpha: vi.fn(),
                }),
            },
            tweens: {
                add: vi.fn(),
                addCounter: vi.fn(),
            },
        } as unknown as Phaser.Scene;

        planet = {
            id: 'test-planet',
            x: 100,
            y: 200,
            name: 'Test Planet',
            type: 'gas',
            color: 'blue',
            hidden: false,
            visualScale: 1.0,
        } as unknown as PlanetData;

        config = {
            type: 'gas-ring',
            color: 0xff0000,
            angle: -30,
        };
    });

    it('should create back and front emitters', () => {
        new GasRingEffect(scene, planet, config);
        // Base creates occluder (1 graphics)
        expect(scene.add.graphics).toHaveBeenCalled();
        // GasRing creates 2 emitters
        expect(scene.add.particles).toHaveBeenCalledTimes(2);
    });

    it('should toggle visibility', () => {
        const effect = new GasRingEffect(scene, planet, config);

        effect.setVisible(false);
        // 1 occluder + 2 emitters = 3 setVisible(false) calls? 
        // Logic: occluder.setVisible, plus checking backElement/frontElement.
        expect(scene.add.graphics().setVisible).toHaveBeenCalledWith(false);

        // Emitters
        const emitters = (scene.add.particles as any).mock.results.map((r: any) => r.value);
        emitters.forEach((emitter: any) => {
            expect(emitter.setVisible).toHaveBeenCalledWith(false);
        });
    });

    it('should destroy elements', () => {
        const effect = new GasRingEffect(scene, planet, config);
        effect.destroy();

        expect(scene.add.graphics().destroy).toHaveBeenCalled();
        const emitters = (scene.add.particles as any).mock.results.map((r: any) => r.value);
        emitters.forEach((emitter: any) => {
            expect(emitter.destroy).toHaveBeenCalled();
        });
    });
});
