import type { LevelConfig } from './level';
import { SinusWave } from '../waves/sinus';

import { BloodHunter2L } from '../ships/configurations/blood-hunter-2l';
import { GreenRocketCarrier2R } from '../ships/configurations/green-rocket-carrier-2r';

export const BloodHuntersLevel: LevelConfig = {
    name: 'Blood Hunters',
    waves: [
        {
            waveType: SinusWave,
            shipConfig: BloodHunter2L,
            count: 1,
            interval: 2000,
            config: {
                enemyCount: { min: 3, max: 5 }
            }
        }, {
            waveType: SinusWave, // Reusing SinusWave for now
            shipConfig: GreenRocketCarrier2R,
            count: 1,
            interval: 3000,
            config: {
                enemyCount: { min: 2, max: 4 },
                shotDelay: { min: 2000, max: 3000 },
                continuousFire: true,
                shootingChance: 1.0
            }
        }, {
            waveType: SinusWave,
            shipConfig: BloodHunter2L,
            count: 1,
            interval: 2000,
            config: {
                enemyCount: { min: 3, max: 5 }
            }
        }, {
            waveType: SinusWave, // Reusing SinusWave for now
            shipConfig: GreenRocketCarrier2R,
            count: 1,
            interval: 3000,
            config: {
                enemyCount: { min: 2, max: 4 },
                shotDelay: { min: 2000, max: 3000 },
                continuousFire: true,
                shootingChance: 1.0
            }
        }, {
            waveType: SinusWave,
            shipConfig: BloodHunter2L,
            count: 1,
            interval: 2000,
            config: {
                enemyCount: { min: 3, max: 5 }
            }
        }, {
            waveType: SinusWave, // Reusing SinusWave for now
            shipConfig: GreenRocketCarrier2R,
            count: 1,
            interval: 3000,
            config: {
                enemyCount: { min: 2, max: 4 },
                shotDelay: { min: 2000, max: 3000 },
                continuousFire: true,
                shootingChance: 1.0
            }
        }
    ]
};
