import type { ShipConfig } from '../types';
import { BloodHunterDefinition } from '../definitions/blood-hunter';
import { RedLaser } from '../modules/lasers/red-laser';

import { RedThrusterDrive } from '../modules/drives/red-thruster-drive';

export const BloodHunterRedLaserConfig: ShipConfig = {
    definition: BloodHunterDefinition,
    modules: [
        ...BloodHunterDefinition.markers
            .filter(m => m.type === 'laser')
            .map(m => ({ marker: m, module: RedLaser })),
        ...BloodHunterDefinition.markers
            .filter(m => m.type === 'drive')
            .map(m => ({ marker: m, module: RedThrusterDrive }))
    ],
    loot: {
        text: '🪙',
        dropChance: .5,
        lifespan: 3000,
        type: 'silver',
        value: 1
    }
};
