import type { LevelConfig } from './level';
import { DiamondFormation } from '../formations/diamond-formation';
// New imports
import { LineFormation } from '../formations/line-formation';
import { SinusTactic } from '../tactics/sinus-tactic';
import { LinearTactic } from '../tactics/linear-tactic';

import { BloodHunterRedLaserConfig } from '../../../ships/configurations/blood-hunter-red-laser';
import { BloodFighterBigRedLaserConfig } from '../../../ships/configurations/blood-fighter-big-red-laser';
import { BloodBomberBloodRocketConfig } from '../../../ships/configurations/blood-bomber-blood-rocket';



export const BloodHuntersLevel: LevelConfig = {
    name: 'Blood Hunters',
    formations: [[{
        tacticType: SinusTactic,
        tacticConfig: {
            amplitude: 50,
            frequency: 0.002
        },
        formationType: LineFormation,
        shipConfigs: [BloodHunterRedLaserConfig],
        config: {
            enemyCount: 2,
            spacing: 100,
            verticalOffset: 60,
            spawnY: -200
        }
    }],
    [{
        tacticType: SinusTactic,
        tacticConfig: {
            amplitude: 50,
            frequency: 0.002
        },
        formationType: LineFormation,
        shipConfigs: [BloodHunterRedLaserConfig],
        config: {
            enemyCount: 3,
            spacing: 100,
            verticalOffset: 60,
            spawnY: -200
        }
    }],
    [{
        tacticType: SinusTactic,
        tacticConfig: {
            amplitude: 50,
            frequency: 0.002
        },
        formationType: LineFormation,
        shipConfigs: [BloodHunterRedLaserConfig],
        config: {
            enemyCount: 4,
            spacing: 100,
            verticalOffset: 60,
            spawnY: -200
        }
    }],
    [
        // Sinus Formation (Line + SinusTactic)
        {
            tacticType: SinusTactic,
            tacticConfig: {
                amplitude: 50,
                frequency: 0.002
            },
            formationType: LineFormation,
            shipConfigs: [BloodHunterRedLaserConfig],
            config: {
                enemyCount: 5,
                spacing: 100,
                verticalOffset: 60,
                spawnY: -200
            }
        },
        // Diamond Formation Center (Linear Travel)
        {
            tacticType: LinearTactic,
            tacticConfig: {}, // Angle auto-calculated
            formationType: DiamondFormation,
            shipConfigs: [BloodFighterBigRedLaserConfig],
            startDelay: 1000,
            config: {
                startWidthPercentage: 0.25,
                endWidthPercentage: 0.5,
                formationGrid: [1, 2],
                spacing: 90,
                verticalSpacing: 70,
                continuousFire: true,
                shootingChance: 1.0
            }
        }
    ],
    [
        // Bomber Formation
        {
            tacticType: LinearTactic,
            tacticConfig: {}, // Angle auto-calculated
            formationType: DiamondFormation,
            shipConfigs: [BloodBomberBloodRocketConfig],
            config: {
                startWidthPercentage: 0.2,
                endWidthPercentage: 0.8,
                formationGrid: [2, 3],
                spacing: 100,
                verticalSpacing: 80,
                continuousFire: true,
                shotDelay: { min: 0, max: 100 } // Allow weapon rate (500-1500) to control firing
            }
        }
    ],
    [
        // Diamond Formation Left (Linear Travel)
        {
            tacticType: LinearTactic,
            tacticConfig: {}, // Angle auto-calculated
            formationType: DiamondFormation,
            shipConfigs: [BloodFighterBigRedLaserConfig],
            config: {
                startWidthPercentage: 0.75,
                endWidthPercentage: 0.5,
                formationGrid: [1, 3],
                verticalSpacing: 70,
                continuousFire: true,
                shootingChance: 1.0
            }
        }
    ]
    ]
};
