import { describe, it, expect, vi } from 'vitest';

// Mock Phaser first
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            Math: {
                Vector2: class { x = 0; y = 0; },
            },
            Physics: {
                Matter: {
                    Image: class { }
                }
            },
            GameObjects: {
                Sprite: class { }
            }
        }
    };
});

import { ShipDebugLevel } from '../../../../../../src/scenes/shoot-em-ups/levels/debug/ship-debug-level';

describe('ShipDebugLevel', () => {
    it('should be a valid level config', () => {
        expect(ShipDebugLevel).toBeDefined();
        expect(ShipDebugLevel.name).toBe('Ship Debug');
        expect(ShipDebugLevel.loop).toBe(true);
        expect(ShipDebugLevel.formations.length).toBeGreaterThan(0);
    });
});
