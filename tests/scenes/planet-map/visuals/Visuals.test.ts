import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanetVisuals } from '../../../../src/scenes/planet-map/planet-visuals';
import type { PlanetData } from '../../../../src/scenes/planet-map/planet-data';
// @ts-ignore
import Phaser from 'phaser';

// Mock Visual classes to spy on them?
// Or mock the scene they depend on.
// Let's test PlanetVisuals manager logic primarily for delegation.

vi.mock('phaser', () => {
    const mockColorMatrix = {
        saturate: vi.fn().mockReturnThis(),
        multiply: vi.fn().mockReturnThis(),
    };

    const MockTextClass = class {
        setInteractive = vi.fn().mockReturnThis();
        on = vi.fn().mockReturnThis();
        setOrigin = vi.fn().mockReturnThis();
        setScale = vi.fn().mockReturnThis();
        setTint = vi.fn().mockReturnThis();
        setAngle = vi.fn().mockReturnThis();
        setText = vi.fn().mockReturnThis();
        setAlpha = vi.fn().mockReturnThis();
        setPosition = vi.fn().mockReturnThis();
        setDepth = vi.fn().mockReturnThis();
        clearTint = vi.fn().mockReturnThis();
        postFX = {
            clear: vi.fn(),
            addColorMatrix: vi.fn().mockReturnValue(mockColorMatrix),
        };
    };

    return {
        default: {
            Math: {
                DegToRad: (deg: number) => deg * (Math.PI / 180),
                FloatBetween: (min: number, max: number) => min + (max - min) * 0.5,
                Distance: {
                    Between: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1)
                }
            },
            GameObjects: {
                Particles: {
                    ParticleEmitter: class { }
                },
                Text: MockTextClass,
                Image: class { },
                Container: class { }
            }
        }
    }
});

describe('PlanetVisuals', () => {
    let visualsManager: PlanetVisuals;
    let mockGameObject: any;
    let mockScene: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Instantiate the mocked class
        // @ts-ignore
        mockGameObject = new Phaser.GameObjects.Text(mockScene as any, 0, 0, '', {});

        mockScene = {
            add: {
                text: vi.fn().mockReturnValue(mockGameObject),
                image: vi.fn().mockReturnValue(mockGameObject),
                particles: vi.fn().mockReturnValue({
                    startFollow: vi.fn(),
                    setDepth: vi.fn()
                })
            },
            time: {
                addEvent: vi.fn()
            },
            tweens: {
                add: vi.fn(),
                killTweensOf: vi.fn()
            }
        };

        // @ts-ignore
        visualsManager = new PlanetVisuals(mockScene as unknown as Phaser.Scene);
    });



    it('should create RingWorldVisual for ring-world id', () => {
        const planets: PlanetData[] = [{
            id: 'ring-world', x: 0, y: 0, name: 'Ring', hidden: false
        }];
        visualsManager.createVisuals(planets, () => { });
        expect(mockScene.add.text).toHaveBeenCalled();
    });

    it('should update visual content on reveal', () => {
        const planet: PlanetData = {
            id: 'ring-world', x: 0, y: 0, name: 'Ring', hidden: true,
            gameObject: mockGameObject as unknown as Phaser.GameObjects.Text
        };
        const planets = [planet];

        visualsManager.createVisuals(planets, () => { });

        // Simulating reveal
        planet.hidden = false;
        visualsManager.updateVisibility(planets);

        expect((planet.gameObject as any).setText).toHaveBeenCalled();
    });

    it('should update visibility', () => {
        const planet: PlanetData = {
            id: 'earth', x: 0, y: 0, name: 'Earth', hidden: false,
            gameObject: mockGameObject as unknown as Phaser.GameObjects.Text
        };
        const planets = [planet];

        // Register it
        visualsManager.createVisuals(planets, () => { });

        // Update
        visualsManager.updateVisibility(planets);
        expect(planet.gameObject!.setAlpha).toHaveBeenCalledWith(1);
    });
});
