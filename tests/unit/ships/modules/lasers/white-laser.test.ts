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

import { WhiteLaser } from '../../../../../src/ships/modules/lasers/white-laser';
import { ModuleType } from '../../../../../src/ships/modules/module-types';

describe('WhiteLaser', () => {
    it('should have correct static properties', () => {
        const laser = new WhiteLaser();

        expect(laser.TEXTURE_KEY).toBe('laser');
        expect(laser.COLOR).toBe(0xffffff);
        expect(laser.SPEED).toBe(10);
        expect(laser.damage).toBe(5);
        expect(laser.width).toBe(4);
        expect(laser.height).toBe(4);
        expect(laser.reloadTime).toBe(300);
        expect(laser.fixedFireDirection).toBe(true);
        expect(laser.type).toBe(ModuleType.LASER);
    });
});
