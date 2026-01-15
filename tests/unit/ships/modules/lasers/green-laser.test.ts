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

import { GreenLaser } from '../../../../../src/ships/modules/lasers/green-laser';
import { ModuleType } from '../../../../../src/ships/modules/module-types';

describe('GreenLaser', () => {
    it('should have correct static properties', () => {
        const laser = new GreenLaser();

        expect(laser.TEXTURE_KEY).toBe('green-laser');
        expect(laser.COLOR).toBe(0x00ff00);
        expect(laser.SPEED).toBe(8);
        expect(laser.damage).toBe(12);
        expect(laser.recoil).toBe(0.05);
        expect(laser.width).toBe(4);
        expect(laser.height).toBe(4);
        expect(laser.type).toBe(ModuleType.LASER);
    });

    it('should use default reloadTime from WeaponBase', () => {
        const laser = new GreenLaser();
        // WeaponBase default is 200
        expect(laser.reloadTime).toBe(200);
    });
});
