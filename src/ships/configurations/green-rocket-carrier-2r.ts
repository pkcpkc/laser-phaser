import type { ShipConfig } from '../types';
import { GreenRocketCarrierDefinition } from '../definitions/green-rocket-carrier';
import { GreenRocket } from '../mounts/rockets/green-rocket';

export const GreenRocketCarrier2R: ShipConfig = {
    definition: GreenRocketCarrierDefinition,
    mounts: GreenRocketCarrierDefinition.markers.map(m => ({
        marker: m,
        weapon: GreenRocket
    })),
    loot: {
        text: '🪙',
        dropChance: 1,
        lifespan: 3000,
        type: 'silver',
        value: 1
    }
};
