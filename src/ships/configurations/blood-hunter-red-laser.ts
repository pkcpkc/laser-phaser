import type { ShipConfig } from '../types';
import { BloodHunterDefinition } from '../definitions/blood-hunter';
import { RedLaser } from '../modules/lasers/red-laser';
import { LootType } from '../types';

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
    loot: [
        {
            type: LootType.SILVER,
            dropChance: 0.5
        }
    ]
};
