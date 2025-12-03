import type { LevelConfig } from './level';
import { SinusWave } from '../formations/sinus';
import { BloodHunter } from '../ships/blood-hunter';

export const BloodHuntersLevel: LevelConfig = {
    name: 'Blood Hunters',
    waves: [
        {
            formationType: SinusWave,
            shipClass: BloodHunter,
            count: 5, // Repeat 3 times
            interval: 2000, // 2 seconds between waves
            config: {
                // Optional: override default SinusWave config here
                enemyCount: { min: 3, max: 5 }
            }
        },
        // Can add more waves here with different configs or formations
    ]
};
