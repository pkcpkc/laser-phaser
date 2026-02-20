import { describe, it, expect, vi } from 'vitest';
import { AsteroidLevel } from '../../../../../src/scenes/shoot-em-ups/levels/asteroid-level';
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

describe('AsteroidLevel', () => {
    it('should be defined', () => {
        expect(AsteroidLevel).toBeDefined();
    });

    it('should have 6 waves', () => {
        expect(AsteroidLevel.formations.length).toBe(6);
    });

    it('should use DiamondFormation for all waves', () => {
        AsteroidLevel.formations.forEach(wave => {
            wave.forEach(formation => {
                expect(formation.formationType).toBe(DiamondFormation);
            });
        });
    });

    it('should configure wave 1 (warmup) correctly', () => {
        const wave = AsteroidLevel.formations[0];
        expect(wave).toHaveLength(1);
        expect(wave[0].config?.shipFormationGrid).toBeDefined();
        expect(wave[0].config?.shipFormationGrid).toHaveLength(1);
        expect(wave[0].formationType).toBe(DiamondFormation);
    });

    it('should decrease start delay for later waves', () => {
        const delays = AsteroidLevel.formations.slice(3).map(wave => wave[0].startDelay);
        expect(delays).toEqual([1500, 1200, 900]);
    });
});
