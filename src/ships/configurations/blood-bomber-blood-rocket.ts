import type { ShipConfig } from '../types';
import { BloodBomberDefinition } from '../definitions/blood-bomber';
import { BloodRocket } from '../modules/rockets/blood-rocket';

import { RedThrusterDrive } from '../modules/drives/red-thruster-drive';

export const BloodBomberBloodRocketConfig: ShipConfig = {
    definition: BloodBomberDefinition,
    modules: [
        ...BloodBomberDefinition.markers
            .filter(m => m.type === 'rocket')
            .map(m => ({ marker: m, module: BloodRocket })),
        ...BloodBomberDefinition.markers
            .filter(m => m.type === 'drive')
            .map(m => ({ marker: m, module: RedThrusterDrive }))
    ],
    loot: {
        text: '🪙',
        dropChance: 1,
        lifespan: 4000,
        type: 'silver',
        value: 5
    }
};
