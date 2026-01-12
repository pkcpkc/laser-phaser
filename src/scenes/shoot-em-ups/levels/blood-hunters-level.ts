import type { LevelConfig } from './level';
import { DiamondFormation } from '../formations/diamond-formation';

import { SinusTactic } from '../tactics/sinus-tactic';
import { BloodHunterRedLaserConfig } from '../../../ships/configurations/blood-hunter-red-laser';

export const BloodHuntersLevel: LevelConfig = {
    name: 'Blood Hunters',
    formations: [[{
        tacticType: SinusTactic,
        tacticConfig: {
            amplitude: 50,
            frequency: 0.002
        },
        formationType: DiamondFormation,
        shipConfigs: [BloodHunterRedLaserConfig],
        config: {
            formationGrid: [2],
            spacing: 100,
            spawnY: -200 // DiamondFormation uses spawnY in config? No, it uses SPAWN_Y constant? 
            // Wait, DiamondFormation hardcodes SPAWN_Y = -200. LineFormation used config.
            // But LineFormation default was -200 too.
            // DiamondFormation config doesn't list spawnY. It's Hardcoded.
            // I should verify if I can change spawnY in DiamondFormation or if I rely on it.
            // DiamondFormation ts: const SPAWN_Y = -200;
            // It does NOT accept spawnY in config.
            // If the usage relied on `spawnY: -200`, we are fine.
        }
    }],
    [{
        tacticType: SinusTactic,
        tacticConfig: {
            amplitude: 50,
            frequency: 0.002
        },
        formationType: DiamondFormation,
        shipConfigs: [BloodHunterRedLaserConfig],
        config: {
            formationGrid: [3],
            spacing: 100
        }
    }],
    [{
        tacticType: SinusTactic,
        tacticConfig: {
            amplitude: 60,
            frequency: 0.002
        },
        formationType: DiamondFormation,
        shipConfigs: [BloodHunterRedLaserConfig],
        config: {
            formationGrid: [4],
            spacing: 90
        }
    }],
    [
        // Sinus Formation (Line + SinusTactic)
        {
            tacticType: SinusTactic,
            tacticConfig: {
                amplitude: 70,
                frequency: 0.002
            },
            formationType: DiamondFormation,
            shipConfigs: [BloodHunterRedLaserConfig],
            config: {
                formationGrid: [5],
                spacing: 80
            }
        }
    ],
    [
        // Diamond Formation (1, 2) with Sinus Tactic
        {
            tacticType: SinusTactic,
            tacticConfig: {
                amplitude: 40,
                frequency: 0.0015
            },
            formationType: DiamondFormation,
            shipConfigs: [BloodHunterRedLaserConfig],
            startDelay: 1000,
            config: {
                startWidthPercentage: 0.3,
                endWidthPercentage: 0.7,
                formationGrid: [1, 2],
                spacing: 100,
                verticalSpacing: 70,
                continuousFire: true,
                shootingChance: 0.8
            }
        }
    ],
    [
        // Larger Diamond Formation (1, 2) with Sinus Tactic
        {
            tacticType: SinusTactic,
            tacticConfig: {
                amplitude: 40,
                frequency: 0.0015
            },
            formationType: DiamondFormation,
            shipConfigs: [BloodHunterRedLaserConfig],
            config: {
                startWidthPercentage: 0.2,
                endWidthPercentage: 0.8,
                formationGrid: [1, 2],
                spacing: 100,
                verticalSpacing: 70,
                continuousFire: true,
                shootingChance: 1.0
            }
        }
    ],
    [
        // Final Wave: Mulitple Diamond Formations (Left and Right)
        {
            tacticType: SinusTactic,
            tacticConfig: {
                amplitude: 30,
                frequency: 0.0015
            },
            formationType: DiamondFormation,
            shipConfigs: [BloodHunterRedLaserConfig],
            config: {
                startWidthPercentage: 0.25,
                endWidthPercentage: 0.25,
                formationGrid: [1, 2],
                spacing: 80,
                verticalSpacing: 60,
                continuousFire: true,
                shootingChance: 1.0
            }
        },
        {
            tacticType: SinusTactic,
            tacticConfig: {
                amplitude: 30,
                frequency: 0.0015
            },
            formationType: DiamondFormation,
            shipConfigs: [BloodHunterRedLaserConfig],
            config: {
                startWidthPercentage: 0.75,
                endWidthPercentage: 0.75,
                formationGrid: [1, 2],
                spacing: 80,
                verticalSpacing: 60,
                continuousFire: true,
                shootingChance: 1.0
            }
        }
    ]
    ]
};
