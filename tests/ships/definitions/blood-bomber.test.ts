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
vi.mock('../../../src/ships/ship');

import { BloodBomberDefinition } from '../../../src/ships/definitions/blood-bomber';
import { BloodBomberBloodRocketConfig } from '../../../src/ships/configurations/blood-bomber-blood-rocket';


describe('BloodBomber Configuration', () => {
    it('should have correct definition properties', () => {
        expect(BloodBomberDefinition.assetKey).toBe('ships');
    });

    it('should use BloodBomber2R configuration', () => {
        expect(BloodBomberBloodRocketConfig.definition).toBe(BloodBomberDefinition);
        const config = BloodBomberBloodRocketConfig;
        expect(config.modules).toHaveLength(4);

        // Verify modules are Rockets or Drives
        config.modules.forEach(m => {
            // Just basic check for now
            expect(m.module).toBeDefined();
        });
    });
});
