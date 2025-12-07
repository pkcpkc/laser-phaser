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
import { SinusWave } from '../../src/formations/sinus';
import { BloodHunter } from '../../src/ships/blood-hunter';
import { GreenRocketCarrier } from '../../src/ships/green-rocket-carrier';

describe('BloodHuntersLevel', () => {
    it('should have correct name', () => {
        expect(BloodHuntersLevel.name).toBe('Blood Hunters');
    });

    it('should have valid waves', () => {
        expect(BloodHuntersLevel.waves).toHaveLength(2);

        const wave1 = BloodHuntersLevel.waves[0];
        expect(wave1.formationType).toBe(SinusWave);
        expect(wave1.shipClass).toBe(BloodHunter);
        expect(wave1.count).toBe(3);

        const wave2 = BloodHuntersLevel.waves[1];
        expect(wave2.formationType).toBe(SinusWave);
        expect(wave2.shipClass).toBe(GreenRocketCarrier);
        expect(wave2.count).toBe(3);
    });
});
