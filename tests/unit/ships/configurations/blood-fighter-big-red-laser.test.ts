import { describe, it, expect, vi } from 'vitest';

// Mock Dependencies
vi.mock('../../../../src/ships/definitions/blood-fighter', () => ({
    BloodFighterDefinition: {
        id: 'blood-fighter',
        markers: [
            { type: 'laser' },
            { type: 'drive' }
        ]
    }
}));
vi.mock('../../../../src/ships/modules/lasers/big-red-laser', () => ({
    BigRedLaser: class { }
}));
vi.mock('../../../../src/ships/modules/drives/red-thruster-drive', () => ({
    RedThrusterDrive: class { }
}));

import { BloodFighterBigRedLaserConfig } from '../../../../src/ships/configurations/blood-fighter-big-red-laser';
import { BigRedLaser } from '../../../../src/ships/modules/lasers/big-red-laser';
import { RedThrusterDrive } from '../../../../src/ships/modules/drives/red-thruster-drive';
import { LootType } from '../../../../src/ships/types';

describe('BloodFighterBigRedLaserConfig', () => {
    it('should have correct definition', () => {
        expect(BloodFighterBigRedLaserConfig.definition.id).toBe('blood-fighter');
    });

    it('should map lasers and drives correctly', () => {
        const modules = BloodFighterBigRedLaserConfig.modules;
        expect(modules.length).toBe(2);

        const lasers = modules.filter(m => m.module === BigRedLaser);
        const drives = modules.filter(m => m.module === RedThrusterDrive);

        expect(lasers.length).toBe(1);
        expect(drives.length).toBe(1);
    });

    it('should have silver loot', () => {
        expect(BloodFighterBigRedLaserConfig.loot?.[0].type).toBe(LootType.SILVER);
    });
});
