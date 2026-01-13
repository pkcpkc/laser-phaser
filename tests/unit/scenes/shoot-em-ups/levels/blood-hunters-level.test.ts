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

        // First step: DiamondFormation with 2 ships
        const step1 = BloodHuntersLevel.formations[0];
        expect(step1[0].formationType).toBe(DiamondFormation);
        expect(step1[0].config?.shipFormationGrid).toBeDefined();
        expect(step1[0].config?.shipFormationGrid[0]).toHaveLength(2);
        expect(step1[0].config?.shipFormationGrid[0][0]).toBe(BloodHunterRedLaserConfig);

        // Fourth step: Diamond with 5 ships in a row
        const step4 = BloodHuntersLevel.formations[3];
        expect(step4[0].formationType).toBe(DiamondFormation);
        expect(step4[0].config?.shipFormationGrid[0]).toHaveLength(5);

        // Fifth step: Diamond [1, 2] pattern (2 rows)
        const step5 = BloodHuntersLevel.formations[4];
        expect(step5[0].formationType).toBe(DiamondFormation);
        expect(step5[0].config?.shipFormationGrid).toHaveLength(2);
        expect(step5[0].config?.shipFormationGrid[0]).toHaveLength(1);
        expect(step5[0].config?.shipFormationGrid[1]).toHaveLength(2);

        // Last step: 2 formations
        const lastStep = BloodHuntersLevel.formations[6];
        expect(lastStep).toHaveLength(2);
        expect(lastStep[0].formationType).toBe(DiamondFormation);
        expect(lastStep[1].formationType).toBe(DiamondFormation);
    });
});
