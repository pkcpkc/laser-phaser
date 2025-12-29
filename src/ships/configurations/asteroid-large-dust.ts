import type { ShipConfig } from '../types';
import { LargeAsteroidDefinition } from '../definitions/asteroid-large';
import { asteroidDriveMarker } from '../definitions/asteroid-small';
import { DustDrive } from '../modules/drives/dust-drive';

export const LargeAsteroidDustConfig: ShipConfig = {
    definition: LargeAsteroidDefinition,
    modules: [{
        marker: asteroidDriveMarker,
        module: class extends DustDrive {
            constructor() { super(0x5a5a5a, 2.1); }
        }
    }]
};
