import type { ShipConfig } from '../types';
import { BloodHunterDefinition } from '../definitions/blood-hunter';
import { RedLaser } from '../modules/lasers/red-laser';

export const BloodHunterRedLaserConfig: ShipConfig = {
    definition: BloodHunterDefinition,
    modules: BloodHunterDefinition.markers.map(m => ({
        marker: m,
        module: RedLaser
    })),
    loot: {
        text: '🪙',
        dropChance: .5,
        lifespan: 3000,
        type: 'silver',
        value: 1
    }
};
