import { describe, it, expect, vi } from 'vitest';
import GalaxyScene from '../../../../src/scenes/galaxies/galaxy-scene';

// Mock Phaser by default as many files depend on it
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            GameObjects: {
                Image: class {
                    setOrigin = vi.fn();
                    setDepth = vi.fn();
                    setScale = vi.fn();
                    setVisible = vi.fn();
                },
                Container: class {
                    add = vi.fn();
                    setDepth = vi.fn();
                    setPosition = vi.fn();
                },
                Sprite: class {
                    play = vi.fn();
                    setOrigin = vi.fn();
                }
            },
            Math: {
                Vector2: class {
                    x = 0;
                    y = 0;
                    constructor(x = 0, y = 0) {
                        this.x = x;
                        this.y = y;
                    }
                    normalize() { return this; }
                    scale() { return this; }
                },
                Between: vi.fn(),
                FloatBetween: vi.fn(),
                RadToDeg: vi.fn(),
                DegToRad: vi.fn(),
                Angle: {
                    Between: vi.fn()
                }
            }
        }
    };
});


describe('GalaxyScene', () => {
    it('is defined', () => {
        expect(GalaxyScene).toBeDefined();
    });

    it('should set ship depth to 1000 in createPlayerShip', () => {
        const scene = new GalaxyScene();
        const mockImage = {
            setScale: vi.fn().mockReturnThis(),
            setAngle: vi.fn().mockReturnThis(),
            setOrigin: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
            setPosition: vi.fn().mockReturnThis(),
            visible: true,
            active: true,
            alpha: 1
        };

        // @ts-ignore - access private method for testing
        scene.add = {
            image: vi.fn().mockReturnValue(mockImage)
        };

        // @ts-ignore
        scene.createPlayerShip();

        expect(mockImage.setDepth).toHaveBeenCalledWith(1000);
    });
});
