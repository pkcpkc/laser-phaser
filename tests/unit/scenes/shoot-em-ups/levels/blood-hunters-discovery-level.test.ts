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

import { BloodHuntersDiscoveryLevel } from '../../../../../src/scenes/shoot-em-ups/levels/blood-hunters-discovery-level';
import { DiamondFormation } from '../../../../../src/scenes/shoot-em-ups/formations/diamond-formation';
import { BloodHunterRedLaserConfig } from '../../../../../src/ships/configurations/blood-hunter-red-laser';
import { BloodBomberBloodRocketConfig } from '../../../../../src/ships/configurations/blood-bomber-blood-rocket';

describe('BloodHuntersDiscoveryLevel', () => {
    it('should have correct name', () => {
        expect(BloodHuntersDiscoveryLevel.name).toBe('Blood Hunters Discovery');
    });

    it('should have valid formations for all 5 waves', () => {
        expect(BloodHuntersDiscoveryLevel.formations).toHaveLength(5);

        // Wave 1: Single ship
        const wave1 = BloodHuntersDiscoveryLevel.formations[0];
        expect(wave1[0].formationType).toBe(DiamondFormation);
        expect(wave1[0].config.shipFormationGrid[0]).toHaveLength(1);

        // Wave 2: Two ships
        const wave2 = BloodHuntersDiscoveryLevel.formations[1];
        expect(wave2[0].config.shipFormationGrid[0]).toHaveLength(2);

        // Wave 3: 1,2 formation (3 ships)
        const wave3 = BloodHuntersDiscoveryLevel.formations[2];
        expect(wave3[0].config.shipFormationGrid).toHaveLength(2);
        expect(wave3[0].config.shipFormationGrid[0]).toHaveLength(1);
        expect(wave3[0].config.shipFormationGrid[1]).toHaveLength(2);

        // Wave 4: 2,2 formation (4 ships)
        const wave4 = BloodHuntersDiscoveryLevel.formations[3];
        expect(wave4[0].config.shipFormationGrid).toHaveLength(2);
        expect(wave4[0].config.shipFormationGrid[0]).toHaveLength(2);
        expect(wave4[0].config.shipFormationGrid[1]).toHaveLength(2);

        // Wave 5: 2 formations of [2,2]
        const wave5 = BloodHuntersDiscoveryLevel.formations[4];
        expect(wave5).toHaveLength(2);
        expect(wave5[0].config.shipFormationGrid).toHaveLength(2);
        expect(wave5[0].config.shipFormationGrid[0][0]).toBe(BloodHunterRedLaserConfig);
        expect(wave5[0].config.shipFormationGrid[1][0]).toBe(BloodBomberBloodRocketConfig);
    });
});
