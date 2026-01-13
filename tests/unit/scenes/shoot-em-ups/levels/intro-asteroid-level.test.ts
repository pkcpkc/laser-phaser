import { describe, it, expect, vi } from 'vitest';
import { IntroAsteroidLevel } from '../../../../../src/scenes/shoot-em-ups/levels/intro-asteroid-level';
import { DiamondFormation } from '../../../../../src/scenes/shoot-em-ups/formations/diamond-formation';

vi.mock('phaser', () => ({
    default: {
        Math: {
            PI: Math.PI
        },
        Physics: {
            Matter: {
                Image: class { }
            }
        },
        GameObjects: {
            Image: class { }
        }
    }
}));

describe('IntroAsteroidLevel', () => {
    it('should be defined', () => {
        expect(IntroAsteroidLevel).toBeDefined();
    });

    it('should have 7 waves', () => {
        expect(IntroAsteroidLevel.formations.length).toBe(7);
    });

    it('should use DiamondFormation for all waves', () => {
        IntroAsteroidLevel.formations.forEach(wave => {
            wave.forEach(formation => {
                expect(formation.formationType).toBe(DiamondFormation);
            });
        });
    });

    it('should configure wave 1 (warmup) correctly', () => {
        const wave = IntroAsteroidLevel.formations[0];
        expect(wave).toHaveLength(1);
        expect(wave[0].config?.shipFormationGrid).toBeDefined();
        expect(wave[0].config?.shipFormationGrid).toHaveLength(1);
        expect(wave[0].formationType).toBe(DiamondFormation);
    });

    it('should configure wave 7 (chaos) correctly', () => {
        const wave = IntroAsteroidLevel.formations[6];
        expect(wave).toHaveLength(35);
        expect(wave[0].formationType).toBe(DiamondFormation);
        expect(wave[0].startDelay).toBe(600);
    });

    it('should decrease start delay for later waves', () => {
        const delays = IntroAsteroidLevel.formations.slice(3).map(wave => wave[0].startDelay);
        expect(delays).toEqual([1500, 1200, 900, 600]);
    });
});
