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
import { LineFormation } from '../../../../../src/scenes/shoot-em-ups/formations/line-formation.ts';
import { BloodHunterRedLaserConfig } from '../../../../../src/ships/configurations/blood-hunter-red-laser';
import { BloodBomberBloodRocketConfig } from '../../../../../src/ships/configurations/blood-bomber-blood-rocket';
import { BloodFighterBigRedLaserConfig } from '../../../../../src/ships/configurations/blood-fighter-big-red-laser';

describe('BloodHuntersLevel', () => {
    it('should have correct name', () => {
        expect(BloodHuntersLevel.name).toBe('Blood Hunters');
    });

    it('should have valid formations', () => {
        expect(BloodHuntersLevel.formations).toHaveLength(6);

        // First step: Sinus (LineFormation) - 2 enemies
        const step1 = BloodHuntersLevel.formations[0];
        expect(step1[0].formationType).toBe(LineFormation);
        if (step1[0].shipConfigs) {
            expect(step1[0].shipConfigs[0]).toBe(BloodHunterRedLaserConfig);
        }

        // Fourth step has LineFormation + DiamondFormation (Fighter)
        const step4 = BloodHuntersLevel.formations[3];
        expect(step4[0].formationType).toBe(LineFormation);
        expect(step4[1].formationType).toBe(DiamondFormation);
        if (step4[1].shipConfigs) {
            expect(step4[1].shipConfigs[0]).toBe(BloodFighterBigRedLaserConfig);
        }

        // Fifth step: Bomber Formation
        const step5 = BloodHuntersLevel.formations[4];
        expect(step5).toBeDefined();
        if (step5[0].shipConfigs) {
            expect(step5[0].shipConfigs[0]).toBe(BloodBomberBloodRocketConfig);
        }

        // Sixth step: DiamondFormation
        const step6 = BloodHuntersLevel.formations[5];
        expect(step6[0].formationType).toBe(DiamondFormation);
    });


});

