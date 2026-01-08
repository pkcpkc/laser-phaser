import { type ShipConfig, LootType } from '../types';
import { MediumAsteroidDefinition } from '../definitions/asteroid-medium';
import { asteroidDriveMarker } from '../definitions/asteroid-small';
import { DustDrive } from '../modules/drives/dust-drive';

export const MediumAsteroidDustConfig: ShipConfig = {
    definition: MediumAsteroidDefinition,
    modules: [{
        marker: asteroidDriveMarker,
        module: class extends DustDrive {
            constructor() { super(0x5a5a5a, 1.35); }
        }
    }],
    loot: [{
        type: LootType.SILVER,
        dropChance: 0.05
    }]
};
