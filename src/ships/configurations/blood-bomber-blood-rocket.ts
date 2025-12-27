import type { ShipConfig } from '../types';
import { BloodBomberDefinition } from '../definitions/blood-bomber';
import { BloodRocket } from '../modules/rockets/blood-rocket';

import { IonDrive } from '../modules/drives/ion-drive';

export const BloodBomberBloodRocketConfig: ShipConfig = {
    definition: BloodBomberDefinition,
    modules: [
        ...BloodBomberDefinition.markers
            .filter(m => m.type === 'rocket')
            .map(m => ({ marker: m, module: BloodRocket })),
        ...BloodBomberDefinition.markers
            .filter(m => m.type === 'drive')
            .map(m => ({ marker: m, module: IonDrive }))
    ],
    loot: {
        text: '🪙',
        dropChance: 1,
        lifespan: 4000,
        type: 'silver',
        value: 5
    }
};
