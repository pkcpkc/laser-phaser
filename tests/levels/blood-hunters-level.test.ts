import { describe, it, expect, vi } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            Physics: {
                Matter: {
                    Image: class { }
                }
            }
        }
    };
});

import { BloodHuntersLevel } from '../../src/levels/blood-hunters-level';
import { SinusFormation, DiamondFormation } from '../../src/formations/index.ts';
import { BloodHunter2L } from '../../src/ships/configurations/blood-hunter-2l';
import { BloodFighter2L } from '../../src/ships/configurations/blood-fighter-2l';

describe('BloodHuntersLevel', () => {
    it('should have correct name', () => {
        expect(BloodHuntersLevel.name).toBe('Blood Hunters');
    });

    it('should have valid formations', () => {
        expect(BloodHuntersLevel.formations).toHaveLength(5);

        const formation1 = BloodHuntersLevel.formations[0];
        expect(formation1[0].formationType).toBe(SinusFormation);
        expect(formation1[0].shipConfig).toBe(BloodHunter2L);
        expect(formation1[0].count).toBe(1);

        const formation2 = BloodHuntersLevel.formations[2];
        expect(formation2[0].formationType).toBe(DiamondFormation);
        expect(formation2[0].shipConfig).toBe(BloodFighter2L);
        expect(formation2[0].count).toBe(1);
    });
});


