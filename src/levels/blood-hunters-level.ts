import type { LevelConfig } from './level';
import { SinusFormation, DiamondFormation } from '../formations/index.ts';

import { BloodHunter2L } from '../ships/configurations/blood-hunter-2l';
import { BloodFighter2L } from '../ships/configurations/blood-fighter-2l';

export const BloodHuntersLevel: LevelConfig = {
    name: 'Blood Hunters',
    formations: [
        [
            {
                formationType: SinusFormation,
                shipConfig: BloodHunter2L,
                count: 1,
                interval: 2000,
                config: {
                    enemyCount: { min: 3, max: 5 }
                }
            },
            {
                formationType: DiamondFormation,
                shipConfig: BloodFighter2L,
                count: 1,
                interval: 3000,
                startDelay: 1000,
                config: {
                    startWidthPercentage: 0.25, // Center
                    endWidthPercentage: 0.5,   // Straight down
                    spacing: 90,
                    verticalSpacing: 70,
                    shotDelay: { min: 2000, max: 3000 },
                    continuousFire: true,
                    shootingChance: 1.0,
                    formationGrid: [1, 2, 3]
                }
            }
        ], [
            {
                formationType: SinusFormation,
                shipConfig: BloodHunter2L,
                count: 1,
                interval: 2000,
                config: {
                    enemyCount: { min: 3, max: 5 }
                }
            }
        ], [
            {
                formationType: DiamondFormation,
                shipConfig: BloodFighter2L,
                count: 1,
                interval: 3000,
                config: {
                    startWidthPercentage: 0.75, // Start from left
                    endWidthPercentage: 0.5,   // Aim right
                    spacing: 90,
                    verticalSpacing: 70,
                    shotDelay: { min: 2000, max: 3000 },
                    continuousFire: true,
                    shootingChance: 1.0
                }
            }
        ], [
            {
                formationType: SinusFormation,
                shipConfig: BloodHunter2L,
                count: 1,
                interval: 2000,
                config: {
                    enemyCount: { min: 3, max: 5 }
                }
            }
        ], [
            {
                formationType: DiamondFormation,
                shipConfig: BloodFighter2L,
                count: 1,
                interval: 3000,
                config: {
                    startWidthPercentage: 0.5, // Start from right
                    endWidthPercentage: 0.5,   // Aim left
                    spacing: 90,
                    verticalSpacing: 70,
                    shotDelay: { min: 2000, max: 3000 },
                    continuousFire: true,
                    shootingChance: 1.0
                }
            }
        ]
    ]
};




