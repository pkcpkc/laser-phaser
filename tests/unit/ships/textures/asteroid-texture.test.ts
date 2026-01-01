import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AsteroidTexture } from '../../../../src/ships/textures/asteroid-texture';

// Mock Phaser to avoid Canvas/Device initialization and provide Geom mocks
vi.mock('phaser', () => {
    return {
        default: {
            Geom: {
                Point: class {
                    x: number;
                    y: number;
                    constructor(x: number, y: number) {
                        this.x = x;
                        this.y = y;
                    }
                },
                Polygon: class {
                    points: any[];
                    constructor(points: any[]) {
                        this.points = points;
                    }
                    contains(_x: number, _y: number) {
                        return true; // Always return true for testing to ensure drawing calls happen
                    }
                }
            },
            Math: {
                Between: (min: number, _max: number) => min
            }
        }
    }
});

describe('AsteroidTexture', () => {
    let sceneMock: any;

    beforeEach(() => {
        sceneMock = {
            textures: {
                exists: vi.fn().mockReturnValue(false)
            },
            add: {
                graphics: vi.fn().mockReturnValue({
                    fillStyle: vi.fn(),
                    lineStyle: vi.fn(),
                    beginPath: vi.fn(),
                    moveTo: vi.fn(),
                    lineTo: vi.fn(),
                    closePath: vi.fn(),
                    fillPath: vi.fn(),
                    strokePath: vi.fn(),
                    fillRect: vi.fn(),
                    fillEllipse: vi.fn(),
                    fillCircle: vi.fn(),
                    strokePoints: vi.fn(),
                    generateTexture: vi.fn(),
                    destroy: vi.fn()
                })
            }
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('generateVertices should return vertices', () => {
        const vertices = AsteroidTexture.generateVertices(10, 8);
        expect(vertices.length).toBe(8);
        expect(vertices[0]).toHaveProperty('x');
        expect(vertices[0]).toHaveProperty('y');
    });

    it('create should generate a texture if it does not exist', () => {
        AsteroidTexture.create(sceneMock, 'test-texture', 10, {
            fill: 0x000000,
            stroke: 0x000000,
            fissure: 0x000000,
            highlight: 0x000000
        });

        expect(sceneMock.textures.exists).toHaveBeenCalledWith('test-texture');
        expect(sceneMock.add.graphics).toHaveBeenCalled();
        // Since we mocked Polygon.contains to true, drawing should happen
        expect(sceneMock.add.graphics().fillRect).toHaveBeenCalled();
    });

    it('create should skip if texture exists', () => {
        sceneMock.textures.exists.mockReturnValue(true);
        AsteroidTexture.create(sceneMock, 'test-texture', 10, {
            fill: 0, stroke: 0, fissure: 0, highlight: 0
        });
        expect(sceneMock.add.graphics).not.toHaveBeenCalled();
    });

    it('generateSurface should generate a surface texture', () => {
        AsteroidTexture.generateSurface(sceneMock, 'surface-texture', 50, {
            fill: 0, stroke: 0, fissure: 0, highlight: 0
        });
        expect(sceneMock.add.graphics).toHaveBeenCalled();
    });
});
