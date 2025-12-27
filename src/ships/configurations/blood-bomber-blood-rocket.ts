import type { ShipConfig } from '../types';
import { BloodBomberDefinition } from '../definitions/blood-bomber';
import { BloodRocket } from '../modules/rockets/blood-rocket';

export const BloodBomberBloodRocketConfig: ShipConfig = {
    definition: BloodBomberDefinition,
    modules: BloodBomberDefinition.markers.map(m => ({
        marker: m,
        module: BloodRocket
    })),
    loot: {
        text: '🪙',
        dropChance: 1,
        lifespan: 4000,
        type: 'silver',
        value: 5
    }
};
