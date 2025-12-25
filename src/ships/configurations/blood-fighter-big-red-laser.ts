import type { ShipConfig } from '../types';
import { BloodFighterDefinition } from '../definitions/blood-fighter';
import { BigRedLaser } from '../mounts/lasers/big-red-laser';

console.log('Evaluating BloodFighterBigRedLaser module. Definition:', BloodFighterDefinition);
export const BloodFighterBigRedLaser: ShipConfig = {
    definition: BloodFighterDefinition,
    mounts: BloodFighterDefinition.markers.map(m => ({
        marker: m,
        weapon: BigRedLaser
    })),
    loot: {
        text: '🪙',
        dropChance: 1,
        lifespan: 3000,
        type: 'silver',
        value: 1
    }
};
