import type { ShipConfig } from '../types';
import { BloodFighterDefinition } from '../definitions/blood-fighter';
import { BigRedLaser } from '../modules/lasers/big-red-laser';

export const BloodFighterBigRedLaserConfig: ShipConfig = {
    definition: BloodFighterDefinition,
    modules: BloodFighterDefinition.markers.map(m => ({
        marker: m,
        module: BigRedLaser
    })),
    loot: {
        text: '🪙',
        dropChance: 1,
        lifespan: 3000,
        type: 'silver',
        value: 1
    }
};
