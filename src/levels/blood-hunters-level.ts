import type { LevelConfig, FormationConfig } from './level';
import { SinusFormation, DiamondFormation } from '../formations/index';

import { BloodHunter2L } from '../ships/configurations/blood-hunter-2l';
import { BloodFighter2L } from '../ships/configurations/blood-fighter-2l';

// Helper for Diamond Formations
const createDiamondConfig = (
    startWidthPercentage: number,
    endWidthPercentage: number,
    formationGrid?: number[],
    startDelay: number = 0
): FormationConfig => {
    const config: any = {
        startWidthPercentage,
        endWidthPercentage,
        spacing: 90,
        verticalSpacing: 70,
        shotDelay: { min: 2000, max: 3000 },
        continuousFire: true,
        shootingChance: 1.0
    };

    if (formationGrid) {
        config.formationGrid = formationGrid;
    }

    return {
        formationType: DiamondFormation,
        shipConfig: BloodFighter2L,
        count: 1,
        interval: 3000,
        startDelay: startDelay,
        config: config
    };
};

// Helper for Sinus Formations
const createSinusConfig = (): FormationConfig => ({
    formationType: SinusFormation,
    shipConfig: BloodHunter2L,
    count: 1,
    interval: 2000,
    config: {
        enemyCount: { min: 3, max: 5 }
    }
});

export const BloodHuntersLevel: LevelConfig = {
    name: 'Blood Hunters',
    formations: [
        [
            createSinusConfig(),
            createDiamondConfig(0.25, 0.5, [1, 2, 3], 1000) // Center
        ],
        [
            createSinusConfig()
        ],
        [
            createDiamondConfig(0.75, 0.5) // Start from left
        ],
        [
            createSinusConfig()
        ],
        [
            createDiamondConfig(0.5, 0.5) // Start from right
        ]
    ]
};
