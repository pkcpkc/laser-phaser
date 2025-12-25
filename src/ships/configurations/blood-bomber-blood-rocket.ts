import type { ShipConfig } from '../types';
import { BloodBomberDefinition } from '../definitions/blood-bomber';
import { BloodRocket } from '../mounts/rockets/blood-rocket';

export const BloodBomberBloodRocket: ShipConfig = {
    definition: BloodBomberDefinition,
    mounts: BloodBomberDefinition.markers.map(m => ({
        marker: m,
        weapon: BloodRocket
    })),
    loot: {
        text: '🪙',
        dropChance: 1,
        lifespan: 4000,
        type: 'silver',
        value: 5
    }
};
