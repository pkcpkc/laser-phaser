import type { ShipConfig } from '../types';
import { SmallAsteroidDefinition, asteroidDriveMarker } from '../definitions/asteroid-small';
import { DustDrive } from '../modules/drives/dust-drive';

export const SmallAsteroidDustConfig: ShipConfig = {
    definition: SmallAsteroidDefinition,
    modules: [{
        marker: asteroidDriveMarker,
        module: class extends DustDrive {
            constructor() { super(0x5a5a5a, 0.85); }
        }
    }]
};
