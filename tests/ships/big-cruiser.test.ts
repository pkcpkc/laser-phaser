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

import { BigCruiser } from '../../src/ships/big-cruiser';
import { BigCruiserDefinition } from '../../src/ships/definitions/big-cruiser';

// Mock dependencies
vi.mock('../../src/ships/ship');

describe('BigCruiser', () => {
    it('should have correct static properties', () => {
        expect(BigCruiser.assetKey).toBe(BigCruiserDefinition.assetKey);
        expect(BigCruiser.assetPath).toBe(BigCruiserDefinition.assetPath);
        expect(BigCruiser.gameplay).toBe(BigCruiserDefinition.gameplay);
    });

    it('should construct correctly', () => {
        const mockScene = {} as any;
        const collisionConfig = {} as any;

        const ship = new BigCruiser(mockScene, 100, 200, collisionConfig);
        expect(ship).toBeDefined();
    });
});
