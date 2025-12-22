
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RectanglesEffect } from '../../../../src/scenes/planet-map/effects/rectangles-effect';
import type { PlanetData } from '../../../../src/scenes/planet-map/planet-data';
vi.mock('phaser', () => {
    return {
        default: {
            Math: {
                FloatBetween: (min: number, _max: number) => min, // Return min to be within range
                Clamp: (val: number, min: number, max: number) => Math.min(Math.max(val, min), max),
                Vector3: class {
                    x = 0; y = 0; z = 0;
                    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
                    normalize() { return this; }
                    dot() { return 0; }
                    cross() { return this; }
                    copy(v: any) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
                    clone() { return new (this.constructor as any)(this.x, this.y, this.z); }
                    scale() { return this; }
                    add() { return this; }
                    transformQuat() { return this; }
                    set(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; return this; }
                },
                Quaternion: class {
                    setAxisAngle() { }
                }
            },
            GameObjects: {
                Graphics: class {
                    clear = vi.fn();
                    lineStyle = vi.fn();
                    fillStyle = vi.fn();
                    lineBetween = vi.fn();
                    fillPath = vi.fn();
                    fillPoints = vi.fn();
                    beginPath = vi.fn();
                    closePath = vi.fn();
                    moveTo = vi.fn();
                    lineTo = vi.fn();
                    setDepth = vi.fn();
                    setVisible = vi.fn();
                    destroy = vi.fn();
                    fillCircle = vi.fn();
                }
            }
        }
    }
});

class TestRectanglesEffect extends RectanglesEffect {
    // Expose for testing
    public testCalculateLighting(nx: number, ny: number, nz: number) {
        return super.calculateLighting(nx, ny, nz);
    }
    // Override to force shadow for checking lights
    protected calculateLighting(_nx: number, _ny: number, _nz: number): number {
        return 0; // Force full shadow
    }
}

describe('RectanglesEffect', () => {
    let scene: Phaser.Scene;
    let planet: PlanetData;
    let mockGraphics: any;

    beforeEach(() => {
        mockGraphics = {
            clear: vi.fn(),
            lineStyle: vi.fn(),
            fillStyle: vi.fn(),
            lineBetween: vi.fn(),
            fillPath: vi.fn(),
            fillPoints: vi.fn(),
            beginPath: vi.fn(),
            closePath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            setDepth: vi.fn(),
            setVisible: vi.fn(),
            destroy: vi.fn(),
            fillCircle: vi.fn()
        };

        scene = {
            add: {
                graphics: vi.fn(() => mockGraphics)
            },
            events: {
                on: vi.fn(),
                off: vi.fn()
            },
            time: {
                now: 1000
            }
        } as unknown as Phaser.Scene;

        planet = {
            id: 'test-planet',
            x: 100,
            y: 100,
            name: 'Test',
            hidden: false, // Effects need planet to be visible
            visualScale: 1.0,
            gameObject: {
                setPosition: vi.fn(),
            } as any
        } as PlanetData;

        // Ensure visible items (z > 0.5)
        // z = 2*v - 1. If v=0.9, z=0.8.
        vi.spyOn(Math, 'random').mockReturnValue(0.9);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create valid rectangles with correct properties', () => {
        // We need to access protected members for verification, so we cast to any or use a test subclass
        const effect = new RectanglesEffect(scene, planet, {
            type: 'rectangles',
            rectCount: 10,
            color: 0xff0000,
            minSize: 5,
            maxSize: 10
        });

        // @ts-ignore
        expect(effect.items.length).toBe(10);
        // @ts-ignore
        const item = effect.items[0];

        expect(item.width).toBeGreaterThanOrEqual(5);
        expect(item.width).toBeLessThanOrEqual(10);
        expect(item.height).toBeGreaterThanOrEqual(5);
        expect(item.height).toBeLessThanOrEqual(10);
        expect(item.color).toBe(0xff0000);
        expect(item.angle).toBeDefined();
    });

    it('should draw rectangles using graphics', () => {
        const effect = new RectanglesEffect(scene, planet, {
            type: 'rectangles',
            rectCount: 5
        });

        // Trigger update to call draw
        // @ts-ignore
        effect.onUpdate();

        // Should call fillPath or fillPoints
        // Note: Our implementation calls fillPath
        expect(mockGraphics.fillPath).toHaveBeenCalled();
        expect(mockGraphics.fillStyle).toHaveBeenCalled();
    });

    it('should draw city lights at corners when in shadow', () => {
        const effect = new TestRectanglesEffect(scene, planet, {
            type: 'rectangles',
            rectCount: 1,
            lightsColor: 0xffff00
        });

        // Trigger update
        // @ts-ignore
        effect.onUpdate();

        // Should draw corners (4 corners per rect)
        // fillCircle called 4 times?
        expect(mockGraphics.fillCircle).toHaveBeenCalled();
        // Should use lightsColor
        expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0xffff00, expect.any(Number));
    });

    it('should generate items when cluster mode is enabled', () => {
        const effect = new RectanglesEffect(scene, planet, {
            type: 'rectangles',
            rectCount: 20,
            clusterCount: 2
        });

        // @ts-ignore
        expect(effect.items.length).toBe(20);
        // We can't easily test distribution without advanced math checks, 
        // but we can ensure it runs without error and generates items.
    });
});
