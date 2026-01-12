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

import { BloodHuntersLevel } from '../../../../../src/scenes/shoot-em-ups/levels/blood-hunters-level.ts';
import { DiamondFormation } from '../../../../../src/scenes/shoot-em-ups/formations/diamond-formation';

import { BloodHunterRedLaserConfig } from '../../../../../src/ships/configurations/blood-hunter-red-laser';



describe('BloodHuntersLevel', () => {
    it('should have correct name', () => {
        expect(BloodHuntersLevel.name).toBe('Blood Hunters');
    });

    it('should have valid formations', () => {
        expect(BloodHuntersLevel.formations).toHaveLength(7);

        // First step: (DiamondFormation) - 2 enemies
        const step1 = BloodHuntersLevel.formations[0];
        expect(step1[0].formationType).toBe(DiamondFormation);
        if (step1[0].shipConfigs) {
            expect(step1[0].shipConfigs[0]).toBe(BloodHunterRedLaserConfig);
        }

        // Fourth step: Diamond [5]
        const step4 = BloodHuntersLevel.formations[3];
        expect(step4[0].formationType).toBe(DiamondFormation);
        expect(step4[0].config?.formationGrid).toEqual([5]);

        // Fifth step: Diamond [1, 2]
        const step5 = BloodHuntersLevel.formations[4];
        expect(step5[0].formationType).toBe(DiamondFormation);
        expect(step5[0].config?.formationGrid).toEqual([1, 2]);

        // last step: 2 formations
        const lastStep = BloodHuntersLevel.formations[6];
        expect(lastStep).toHaveLength(2);
        expect(lastStep[0].formationType).toBe(DiamondFormation);
        expect(lastStep[1].formationType).toBe(DiamondFormation);
    });


});

