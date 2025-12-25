import type { LevelConfig, FormationConfig } from './level';
import { SinusFormation, DiamondFormation, type DiamondFormationConfig } from '../formations/index';

import { BloodHunterRedLaser } from '../../../ships/configurations/blood-hunter-red-laser';
import { BloodFighterBigRedLaser } from '../../../ships/configurations/blood-fighter-big-red-laser';
import { BloodBomberBloodRocket } from '../../../ships/configurations/blood-bomber-blood-rocket';

// Helper for Diamond Formations
const createDiamondConfig = (
    startWidthPercentage: number,
    endWidthPercentage: number,
    formationGrid?: number[],
    startDelay: number = 0
): FormationConfig => {
    const config: Partial<DiamondFormationConfig> = {
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
        shipConfig: BloodFighterBigRedLaser,
        count: 1,
        interval: 3000,
        startDelay: startDelay,
        config: config
    };
};

// Helper for Sinus Formations
const createSinusConfig = (): FormationConfig => ({
    formationType: SinusFormation,
    shipConfig: BloodHunterRedLaser,
    count: 1,
    interval: 2000,
    config: {
        enemyCount: { min: 3, max: 5 }
    }
});

// Helper for Bomber Formations
const createBomberConfig = (): FormationConfig => ({
    formationType: DiamondFormation,
    shipConfig: BloodBomberBloodRocket,
    count: 1,
    interval: 4000,
    config: {
        startWidthPercentage: 0.2,
        endWidthPercentage: 0.8,
        formationGrid: [2, 3], // 2 front, 3 back
        spacing: 100,
        verticalSpacing: 80,
    }
});

export const BloodHuntersLevel: LevelConfig = {
    name: 'Blood Hunters',
    formations: [
        [
            createBomberConfig()
        ],
        [
            createBomberConfig()
        ],
        [
            createSinusConfig(),
            createDiamondConfig(0.25, 0.5, [1, 2, 3], 1000) // Center
        ],
        [
            createBomberConfig()
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
