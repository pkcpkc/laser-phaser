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
import { DiamondFormation } from '../../../../src/scenes/shoot-em-ups/formations/diamond-formation';
import { LineFormation } from '../../../../src/scenes/shoot-em-ups/formations/line-formation.ts';
import { BloodHunterRedLaserConfig } from '../../../../src/ships/configurations/blood-hunter-red-laser';
import { BloodBomberBloodRocketConfig } from '../../../../src/ships/configurations/blood-bomber-blood-rocket';
import { BloodFighterBigRedLaserConfig } from '../../../../src/ships/configurations/blood-fighter-big-red-laser';

describe('BloodHuntersLevel', () => {
    it('should have correct name', () => {
        expect(BloodHuntersLevel.name).toBe('Blood Hunters');
    });

    it('should have valid formations', () => {
        expect(BloodHuntersLevel.formations).toHaveLength(3);

        // First step: Sinus (LineFormation) + DiamondFormation (Fighter)
        const step1 = BloodHuntersLevel.formations[0];
        expect(step1[0].formationType).toBe(LineFormation);
        expect(step1[1].formationType).toBe(DiamondFormation);
        if (step1[0].shipConfigs) {
            expect(step1[0].shipConfigs[0]).toBe(BloodHunterRedLaserConfig);
        }
        if (step1[1].shipConfigs) {
            expect(step1[1].shipConfigs[0]).toBe(BloodFighterBigRedLaserConfig);
        }

        const step2 = BloodHuntersLevel.formations[1];
        expect(step2).toBeDefined();
        if (step2[0].shipConfigs) {
            expect(step2[0].shipConfigs[0]).toBe(BloodBomberBloodRocketConfig);
        }

        // Third step: DiamondFormation
        const step3 = BloodHuntersLevel.formations[2];
        expect(step3[0].formationType).toBe(DiamondFormation);
    });


});

