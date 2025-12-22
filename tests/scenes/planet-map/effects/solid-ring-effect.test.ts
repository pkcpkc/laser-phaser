import { describe, it, expect, vi, beforeEach } from 'vitest';
// @ts-ignore
import Phaser from 'phaser';
import { SolidRingEffect, type SolidRingConfig } from '../../../../src/scenes/planet-map/effects/solid-ring-effect';
import type { PlanetData } from '../../../../src/scenes/planet-map/planet-data';

vi.mock('phaser', () => {
    return {
        default: {
            Math: {
                DegToRad: (deg: number) => deg * (Math.PI / 180),
                RadToDeg: (rad: number) => rad * (180 / Math.PI),
                FloatBetween: () => 1.5,
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
                    graphics: vi.fn(),
                    particles: vi.fn(),
                    container: vi.fn(),
                    image: vi.fn(),
                };
                tweens = {
                    add: vi.fn(),
                    addCounter: vi.fn(),
                };
            }
        }
    }
});

describe('SolidRingEffect', () => {
    let scene: Phaser.Scene;
    let planet: PlanetData;
    let config: SolidRingConfig;

    beforeEach(() => {
        const createGraphics = () => ({
            fillStyle: vi.fn(),
            fillCircle: vi.fn(),
            setPosition: vi.fn(),
            setDepth: vi.fn(),
            setScale: vi.fn(),
            setVisible: vi.fn(),
            destroy: vi.fn(),
            clear: vi.fn(),
            lineStyle: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            strokePath: vi.fn(),
            active: true,
            alpha: 1,
        });

        scene = {
            add: {
                graphics: vi.fn().mockImplementation(createGraphics),
                particles: vi.fn(),
                container: vi.fn().mockReturnValue({
                    setDepth: vi.fn(),
                    setVisible: vi.fn(),
                    destroy: vi.fn(),
                    add: vi.fn(),
                    setPosition: vi.fn(),
                    active: true,
                }),
                image: vi.fn().mockReturnValue({
                    setTint: vi.fn(),
                    setBlendMode: vi.fn(),
                    setPosition: vi.fn(),
                    setRotation: vi.fn(),
                    setScale: vi.fn(),
                    setData: vi.fn(),
                    setAlpha: vi.fn(),
                    getData: vi.fn(),
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
            type: 'solid-ring',
            color: 0xff0000,
            angle: -30,
            rotation: true,
        };
    });

    it('should create back and front containers', () => {
        new SolidRingEffect(scene, planet, config);
        // Base occluder + many ring bands
        expect(scene.add.graphics).toHaveBeenCalled();
        // 2 containers
        expect(scene.add.container).toHaveBeenCalledTimes(2);
    });

    it('should toggle visibility', () => {
        const effect = new SolidRingEffect(scene, planet, config);

        effect.setVisible(false);

        // Base occluder
        // Containers...
        const containers = (scene.add.container as any).mock.results.map((r: any) => r.value);
        containers.forEach((container: any) => {
            expect(container.setVisible).toHaveBeenCalledWith(false);
        });
    });

    it('should destroy elements', () => {
        const effect = new SolidRingEffect(scene, planet, config);
        effect.destroy();

        const containers = (scene.add.container as any).mock.results.map((r: any) => r.value);
        containers.forEach((container: any) => {
            expect(container.destroy).toHaveBeenCalled();
        });
    });

    it('should update container positions', () => {
        const effect = new SolidRingEffect(scene, planet, config);

        // Move planet
        planet.x = 300;
        planet.y = 400;

        effect.update(0, 0);

        const containers = (scene.add.container as any).mock.results.map((r: any) => r.value);
        containers.forEach((container: any) => {
            expect(container.setPosition).toHaveBeenCalledWith(300, 400);
        });
    });
});
