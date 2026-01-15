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


    it('should handle locked planets', () => {
        const lockedPlanet = { ...mockPlanet, requiredVictories: 5 };
        // Mock GameStatus to return 0 wins
        vi.mock('../../../../../src/logic/game-status', () => ({
            GameStatus: { getInstance: () => ({ getVictories: vi.fn().mockReturnValue(0) }) }
        }));

        planetVisuals.createVisuals([lockedPlanet], 'galaxy1', vi.fn());

        // Should create lock icon (text)
        expect(mockScene.add.text).toHaveBeenCalledWith(expect.anything(), expect.anything(), '🔒', expect.anything());
    });

    it('should handle hijacked planets depth', () => {
        const hijackedPlanet = { ...mockPlanet, isHijacked: true };
        planetVisuals.createVisuals([hijackedPlanet], 'galaxy1', vi.fn());

        // Depth should be 1 (hijacked) instead of 50
        expect(mockText.setDepth).toHaveBeenCalledWith(1);
    });

    it('should handle planet effects', () => {
        const effectMock = { setDepth: vi.fn(), setVisible: vi.fn(), update: vi.fn() };
        const effectPlanet = { ...mockPlanet, effects: [effectMock] };

        planetVisuals.createVisuals([effectPlanet as any], 'galaxy1', vi.fn());

        expect(effectMock.setDepth).toHaveBeenCalledWith(49); // PLANET_DEPTH - 1

        planetVisuals.update(0, 16);
        expect(effectMock.update).toHaveBeenCalled();
    });

    it('should cross-fade between frames using overlay', () => {
        const onClick = vi.fn();
        planetVisuals.createVisuals([mockPlanet], 'galaxy1', onClick);

        // First animation call sets setText
        // We need to trigger the second call to trigger overlay logic
        (planetVisuals as any).visuals.get('p1').animate();

        expect(mockScene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
            alpha: 0,
            duration: 400
        }));
    });

    it('should use standard hidden emitter config if locked', () => {
        const lockedHiddenPlanet = { ...mockPlanet, hidden: true, requiredVictories: 5 };
        // Mock GameStatus to return 0 wins
        vi.mock('../../../../../src/logic/game-status', () => ({
            GameStatus: { getInstance: () => ({ getVictories: vi.fn().mockReturnValue(0) }) }
        }));

        planetVisuals.createVisuals([lockedHiddenPlanet], 'galaxy1', vi.fn());
        planetVisuals.updateVisibility([lockedHiddenPlanet]);

        const emitterMock = mockScene.add.particles.mock.results[0].value;
        expect(emitterMock.setConfig).toHaveBeenCalledWith(expect.objectContaining({
            scale: { start: 0.3, end: 0 },
            frequency: 100
        }));
    });
});
