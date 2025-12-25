import { describe, it, expect, vi } from 'vitest';

// Mock Phaser globally
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            Physics: {
                Matter: {
                    Sprite: class { },
                    Image: class { }
                }
            }
        }
    };
});

// Mock dependencies if needed
vi.mock('../../src/ships/ship');

import { BloodBomberDefinition } from '../../src/ships/definitions/blood-bomber';
import { BloodBomberBloodRocket } from '../../src/ships/configurations/blood-bomber-blood-rocket';
import { BloodRocket } from '../../src/ships/mounts/rockets/blood-rocket';

describe('BloodBomber Configuration', () => {
    it('should have correct definition properties', () => {
        expect(BloodBomberDefinition.assetKey).toBe('ships');
    });

    it('should use BloodBomber2R configuration', () => {
        expect(BloodBomberBloodRocket.definition).toBe(BloodBomberDefinition);
        expect(BloodBomberBloodRocket.mounts.length).toBeGreaterThan(0);

        // Verify all mounts are BloodRockets
        BloodBomberBloodRocket.mounts.forEach(mount => {
            expect(mount.weapon).toBe(BloodRocket);
        });
    });
});
