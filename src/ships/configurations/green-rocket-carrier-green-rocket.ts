import type { ShipConfig } from '../types';
import { GreenRocketCarrierDefinition } from '../definitions/green-rocket-carrier';
import { GreenRocket } from '../modules/rockets/green-rocket';

export const GreenRocketCarrierGreenRocketConfig: ShipConfig = {
    definition: GreenRocketCarrierDefinition,
    modules: GreenRocketCarrierDefinition.markers.map(m => ({
        marker: m,
        module: GreenRocket
    })),
    loot: {
        text: '🪙',
        dropChance: 1,
        lifespan: 3000,
        type: 'silver',
        value: 1
    }
};
