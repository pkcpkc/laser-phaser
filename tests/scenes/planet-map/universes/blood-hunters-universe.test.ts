import { describe, it, expect, vi } from 'vitest';
import { BloodHuntersUniverse } from '../../../../src/scenes/planet-map/universes/blood-hunters-universe';
// @ts-ignore
import Phaser from 'phaser';

// Mock Phaser Scene
const mockScene = new Phaser.Scene() as unknown as Phaser.Scene;

// Mock Phaser internals required by the universe
vi.mock('phaser', () => {
    return {
        default: {
            Math: {
                DegToRad: (deg: number) => deg * (Math.PI / 180),
                Distance: {
                    Between: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1)
                },
                FloatBetween: (min: number, max: number) => min + Math.random() * (max - min),
                Between: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
                Linear: (p0: number, p1: number, t: number) => p0 + (p1 - p0) * t,
                Clamp: (v: number, min: number, max: number) => Math.max(min, Math.min(max, v)),
                Vector3: class {
                    x = 0; y = 0; z = 0;
                    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
                    normalize() { return this; }
                    crossVectors() { return this; }
                    transformQuat() { return this; }
                    dot() { return 0; }
                    length() { return 1; }
                },
                Quaternion: class {
                    setAxisAngle() { return this; }
                },
            },
            GameObjects: {
                Particles: {
                    ParticleEmitter: class {
                        setDepth = vi.fn();
                        setVisible = vi.fn();
                        start = vi.fn();
                        stop = vi.fn();
                        destroy = vi.fn();
                        setAlpha = vi.fn();
                        setPosition = vi.fn();
                        emitParticle = vi.fn();
                    }
                },
                Text: class {
                    setOrigin = vi.fn().mockReturnThis();
                    setInteractive = vi.fn().mockReturnThis();
                    on = vi.fn();
                },
                Graphics: class {
                    setBlendMode = vi.fn();
                    clear = vi.fn();
                    lineStyle = vi.fn();
                    beginPath = vi.fn();
                    moveTo = vi.fn();
                    lineTo = vi.fn();
                    strokePath = vi.fn();
                    destroy = vi.fn();
                    setVisible = vi.fn();
                    setDepth = vi.fn();
                    fillStyle = vi.fn();
                    fillRect = vi.fn();
                    fillCircle = vi.fn();
                    arc = vi.fn();
                    strokeCircle = vi.fn();
                    closePath = vi.fn();
                    setAlpha = vi.fn();
                    setPosition = vi.fn();
                    setScale = vi.fn();
                },
                Container: class {
                    add = vi.fn();
                    setDepth = vi.fn();
                    setPosition = vi.fn();
                    setRotation = vi.fn();
                    setScale = vi.fn();
                    destroy = vi.fn();
                    setVisible = vi.fn();
                    setAlpha = vi.fn();
                    removeAll = vi.fn();
                },
                Image: class {
                    setTint = vi.fn();
                    setScale = vi.fn();
                    setDepth = vi.fn();
                    setBlendMode = vi.fn();
                    setVisible = vi.fn();
                    setAlpha = vi.fn();
                    setPosition = vi.fn();
                    setOrigin = vi.fn();
                    setAngle = vi.fn();
                    setRotation = vi.fn();
                    setData = vi.fn();
                    getData = vi.fn();
                }
            },
            Scene: class {
                add = {
                    text: vi.fn().mockReturnValue({
                        setOrigin: vi.fn().mockReturnThis(),
                        setInteractive: vi.fn().mockReturnThis(),
                        on: vi.fn(),
                        setPosition: vi.fn(),
                        setScale: vi.fn(),
                        setDepth: vi.fn(),
                        setAlpha: vi.fn(),
                        clearTint: vi.fn(),
                        setAngle: vi.fn(),
                        setVisible: vi.fn(),
                        postFX: {
                            addColorMatrix: vi.fn().mockReturnValue({
                                saturate: vi.fn(),
                                multiply: vi.fn()
                            }),
                            addBloom: vi.fn()
                        }
                    }),
                    particles: vi.fn().mockReturnValue({
                        startFollow: vi.fn(),
                        setDepth: vi.fn(),
                        setVisible: vi.fn(),
                        destroy: vi.fn(),
                        start: vi.fn(),
                        stop: vi.fn(),
                        active: true
                    }),
                    graphics: vi.fn().mockReturnValue({
                        setBlendMode: vi.fn(),
                        clear: vi.fn(),
                        lineStyle: vi.fn(),
                        beginPath: vi.fn(),
                        moveTo: vi.fn(),
                        lineTo: vi.fn(),
                        strokePath: vi.fn(),
                        destroy: vi.fn(),
                        setVisible: vi.fn(),
                        setDepth: vi.fn(),
                        fillStyle: vi.fn(),
                        fillRect: vi.fn(),
                        fillCircle: vi.fn(),
                        arc: vi.fn(),
                        strokeCircle: vi.fn(),
                        closePath: vi.fn(),
                        fillPath: vi.fn(),
                        setAlpha: vi.fn(),
                        setPosition: vi.fn(),
                        setScale: vi.fn()
                    }),
                    container: vi.fn().mockReturnValue({
                        add: vi.fn(),
                        setDepth: vi.fn(),
                        setPosition: vi.fn(),
                        setRotation: vi.fn(),
                        setScale: vi.fn(),
                        destroy: vi.fn(),
                        setVisible: vi.fn(),
                        setAlpha: vi.fn(),
                        removeAll: vi.fn()
                    }),
                    image: vi.fn().mockReturnValue({
                        setTint: vi.fn(),
                        setScale: vi.fn(),
                        setDepth: vi.fn(),
                        setBlendMode: vi.fn(),
                        setVisible: vi.fn(),
                        setAlpha: vi.fn(),
                        setPosition: vi.fn(),
                        setOrigin: vi.fn(),
                        setAngle: vi.fn(),
                        setRotation: vi.fn(),
                        setData: vi.fn(),
                        getData: vi.fn()
                    })
                };
                events = { on: vi.fn(), off: vi.fn() };
                time = { delayedCall: vi.fn(), addEvent: vi.fn() };
                textures = { exists: vi.fn().mockReturnValue(true) };
                tweens = {
                    add: vi.fn(),
                    addCounter: vi.fn().mockReturnValue({
                        setCallback: vi.fn(),
                        play: vi.fn()
                    })
                };
            },
            BlendModes: {
                ADD: 1
            }
        }
    };
});

describe('Blood Hunters Universe', () => {
    it('should return valid planet data', () => {
        const width = 800;
        const height = 600;
        const universe = new BloodHuntersUniverse();
        universe.init(mockScene, width, height);
        const planets = universe.getAll();

        expect(planets.length).toBeGreaterThan(0);

        const vortex = planets.find(p => p.id === 'vortex');
        expect(vortex).toBeDefined();
        // Vortex is positioned orbitally (not central), so check it's within bounds
        expect(vortex?.x).toBeGreaterThan(0);
        expect(vortex?.x).toBeLessThan(width);
        expect(vortex?.y).toBeGreaterThan(0);
        expect(vortex?.y).toBeLessThan(height);
        expect(vortex?.tint).toBe(0x880000);

        // Check effects
        expect(vortex?.effects).toBeDefined();
        expect(vortex?.effects!.length).toBe(1); // Hurricane
    });
});
