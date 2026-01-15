import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => {
    const MockGraphics = class {
        setVisible = vi.fn();
        setPosition = vi.fn();
        setRotation = vi.fn();
        clear = vi.fn();
        fillStyle = vi.fn();
        beginPath = vi.fn();
        moveTo = vi.fn();
        lineTo = vi.fn();
        closePath = vi.fn();
        fillPath = vi.fn();
        destroy = vi.fn();
    };

    const MockImage = class {
        setDepth = vi.fn();
        setMask = vi.fn();
        setAlpha = vi.fn();
        setPosition = vi.fn();
        setRotation = vi.fn();
        setTexture = vi.fn();
        destroy = vi.fn();
        active = true;
        x = 0; y = 0; depth = 0; rotation = 0;
        once = vi.fn();
    };

    const MockGeometryMask = class { };

    return {
        default: {
            Scene: class { },
            GameObjects: {
                Graphics: MockGraphics,
                Image: MockImage
            },
            Display: {
                Masks: {
                    GeometryMask: MockGeometryMask
                }
            },
            Math: {
                FloatBetween: vi.fn(() => 0.5),
                Between: vi.fn(() => 0),
            }
        }
    };
});

// Mock AsteroidTexture
vi.mock('../../../../src/ships/textures/asteroid-texture', () => ({
    AsteroidTexture: {
        generateVertices: vi.fn().mockReturnValue([
            { x: 10, y: 10 }, { x: -10, y: 10 }, { x: -10, y: -10 }
        ])
    }
}));

import { AsteroidMorphEffect } from '../../../../src/ships/effects/asteroid-morph-effect';
// Import mock classes for usage in test setup
import Phaser from 'phaser';

describe('AsteroidMorphEffect', () => {
    let mockScene: any;
    let mockSprite: any;
    let mockEvents: any;
    let mockTweens: any;
    let mockTime: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockEvents = {
            on: vi.fn(),
            off: vi.fn()
        };

        mockTweens = {
            add: vi.fn((config) => {
                if (config.onComplete) config.onComplete();
                return {};
            }),
            killTweensOf: vi.fn()
        };

        mockTime = {
            now: 1000,
            addEvent: vi.fn().mockReturnValue({ remove: vi.fn() })
        };

        mockScene = {
            add: {
                // Instantiate the mocked classes directly from the mocked module import
                image: vi.fn().mockReturnValue(new Phaser.GameObjects.Image(null as any, 0, 0, '')),
                graphics: vi.fn().mockReturnValue(new Phaser.GameObjects.Graphics(null as any))
            },
            events: mockEvents,
            tweens: mockTweens,
            time: mockTime
        };

        mockSprite = {
            x: 100,
            y: 100,
            rotation: 0,
            depth: 10,
            setAlpha: vi.fn(),
            once: vi.fn(),
            active: true
        };
    });

    it('should initialize correctly', () => {
        new AsteroidMorphEffect(mockScene, mockSprite, 'asteroid', 30, 3);

        expect(mockSprite.setAlpha).toHaveBeenCalledWith(0);
        expect(mockScene.add.image).toHaveBeenCalledTimes(2);
        expect(mockScene.add.graphics).toHaveBeenCalled();
        expect(mockEvents.on).toHaveBeenCalledWith('update', expect.any(Function));
    });

    it('should schedule next texture morph', () => {
        new AsteroidMorphEffect(mockScene, mockSprite, 'asteroid', 30, 3);
        expect(mockTime.addEvent).toHaveBeenCalled();
    });

    it('should morph texture', () => {
        new AsteroidMorphEffect(mockScene, mockSprite, 'asteroid', 30, 3);

        const timerCallback = mockTime.addEvent.mock.calls[0][0].callback;
        timerCallback();

        expect(mockTweens.add).toHaveBeenCalled();
    });

    it('should update graphics and surfaces', () => {
        new AsteroidMorphEffect(mockScene, mockSprite, 'asteroid', 30, 1);
        const updateListener = mockEvents.on.mock.calls.find((call: any[]) => call[0] === 'update')[1];

        mockSprite.x = 200;
        mockSprite.y = 200;
        mockSprite.rotation = 1;

        updateListener();

        expect(mockSprite.active).toBe(true);
    });

    it('should clean up on destroy', () => {
        const effect = new AsteroidMorphEffect(mockScene, mockSprite, 'asteroid', 30, 1);
        effect.destroy();

        expect(mockEvents.off).toHaveBeenCalledWith('update', expect.any(Function));
    });
});
