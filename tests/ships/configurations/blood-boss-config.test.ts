import { describe, it, expect, vi } from 'vitest';

// Mock canvas
if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.getContext = () => null;
}

// Mock Phaser
vi.mock('phaser', () => ({
    default: {
        GameObjects: {
            Image: class { },
            Sprite: class { }
        },
        Physics: {
            Matter: {
                Image: class { },
                Sprite: class { }
            }
        },
        Math: {
            Between: (min: number, _max: number) => min,
            Vector2: class { x = 0; y = 0; }
        },
        Scene: class { }
    }
}));

import { BloodBossConfig } from '../../../src/ships/configurations/blood-boss-config';
import { BigRedLaser } from '../../../src/ships/modules/lasers/big-red-laser';
import { RedLaser } from '../../../src/ships/modules/lasers/red-laser';
import { BloodRocket } from '../../../src/ships/modules/rockets/blood-rocket';
import { RedThrusterDrive } from '../../../src/ships/modules/drives/red-thruster-drive';

describe('BloodBossConfig', () => {
    it('should have correct modules assigned', () => {
        const modules = BloodBossConfig.modules;

        const bigRedCount = modules.filter(m => m.module === BigRedLaser).length;
        const redCount = modules.filter(m => m.module === RedLaser).length;
        const rocketCount = modules.filter(m => m.module === BloodRocket).length;
        const thrusterCount = modules.filter(m => m.module === RedThrusterDrive).length;

        expect(bigRedCount).toBe(2);
        expect(redCount).toBe(2);
        expect(rocketCount).toBe(2);
        expect(thrusterCount).toBe(2);
    });

    it('should have loot defined', () => {
        expect(BloodBossConfig.loot).toBeDefined();
        expect(BloodBossConfig.loot?.length).toBeGreaterThan(0);
    });
});
