import type { ShipConfig } from '../types';
import { BloodHunterDefinition } from '../definitions/blood-hunter';
import { RedLaser } from '../modules/lasers/red-laser';

import { IonDrive } from '../modules/drives/ion-drive';

export const BloodHunterRedLaserConfig: ShipConfig = {
    definition: BloodHunterDefinition,
    modules: [
        ...BloodHunterDefinition.markers
            .filter(m => m.type === 'laser')
            .map(m => ({ marker: m, module: RedLaser })),
        ...BloodHunterDefinition.markers
            .filter(m => m.type === 'drive')
            .map(m => ({ marker: m, module: IonDrive }))
    ],
    loot: {
        text: '🪙',
        dropChance: .5,
        lifespan: 3000,
        type: 'silver',
        value: 1
    }
};
