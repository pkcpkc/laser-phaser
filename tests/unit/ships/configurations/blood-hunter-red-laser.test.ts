import { describe, it, expect, vi } from 'vitest';

// Mock Dependencies
vi.mock('../../../../src/ships/definitions/blood-hunter', () => ({
    BloodHunterDefinition: {
        id: 'blood-hunter',
        markers: [
            { type: 'laser' },
            { type: 'drive' }
        ]
    }
}));
vi.mock('../../../../src/ships/modules/lasers/red-laser', () => ({
    RedLaser: class { }
}));
vi.mock('../../../../src/ships/modules/drives/red-thruster-drive', () => ({
    RedThrusterDrive: class { }
}));

import { BloodHunterRedLaserConfig } from '../../../../src/ships/configurations/blood-hunter-red-laser';
import { RedLaser } from '../../../../src/ships/modules/lasers/red-laser';
import { RedThrusterDrive } from '../../../../src/ships/modules/drives/red-thruster-drive';
import { LootType } from '../../../../src/ships/types';

describe('BloodHunterRedLaserConfig', () => {
    it('should have correct definition', () => {
        expect(BloodHunterRedLaserConfig.definition.id).toBe('blood-hunter');
    });

    it('should map lasers and drives correctly', () => {
        const modules = BloodHunterRedLaserConfig.modules;
        expect(modules.length).toBe(2);

        const lasers = modules.filter(m => m.module === RedLaser);
        const drives = modules.filter(m => m.module === RedThrusterDrive);

        expect(lasers.length).toBe(1);
        expect(drives.length).toBe(1);
    });

    it('should have silver loot', () => {
        expect(BloodHunterRedLaserConfig.loot?.[0].type).toBe(LootType.SILVER);
    });
});
