import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => ({
    default: {
        Scene: class { },
        Physics: {
            Matter: {
                Image: class { }
            }
        },
        Math: {
            Between: vi.fn()
        }
    }
}));

// Mock TimeUtils
vi.mock('../../../../../src/utils/time-utils', () => ({
    TimeUtils: {
        delayedCall: vi.fn()
    }
}));

import Phaser from 'phaser';
import { BigRedLaser } from '../../../../../src/ships/modules/lasers/big-red-laser';
import { TimeUtils } from '../../../../../src/utils/time-utils';
import { ModuleType } from '../../../../../src/ships/modules/module-types';

describe('BigRedLaser', () => {
    let laser: BigRedLaser;
    let mockScene: any;

    beforeEach(() => {
        vi.clearAllMocks();
        laser = new BigRedLaser();
        mockScene = {};
    });

    it('should have correct static properties', () => {
        expect(laser.TEXTURE_KEY).toBe('big-red-laser');
        expect(laser.COLOR).toBe(0xff0000);
        expect(laser.SPEED).toBe(5);
        expect(laser.damage).toBe(10);
        expect(laser.width).toBe(4);
        expect(laser.height).toBe(4);
        expect(laser.reloadTime).toBe(300);
        expect(laser.firingDelay).toEqual({ min: 500, max: 900 });
        expect(laser.type).toBe(ModuleType.LASER);
    });

    it('should fire immediately if delay is 0', () => {
        (Phaser.Math.Between as any).mockReturnValue(0);
        const superFireSpy = vi.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(laser)), 'fire').mockImplementation(() => ({}));

        laser.fire(mockScene, 100, 100, 0, 1, 2);

        expect(Phaser.Math.Between).toHaveBeenCalledWith(0, 100);
        expect(superFireSpy).toHaveBeenCalled();
        expect(TimeUtils.delayedCall).not.toHaveBeenCalled();
    });

    it('should use delayedCall if delay is not 0', () => {
        (Phaser.Math.Between as any).mockReturnValue(50);
        const superFireSpy = vi.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(laser)), 'fire').mockImplementation(() => ({}));

        laser.fire(mockScene, 100, 100, 0, 1, 2);

        expect(Phaser.Math.Between).toHaveBeenCalledWith(0, 100);
        expect(TimeUtils.delayedCall).toHaveBeenCalledWith(mockScene, 50, expect.any(Function));

        // Check if the callback calls super.fire
        const callback = (TimeUtils.delayedCall as any).mock.calls[0][2];
        callback();
        expect(superFireSpy).toHaveBeenCalled();
    });
});
