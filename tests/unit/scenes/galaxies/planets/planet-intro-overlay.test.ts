
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanetIntroOverlay } from '../../../../../src/scenes/galaxies/planets/planet-intro-overlay';
import { type PlanetData } from '../../../../../src/scenes/galaxies/planets/planet-data';

// Mock Phaser
const mockGameObject = {
    setOrigin: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    setVisible: vi.fn(function (this: any, v: boolean) { this.visible = v; return this; }),
    setDepth: vi.fn().mockReturnThis(),
    setAlpha: vi.fn(function (this: any, v: number) { this.alpha = v; return this; }),
    setText: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
    setSize: vi.fn().mockReturnThis(),
    setRotation: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
    scale: 1,
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    active: true,
    destroy: vi.fn(),
    input: { enabled: true },
    setScrollFactor: vi.fn().mockReturnThis(),
    scrollFactorX: 0
};

const mockContainer = {
    ...mockGameObject,
    add: vi.fn(),
    removeAll: vi.fn(),
    sort: vi.fn(),
    getAt: vi.fn()
};

const mockScene = {
    add: {
        rectangle: vi.fn(() => ({ ...mockGameObject })),
        container: vi.fn(() => ({ ...mockContainer })),
        text: vi.fn(() => ({ ...mockGameObject, width: 20 })),
        existing: vi.fn()
    },
    scale: {
        width: 800,
        height: 600,
        on: vi.fn()
    },
    cameras: {
        main: {
            scrollX: 0,
            scrollY: 0
        }
    },
    tweens: {
        add: vi.fn(),
        killTweensOf: vi.fn()
    },
    input: {
        on: vi.fn(),
        off: vi.fn(),
        keyboard: {
            on: vi.fn(),
            off: vi.fn()
        }
    },
    time: {
        addEvent: vi.fn(() => ({ remove: vi.fn() })),
        delayedCall: vi.fn((_delay: number, callback: () => void) => callback()) // Execute immediately in tests
    },
    events: {
        on: vi.fn(),
        off: vi.fn()
    }
};

vi.mock('phaser', () => {
    return {
        default: {
            GameObjects: {
                Container: class {
                    scene: any;
                    constructor(scene: any) {
                        this.scene = scene;
                        Object.assign(this, mockContainer);
                    }
                    add = mockContainer.add;
                    removeAll = mockContainer.removeAll;
                    sort = mockContainer.sort;
                    getAt = mockContainer.getAt;
                    setVisible = mockContainer.setVisible;
                    setDepth = mockContainer.setDepth;
                    setAlpha = mockContainer.setAlpha;
                    setScrollFactor = mockGameObject.setScrollFactor;
                    on = mockContainer.on;
                    off = mockContainer.off;
                },
                Rectangle: class { },
                Text: class { },
                GameObject: class { }
            },
            Scene: class { }
        }
    };
});

describe('PlanetIntroOverlay', () => {
    let overlay: PlanetIntroOverlay;
    let scene: any;

    beforeEach(() => {
        scene = mockScene;
        overlay = new PlanetIntroOverlay(scene as any);
    });

    it('should create visuals on init', () => {
        expect(scene.add.rectangle).toHaveBeenCalled();
        expect(scene.add.container).toHaveBeenCalled(); // planetContainer
        expect(scene.add.text).toHaveBeenCalledTimes(2); // textContainer + promptText
        const promptTextCall = scene.add.text.mock.calls[1]; // 2nd call is prompt
        expect(promptTextCall[2]).toBe("Press FIRE");
        expect(promptTextCall[3].fontSize).toBe("22px");

        expect(scene.scale.on).toHaveBeenCalledWith('resize', expect.any(Function), expect.any(Object));
        expect(scene.events.on).toHaveBeenCalledWith('postupdate', expect.any(Function), expect.any(Object));
    });

    it('show should setup visuals and start animation', () => {
        const planet: PlanetData = {
            id: 'test',
            name: 'Test Planet',
            x: 100,
            y: 100,
            gameObject: { ...mockGameObject } as any
        };

        const onComplete = vi.fn();
        overlay.show(planet, 'Hello World', onComplete);

        // Visibility
        expect(overlay.visible).toBe(true);
        expect(overlay.alpha).toBe(1);

        // Tweens (Bg, Planet, Visuals, Name)
        // We expect multiple tweens: BG Fade, Planet Move, Sync update, etc.
        expect(scene.tweens.add).toHaveBeenCalled();

        // Verify Fixes
        expect(overlay.setScrollFactor).toHaveBeenCalledWith(0);
        expect((overlay as any).textContainer.setScrollFactor).toHaveBeenCalledWith(0);
        expect((overlay as any).textContainer.setAlpha).toHaveBeenCalledWith(1);
    });

    it('hide should reverse animation and restore visuals', () => {
        // Setup Show first
        const planet: PlanetData = {
            id: 'test',
            name: 'Test Planet',
            x: 100,
            y: 100,
            gameObject: { ...mockGameObject } as any
        };
        const onComplete = vi.fn();
        overlay.show(planet, 'Hello World', onComplete);

        // Mock borrowed state
        (overlay as any).borrowedPlanet = planet;

        // Trigger Hide (via private method access or simulating input)
        // Accessing private method for test convenience or simulate input
        (overlay as any).hide();

        expect(scene.input.keyboard.off).toHaveBeenCalledWith('keydown-SPACE', expect.any(Function), expect.any(Object));

        // Should trigger reverse tweens
        expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('should elevate effect depth on show and restore on hide', () => {
        // Mock Effect
        const mockEffect = {
            setDepth: vi.fn(),
            update: vi.fn(),
            destroy: vi.fn(),
            setVisible: vi.fn()
        };

        const planet: PlanetData = {
            id: 'test',
            name: 'Test Planet',
            x: 100,
            y: 100,
            gameObject: { ...mockGameObject } as any,
            effects: [mockEffect] as any
        };

        const onComplete = vi.fn();

        // SHOW
        overlay.show(planet, 'Hello World', onComplete);
        expect(mockEffect.setDepth).toHaveBeenCalledWith(0);

        // HIDE
        (overlay as any).hide();

        // Wait for hide tween to complete logic?
        // Since hide() creates a Tween, we need to verify what happens onComplete of the tween.
        // We can simulate tween completion by calling the onComplete callback passed to tween.add
        // But since we mock tween.add, we need to capture the callback.

        // Capture Hide Tween
        // hide() makes tweens. show() also makes tweens. We want the LAST one (from hide).
        const tweenCalls = scene.tweens.add.mock.calls.filter((call: any) => call[0].targets === planet);
        const tweenCall = tweenCalls.pop(); // Get the last one
        expect(tweenCall).toBeDefined();

        const config = tweenCall[0];
        // Trigger complete
        config.onComplete();

        // RESTORE
        expect(mockEffect.setDepth).toHaveBeenCalledWith(2);
    });
});
