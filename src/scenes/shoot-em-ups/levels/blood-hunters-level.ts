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
        config: {
            shipFormationGrid: [[BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]],
            spacing: 100
        }
    }],
    [{
        tacticType: SinusTactic,
        tacticConfig: {
            amplitude: 50,
            frequency: 0.002
        },
        formationType: DiamondFormation,
        config: {
            shipFormationGrid: [[BloodHunterRedLaserConfig, BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]],
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
        config: {
            shipFormationGrid: [[BloodHunterRedLaserConfig, BloodHunterRedLaserConfig, BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]],
            spacing: 90
        }
    }],
    [
        {
            tacticType: SinusTactic,
            tacticConfig: {
                amplitude: 70,
                frequency: 0.002
            },
            formationType: DiamondFormation,
            config: {
                shipFormationGrid: [[BloodHunterRedLaserConfig, BloodHunterRedLaserConfig, BloodHunterRedLaserConfig, BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]],
                spacing: 80
            }
        }
    ],
    [
        {
            tacticType: SinusTactic,
            tacticConfig: {
                amplitude: 40,
                frequency: 0.0015
            },
            formationType: DiamondFormation,
            startDelay: 1000,
            config: {
                startWidthPercentage: 0.3,
                endWidthPercentage: 0.7,
                shipFormationGrid: [
                    [BloodHunterRedLaserConfig],
                    [BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]
                ],
                spacing: 100,
                verticalSpacing: 70,
                autoFire: true
            }
        }
    ],
    [
        {
            tacticType: SinusTactic,
            tacticConfig: {
                amplitude: 40,
                frequency: 0.0015
            },
            formationType: DiamondFormation,
            config: {
                startWidthPercentage: 0.2,
                endWidthPercentage: 0.8,
                shipFormationGrid: [
                    [BloodHunterRedLaserConfig],
                    [BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]
                ],
                spacing: 100,
                verticalSpacing: 70,
                autoFire: true
            }
        }
    ],
    [
        {
            tacticType: SinusTactic,
            tacticConfig: {
                amplitude: 30,
                frequency: 0.0015
            },
            formationType: DiamondFormation,
            config: {
                startWidthPercentage: 0.25,
                endWidthPercentage: 0.25,
                shipFormationGrid: [
                    [BloodHunterRedLaserConfig],
                    [BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]
                ],
                spacing: 80,
                verticalSpacing: 60,
                autoFire: true
            }
        },
        {
            tacticType: SinusTactic,
            tacticConfig: {
                amplitude: 30,
                frequency: 0.0015
            },
            formationType: DiamondFormation,
            config: {
                startWidthPercentage: 0.75,
                endWidthPercentage: 0.75,
                shipFormationGrid: [
                    [BloodHunterRedLaserConfig],
                    [BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]
                ],
                spacing: 80,
                verticalSpacing: 60,
                autoFire: true
            }
        }
    ]
    ]
};
