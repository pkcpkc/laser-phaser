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
import { SinusWave } from '../../src/waves/sinus';
import { BloodHunter2L } from '../../src/ships/configurations/blood-hunter-2l';
import { GreenRocketCarrier2R } from '../../src/ships/configurations/green-rocket-carrier-2r';

describe('BloodHuntersLevel', () => {
    it('should have correct name', () => {
        expect(BloodHuntersLevel.name).toBe('Blood Hunters');
    });

    it('should have valid waves', () => {
        expect(BloodHuntersLevel.waves).toHaveLength(6);

        const wave1 = BloodHuntersLevel.waves[0];
        expect(wave1.waveType).toBe(SinusWave);
        expect(wave1.shipConfig).toBe(BloodHunter2L);
        expect(wave1.count).toBe(1);

        const wave2 = BloodHuntersLevel.waves[1];
        expect(wave2.waveType).toBe(SinusWave);
        expect(wave2.shipConfig).toBe(GreenRocketCarrier2R);
        expect(wave2.count).toBe(1);
    });
});
