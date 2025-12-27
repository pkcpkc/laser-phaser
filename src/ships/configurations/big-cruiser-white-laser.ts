import type { ShipConfig } from '../types';
import { BigCruiserDefinition } from '../definitions/big-cruiser';
import { WhiteLaser } from '../modules/lasers/white-laser';

import { IonDrive } from '../modules/drives/ion-drive';

export const BigCruiserWhiteLaserConfig: ShipConfig = {
    definition: BigCruiserDefinition,
    modules: [
        ...BigCruiserDefinition.markers
            .filter(m => m.type === 'laser' && m.x < 50)
            .map(m => ({ marker: m, module: WhiteLaser })),
        ...BigCruiserDefinition.markers
            .filter(m => m.type === 'drive')
            .map(m => ({ marker: m, module: IonDrive }))
    ]
};
