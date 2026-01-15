import { describe, it, expect, vi } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => ({
    default: {
        GameObjects: { Image: class { } },
        Scene: class { }
    }
}));

vi.mock('../../../../src/ships/definitions/asteroid-small', () => ({
    SmallAsteroidDefinition: { id: 'small-asteroid' },
    asteroidDriveMarker: { type: 'drive' }
}));
vi.mock('../../../../src/ships/modules/drives/dust-drive', () => ({
    DustDrive: class { constructor() { } }
}));

import { SmallAsteroidDustConfig } from '../../../../src/ships/configurations/asteroid-small-dust.ts';
import { LootType } from '../../../../src/ships/types';

describe('SmallAsteroidDustConfig', () => {
    it('should have correct definition', () => {
        expect(SmallAsteroidDustConfig.definition.id).toBe('small-asteroid');
    });

    it('should have dust drive module', () => {
        expect(SmallAsteroidDustConfig.modules.length).toBe(1);
    });

    it('should have silver loot', () => {
        expect(SmallAsteroidDustConfig.loot?.[0].type).toBe(LootType.SILVER);
    });
});
