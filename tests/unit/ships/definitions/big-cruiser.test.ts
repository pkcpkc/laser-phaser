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

import { BigCruiserDefinition } from '../../../../src/ships/definitions/big-cruiser';
import { BigCruiserWhiteLaserConfig } from '../../../../src/ships/configurations/big-cruiser-white-laser';

// Mock dependencies
vi.mock('../../../../src/ships/ship');

describe('BigCruiser Configuration', () => {
    it('should have correct definition properties', () => {
        expect(BigCruiserDefinition.assetKey).toBe('ships');
        expect(BigCruiserDefinition.gameplay.health).toBe(100);
    });

    it('should use correct definition in config', () => {
        const config = BigCruiserWhiteLaserConfig;
        expect(config.definition).toBe(BigCruiserDefinition);
    });
});
