import type { LevelConfig } from './level';
import { SinusWave } from '../formations/sinus';
import { BloodHunter } from '../ships/blood-hunter';

import { GreenRocketCarrier } from '../ships/green-rocket-carrier';

export const BloodHuntersLevel: LevelConfig = {
    name: 'Blood Hunters',
    waves: [
        {
            formationType: SinusWave,
            shipClass: BloodHunter,
            count: 3,
            interval: 2000,
            config: {
                enemyCount: { min: 3, max: 5 }
            }
        }, {
            formationType: SinusWave, // Reusing SinusWave for now
            shipClass: GreenRocketCarrier,
            count: 3,
            interval: 3000,
            config: {
                enemyCount: { min: 2, max: 4 },
                shotDelay: { min: 2000, max: 3000 },
                shotsPerEnemy: 1
            }
        }
    ]
};
