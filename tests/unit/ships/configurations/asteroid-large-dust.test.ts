import { describe, it, expect, vi } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => ({
    default: {
        GameObjects: { Image: class { } },
        Scene: class { }
    }
}));

// Mock keys to avoid implicit dependencies
vi.mock('../../../../src/ships/definitions/asteroid-large', () => ({
    LargeAsteroidDefinition: { id: 'large-asteroid' }
}));
vi.mock('../../../../src/ships/definitions/asteroid-small', () => ({
    asteroidDriveMarker: { type: 'drive' }
}));
vi.mock('../../../../src/ships/modules/drives/dust-drive', () => ({
    DustDrive: class { constructor() { } }
}));

import { LargeAsteroidDustConfig } from '../../../../src/ships/configurations/asteroid-large-dust.ts';
import { LootType } from '../../../../src/ships/types';

describe('LargeAsteroidDustConfig', () => {
    it('should have correct definition', () => {
        expect(LargeAsteroidDustConfig.definition.id).toBe('large-asteroid');
    });

    it('should have dust drive module', () => {
        expect(LargeAsteroidDustConfig.modules.length).toBe(1);
        expect(LargeAsteroidDustConfig.modules[0].marker.type).toBe('drive');
        // Check if class constructor works?
        const DriveClass = LargeAsteroidDustConfig.modules[0].module;
        new DriveClass(); // Should not throw
    });

    it('should have silver loot', () => {
        expect(LargeAsteroidDustConfig.loot?.length).toBe(1);
        expect(LargeAsteroidDustConfig.loot?.[0].type).toBe(LootType.SILVER);
    });
});
