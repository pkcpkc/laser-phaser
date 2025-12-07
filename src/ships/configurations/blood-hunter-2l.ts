import type { ShipConfig } from '../types';
import { BloodHunterDefinition } from '../definitions/blood-hunter';
import { RedLaser } from '../mounts/lasers/red-laser';

export const BloodHunter2L: ShipConfig = {
    definition: BloodHunterDefinition,
    mounts: BloodHunterDefinition.markers.map(m => ({
        marker: m,
        weapon: RedLaser
    })),
    loot: {
        text: '🪙',
        dropChance: 1,
        lifespan: 3000,
        type: 'silver',
        value: 1
    }
};
