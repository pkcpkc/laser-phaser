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
import { DiamondFormation } from '../../../../src/scenes/shoot-em-ups/formations/index.ts';
import { LineFormation } from '../../../../src/scenes/shoot-em-ups/formations/line-formation.ts';
import { BloodHunterRedLaser } from '../../../../src/ships/configurations/blood-hunter-red-laser.ts';
import { BloodBomberBloodRocket } from '../../../../src/ships/configurations/blood-bomber-blood-rocket.ts';
import { BloodFighterBigRedLaser } from '../../../../src/ships/configurations/blood-fighter-big-red-laser.ts';

describe('BloodHuntersLevel', () => {
    it('should have correct name', () => {
        expect(BloodHuntersLevel.name).toBe('Blood Hunters');
    });

    it('should have valid formations', () => {
        expect(BloodHuntersLevel.formations).toHaveLength(3);

        // First step: Sinus (LineFormation) + DiamondFormation (Fighter)
        const step1 = BloodHuntersLevel.formations[0];
        expect(step1[0].formationType).toBe(LineFormation);
        expect(step1[0].shipConfig).toBe(BloodHunterRedLaser);
        expect(step1[1].formationType).toBe(DiamondFormation);
        expect(step1[1].shipConfig).toBe(BloodFighterBigRedLaser);

        // Second step: Bomber (DiamondFormation)
        const step2 = BloodHuntersLevel.formations[1];
        expect(step2[0].formationType).toBe(DiamondFormation);
        expect(step2[0].shipConfig).toBe(BloodBomberBloodRocket);

        // Third step: DiamondFormation
        const step3 = BloodHuntersLevel.formations[2];
        expect(step3[0].formationType).toBe(DiamondFormation);
    });
});


