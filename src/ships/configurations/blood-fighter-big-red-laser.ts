import type { ShipConfig } from '../types';
import { BloodFighterDefinition } from '../definitions/blood-fighter';
import { BigRedLaser } from '../modules/lasers/big-red-laser';
import { LootType } from '../types';

import { RedThrusterDrive } from '../modules/drives/red-thruster-drive';

export const BloodFighterBigRedLaserConfig: ShipConfig = {
    definition: BloodFighterDefinition,
    modules: [
        ...BloodFighterDefinition.markers
            .filter(m => m.type === 'laser')
            .map(m => ({ marker: m, module: BigRedLaser })),
        ...BloodFighterDefinition.markers
            .filter(m => m.type === 'drive')
            .map(m => ({ marker: m, module: RedThrusterDrive }))
    ],
    loot: [
        {
            type: LootType.SILVER,
            dropChance: 1
        }
    ]
};
