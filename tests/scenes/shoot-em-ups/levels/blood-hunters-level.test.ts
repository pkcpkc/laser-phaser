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

import { BloodHuntersLevel } from '../../../../src/scenes/shoot-em-ups/levels/blood-hunters-level.ts';
import { SinusFormation, DiamondFormation } from '../../../../src/scenes/shoot-em-ups/formations/index.ts';
import { BloodHunterRedLaser } from '../../../../src/ships/configurations/blood-hunter-red-laser.ts';
import { BloodFighterBigRedLaser } from '../../../../src/ships/configurations/blood-fighter-big-red-laser.ts';

describe('BloodHuntersLevel', () => {
    it('should have correct name', () => {
        expect(BloodHuntersLevel.name).toBe('Blood Hunters');
    });

    it('should have valid formations', () => {
        expect(BloodHuntersLevel.formations).toHaveLength(8);

        // First formation is a bomber (DiamondFormation)
        const formation1 = BloodHuntersLevel.formations[0];
        expect(formation1[0].formationType).toBe(DiamondFormation);
        expect(formation1[0].count).toBe(1);

        // Third step has SinusFormation + DiamondFormation
        const formation3 = BloodHuntersLevel.formations[2];
        expect(formation3[0].formationType).toBe(SinusFormation);
        expect(formation3[0].shipConfig).toBe(BloodHunterRedLaser);
        expect(formation3[1].formationType).toBe(DiamondFormation);
        expect(formation3[1].shipConfig).toBe(BloodFighterBigRedLaser);
    });
});


