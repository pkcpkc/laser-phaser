import type { ShipConfig } from '../types';
import { BigCruiserDefinition } from '../definitions/big-cruiser';
import { WhiteLaser } from '../mounts/lasers/white-laser';

export const BigCruiser1L: ShipConfig = {
    definition: BigCruiserDefinition,
    mounts: [
        {
            // Filter for the specific marker at 24, 35
            marker: BigCruiserDefinition.markers.find(m => m.x === 24 && m.y === 35)!,
            weapon: WhiteLaser
        }
    ],
    loot: undefined // Default behavior or specific loot
};
