import type { ShipConfig } from '../types';
import { GreenRocketCarrierDefinition } from '../definitions/green-rocket-carrier';
import { GreenRocket } from '../modules/rockets/green-rocket';
import { LootType } from '../types';

import { IonDrive } from '../modules/drives/ion-drive';

export const GreenRocketCarrierGreenRocketConfig: ShipConfig = {
    definition: GreenRocketCarrierDefinition,
    modules: [
        ...GreenRocketCarrierDefinition.markers
            .filter(m => m.type === 'rocket')
            .map(m => ({ marker: m, module: GreenRocket })),
        ...GreenRocketCarrierDefinition.markers
            .filter(m => m.type === 'drive')
            .map(m => ({ marker: m, module: IonDrive }))
    ],
    loot: [
        {
            type: LootType.SILVER,
            dropChance: 1
        }
    ]
};
