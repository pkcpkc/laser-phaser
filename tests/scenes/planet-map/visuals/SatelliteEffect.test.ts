import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SatelliteEffect } from '../../../../src/scenes/planet-map/visuals/satellite-effect';
// @ts-ignore
import Phaser from 'phaser';

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Math: {
                FloatBetween: (min: number, _max: number) => min, // Deterministic for testing: return min
                Linear: (p0: number, p1: number, t: number) => p0 + (p1 - p0) * t,
                Between: (min: number, _max: number) => min,
            },
            BlendModes: { ADD: 1 },
            GameObjects: {
                Image: class {
                    setScale = vi.fn();
                    setTint = vi.fn();
                    setBlendMode = vi.fn();
                    setPosition = vi.fn();
                    setDepth = vi.fn();
                    setAlpha = vi.fn();
                    setVisible = vi.fn();
                    destroy = vi.fn();
                },
                Graphics: class {
                    fillStyle = vi.fn();
                    fillCircle = vi.fn();
                    generateTexture = vi.fn();
                    destroy = vi.fn();
                    setBlendMode = vi.fn();
                    clear = vi.fn();
                    lineStyle = vi.fn();
                    beginPath = vi.fn();
                    moveTo = vi.fn();
                    lineTo = vi.fn();
                    strokePath = vi.fn();
                    setDepth = vi.fn();
                    setVisible = vi.fn();
                }
            },
            Scene: class {
                make = {
                    graphics: vi.fn().mockReturnValue(new (class {
                        fillStyle = vi.fn();
                        fillCircle = vi.fn();
                        generateTexture = vi.fn();
                        destroy = vi.fn();
                    })())
                };
                add = {
                    graphics: vi.fn().mockImplementation(() => new (class {
                        setBlendMode = vi.fn();
                        clear = vi.fn();
                        lineStyle = vi.fn();
                        beginPath = vi.fn();
                        moveTo = vi.fn();
                        lineTo = vi.fn();
                        strokePath = vi.fn();
                        setDepth = vi.fn();
                        destroy = vi.fn();
                        setVisible = vi.fn();
                    })()),
                    image: vi.fn().mockImplementation(() => new (class {
                        setScale = vi.fn();
                        setTint = vi.fn();
                        setBlendMode = vi.fn();
                        setPosition = vi.fn();
                        setDepth = vi.fn();
                        setAlpha = vi.fn();
                        destroy = vi.fn();
                        setVisible = vi.fn();
                    })())
                };
                textures = { exists: vi.fn().mockReturnValue(true) };
                events = { on: vi.fn(), off: vi.fn() };
            }
        }
    }
});

describe('SatelliteEffect', () => {
    let scene: any;
    let planetData: any;

    beforeEach(() => {
        scene = new Phaser.Scene();
        planetData = {
            id: 'test-planet',
            x: 100,
            y: 100,
            name: 'Test',
            visualScale: 1.0
        };
    });

    it('should initialize with reduced default config', () => {
        const effect = new SatelliteEffect(scene, planetData);
        // We can't easily inspect private properties, but we can verify it doesn't crash
        expect(effect).toBeDefined();
    });

    it('should scale orbit radius by visualScale', () => {
        // planet visualScale = 2.0
        planetData.visualScale = 2.0;

        // Mock FloatBetween to capture the calls
        const floatBetweenSpy = vi.spyOn(Phaser.Math, 'FloatBetween');

        new SatelliteEffect(scene, planetData);

        // DEFAULT_CONFIG.minOrbitRadius is now 28.
        // With scale 2.0, it should request a random between 48 and 64 (32 * 2).
        // The first call to FloatBetween in createSatellites is for orbitRadius.
        // calls: [minRadius * scale, maxRadius * scale]

        expect(floatBetweenSpy).toHaveBeenCalled();

        // Check if any call matches expected scaled values
        // We look for calls with roughly 48 and 64
        const calls = floatBetweenSpy.mock.calls;
        const radiusCall = calls.find(call => call[0] === 24 * 2.0 && call[1] === 32 * 2.0);

        expect(radiusCall).toBeDefined();
    });
});
