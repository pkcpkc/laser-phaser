import type { ShipConfig } from '../types';
import { BigCruiserDefinition } from '../definitions/big-cruiser';
import { WhiteLaser } from '../modules/lasers/white-laser';

export const BigCruiserWhiteLaserConfig: ShipConfig = {
    definition: BigCruiserDefinition,
    modules: [
        {
            marker: BigCruiserDefinition.markers[0],
            module: WhiteLaser
        }
    ]
};
