import { describe, it, expect, vi } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => ({
    default: {
        Scene: class { },
        Physics: {
            Matter: {
                Image: class { }
            }
        }
    }
}));

import { RedLaser } from '../../../../../src/ships/modules/lasers/red-laser';
import { ModuleType } from '../../../../../src/ships/modules/module-types';

describe('RedLaser', () => {
    it('should have correct static properties', () => {
        const laser = new RedLaser();

        expect(laser.TEXTURE_KEY).toBe('red-laser-v2');
        expect(laser.COLOR).toBe(0xff0000);
        expect(laser.SPEED).toBe(5);
        expect(laser.damage).toBe(5);
        expect(laser.width).toBe(3);
        expect(laser.height).toBe(3);
        expect(laser.reloadTime).toBe(650);
        expect(laser.type).toBe(ModuleType.LASER);
    });
});
