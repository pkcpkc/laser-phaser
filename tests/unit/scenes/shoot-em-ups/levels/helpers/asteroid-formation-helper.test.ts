import { describe, it, expect, vi } from 'vitest';
import { getAsteroidConfig, createAsteroidWave } from '../../../../../../src/scenes/shoot-em-ups/levels/helpers/asteroid-formation-helper';
import { SmallAsteroidDustConfig } from '../../../../../../src/ships/configurations/asteroid-small-dust';
import { MediumAsteroidDustConfig } from '../../../../../../src/ships/configurations/asteroid-medium-dust';
import { LargeAsteroidDustConfig } from '../../../../../../src/ships/configurations/asteroid-large-dust';
import { DiamondFormation } from '../../../../../../src/scenes/shoot-em-ups/formations/diamond-formation';
import { PathTactic } from '../../../../../../src/scenes/shoot-em-ups/tactics/path-tactic';

vi.mock('phaser', () => ({
    default: {
        Scene: class { },
        Physics: { Matter: { Image: class { }, Sprite: class { } } },
        GameObjects: { Image: class { }, Text: class { }, Sprite: class { } },
        Math: { Between: vi.fn(), Vector2: class { } },
        Structs: { Size: class { } }
    }
}));

describe('AsteroidFormationHelper', () => {
    describe('getAsteroidConfig', () => {
        it('should return small asteroid', () => {
            // weights: small: 1, so random < 1 is always true
            const config = getAsteroidConfig({ small: 1, medium: 0, large: 0 });
            expect(config).toBe(SmallAsteroidDustConfig);
        });

        it('should return medium asteroid', () => {
            const config = getAsteroidConfig({ small: 0, medium: 1, large: 0 });
            expect(config).toBe(MediumAsteroidDustConfig);
        });

        it('should return large asteroid', () => {
            const config = getAsteroidConfig({ small: 0, medium: 0, large: 1 });
            expect(config).toBe(LargeAsteroidDustConfig);
        });
    });

    describe('createAsteroidWave', () => {
        it('should create correct number of formations', () => {
            const wave = createAsteroidWave(3, 0, 0.8, { small: 0.5, medium: 0.3, large: 0.2 });
            expect(wave.length).toBe(3);
        });

        it('should set proper configuration for each asteroid', () => {
            const wave = createAsteroidWave(2, 100, 0.8, { small: 1, medium: 0, large: 0 }, 50, 60);

            expect(wave[0].tacticType).toBe(PathTactic);
            expect(wave[0].tacticConfig).toEqual({ points: [], faceMovement: false });
            expect(wave[0].formationType).toBe(DiamondFormation);
            expect(wave[0].startDelay).toBe(100);
            expect(wave[0].config?.shipFormationGrid).toEqual([[SmallAsteroidDustConfig]]);

            // Check delay progression
            expect(wave[1].startDelay).toBeGreaterThanOrEqual(150);
            expect(wave[1].startDelay).toBeLessThanOrEqual(160);
        });

        it('should position asteroids within spawn width', () => {
            const wave = createAsteroidWave(10, 0, 0.5, { small: 1, medium: 0, large: 0 });
            wave.forEach(w => {
                const xPos = w.config?.startWidthPercentage;
                expect(xPos).toBeGreaterThanOrEqual(0.25);
                expect(xPos).toBeLessThanOrEqual(0.75);
            });
        });
    });
});
