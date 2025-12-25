import type { ShipConfig } from '../types';
import { BloodHunterDefinition } from '../definitions/blood-hunter';
import { RedLaser } from '../mounts/lasers/red-laser';

console.log('Evaluating BloodHunterRedLaser module. Definition:', BloodHunterDefinition);
export const BloodHunterRedLaser: ShipConfig = {
    definition: BloodHunterDefinition,
    mounts: BloodHunterDefinition.markers.map(m => ({
        marker: m,
        weapon: RedLaser
    })),
    loot: {
        text: '🪙',
        dropChance: .5,
        lifespan: 3000,
        type: 'silver',
        value: 1
    }
};
