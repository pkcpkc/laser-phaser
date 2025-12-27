import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SpikesEffect } from '../../../../src/scenes/planet-map/effects/spikes-effect';
import type { PlanetData } from '../../../../src/scenes/planet-map/planet-data';
// @ts-ignore
import Phaser from 'phaser';

vi.mock('phaser', () => {
    return {
        default: {
            Math: {
                FloatBetween: (min: number, max: number) => min + Math.random() * (max - min),
                Vector3: class {
                    x = 0; y = 0; z = 0;
                    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
                    normalize() { return this; }
                    set(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; return this; }
                    crossVectors() { return this; }
                    transformQuat() { return this; }
                    clone() { return new (this.constructor as any)(this.x, this.y, this.z); }
                    scale() { return this; }
                    copy() { return this; }
                    add() { return this; }
                },
                Quaternion: class {
                    setAxisAngle() { return this; }
                },
            },
            Curves: {
                Path: class {
                    lineTo = vi.fn();
                    closePath = vi.fn();
                    draw = vi.fn();
                }
            }
        }
    }
});

describe('SpikesEffect', () => {
    let effect: SpikesEffect;
    let mockScene: any;
    let planetData: PlanetData;
    let mockGraphics: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockGraphics = {
            clear: vi.fn(),
            setDepth: vi.fn(),
            setVisible: vi.fn(),
            lineStyle: vi.fn(),
            lineBetween: vi.fn(),
            destroy: vi.fn()
        };

        mockScene = {
            events: {
                on: vi.fn(),
                off: vi.fn()
            },
            add: {
                graphics: vi.fn().mockReturnValue(mockGraphics)
            },
            time: {
                now: 1000
            }
        };

        planetData = {
            id: 'test-planet',
            x: 100,
            y: 100,
            name: 'Test Planet',
            hidden: false, // Effects need planet to be visible
            visualScale: 1.0,
            effects: [],
            gameObject: { x: 100, y: 100 } as any
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create items based on config', () => {
        effect = new SpikesEffect(mockScene, planetData, { type: 'spikes', buildingCount: 10 });

        // Access protected items via any
        const items = (effect as any).items;
        expect(items.length).toBe(10);
        expect(items[0].height).toBeDefined();
    });

    it('should draw items on update', () => {
        effect = new SpikesEffect(mockScene, planetData, { type: 'spikes', buildingCount: 5 });

        const updateCallback = mockScene.events.on.mock.calls.find((call: any[]) => call[0] === 'update')[1];
        expect(updateCallback).toBeDefined();

        updateCallback();

        // Force items to be on the "front" so they are drawn (z > 0.35)
        const items = (effect as any).items;
        items.forEach((item: any) => item.position.z = 1);

        // Call update again or just call draw manually? 
        // The updateCallback calls update() which calls draw().
        // We need to set positions BEFORE update.
        updateCallback();

        expect(mockGraphics.clear).toHaveBeenCalled();
        expect(mockGraphics.lineBetween).toHaveBeenCalled();
    });

    it('should clean up on destroy', () => {
        effect = new SpikesEffect(mockScene, planetData, { type: 'spikes' });
        effect.destroy();

        expect(mockScene.events.off).toHaveBeenCalledWith('update', expect.any(Function));
        expect(mockGraphics.destroy).toHaveBeenCalled();
    });
});
