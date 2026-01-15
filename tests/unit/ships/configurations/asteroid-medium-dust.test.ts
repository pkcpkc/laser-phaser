import { describe, it, expect, vi } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => ({
    default: {
        GameObjects: { Image: class { } },
        Scene: class { }
    }
}));

vi.mock('../../../../src/ships/definitions/asteroid-medium', () => ({
    MediumAsteroidDefinition: { id: 'medium-asteroid' }
}));
vi.mock('../../../../src/ships/definitions/asteroid-small', () => ({
    asteroidDriveMarker: { type: 'drive' }
}));
vi.mock('../../../../src/ships/modules/drives/dust-drive', () => ({
    DustDrive: class { constructor() { } }
}));

import { MediumAsteroidDustConfig } from '../../../../src/ships/configurations/asteroid-medium-dust.ts';
import { LootType } from '../../../../src/ships/types';

describe('MediumAsteroidDustConfig', () => {
    it('should have correct definition', () => {
        expect(MediumAsteroidDustConfig.definition.id).toBe('medium-asteroid');
    });

    it('should have dust drive module', () => {
        expect(MediumAsteroidDustConfig.modules.length).toBe(1);
    });

    it('should have silver loot', () => {
        expect(MediumAsteroidDustConfig.loot?.[0].type).toBe(LootType.SILVER);
    });
});
