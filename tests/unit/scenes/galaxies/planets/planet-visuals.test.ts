import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanetVisuals } from '../../../../../src/scenes/galaxies/planets/planet-visuals';
import type { PlanetData } from '../../../../../src/scenes/galaxies/planets/planet-data';
import 'reflect-metadata';

// Mock Phaser
const mockText = {
    setOrigin: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    setDepth: vi.fn(),
    setVisible: vi.fn(),
    setAngle: vi.fn(),
    setScale: vi.fn(),
    setAlpha: vi.fn(),
    setText: vi.fn(),
    getData: vi.fn(),
    setData: vi.fn(),
    postFX: {
        addColorMatrix: vi.fn().mockReturnValue({
            saturate: vi.fn(),
            multiply: vi.fn(),
            reset: vi.fn()
        })
    },
    clearTint: vi.fn(),
    scene: {} // minimal scene ref
};

const mockScene = {
    add: {
        text: vi.fn().mockReturnValue(mockText),
        particles: vi.fn().mockReturnValue({
            startFollow: vi.fn(),
            setDepth: vi.fn(),
            setVisible: vi.fn(),
            setConfig: vi.fn(),
            destroy: vi.fn()
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

describe('PlanetVisuals', () => {
    let planetVisuals: PlanetVisuals;
    const mockPlanet: PlanetData = {
        id: 'p1',
        name: 'Planet 1',
        x: 100,
        y: 100,
        hidden: false,
        visualScale: 1
    };

    beforeEach(() => {
        vi.clearAllMocks();
        planetVisuals = new PlanetVisuals(mockScene as any);
        // Re-assign scene ref to mockText because PlanetVisual checks obj.scene
        mockText.scene = mockScene;
    });

    it('should create visuals for planets', () => {
        const onClick = vi.fn();
        planetVisuals.createVisuals([mockPlanet], 'galaxy1', onClick);

        expect(mockScene.add.text).toHaveBeenCalled();
        // Check if visuals map is populated (private, so we infer by behavior or just trust creation ran)
    });


    it('should boost sparkles if hidden but unlocked', () => {
        const hiddenPlanet = { ...mockPlanet, hidden: true, requiredVictories: 0 };
        const onClick = vi.fn();
        planetVisuals.createVisuals([hiddenPlanet], 'galaxy1', onClick);

        // We need to trigger updateVisibility to apply the boost
        planetVisuals.updateVisibility([hiddenPlanet]);

        // Access emitter mock
        // The particles mock is created in the global mockScene.add.particles
        // We can inspect the results of that mock function to get the returned emitter object
        const emitterMock = mockScene.add.particles.mock.results[0].value;

        expect(emitterMock.setConfig).toHaveBeenCalledWith(expect.objectContaining({
            color: [0xffffff],
            scale: { start: 0.5, end: 0 },
            frequency: 50
        }));
    });
});
