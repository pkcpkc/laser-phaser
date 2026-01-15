import type { LevelConfig } from './level';
import { DiamondFormation } from '../formations/diamond-formation';

import { PathTactic } from '../tactics/path-tactic';
import { SinusSegment } from '../tactics/path-segments/sinus-segment';
import { CoordinateSegment } from '../tactics/path-segments/coordinate-segment';
import { BloodHunterRedLaserConfig } from '../../../ships/configurations/blood-hunter-red-laser';

export const BloodHuntersLevel: LevelConfig = {
    name: 'Blood Hunters',
    formations: [[{
        tacticType: PathTactic,
        tacticConfig: {
            points: [
                new CoordinateSegment(0.5, -0.1),
                new SinusSegment(new CoordinateSegment(0.5, 1.2), 50, 0.002)
            ]
        },
        formationType: DiamondFormation,
        config: {
            shipFormationGrid: [[BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]],
            spacing: 100
        }
    }],
    [{
        tacticType: PathTactic,
        tacticConfig: {
            points: [
                new CoordinateSegment(0.5, -0.1),
                new SinusSegment(new CoordinateSegment(0.5, 1.2), 50, 0.002)
            ]
        },
        formationType: DiamondFormation,
        config: {
            shipFormationGrid: [[BloodHunterRedLaserConfig, BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]],
            spacing: 100
        }
    }],
    [{
        tacticType: PathTactic,
        tacticConfig: {
            points: [
                new CoordinateSegment(0.5, -0.1),
                new SinusSegment(new CoordinateSegment(0.5, 1.2), 60, 0.002)
            ]
        },
        formationType: DiamondFormation,
        config: {
            shipFormationGrid: [[BloodHunterRedLaserConfig, BloodHunterRedLaserConfig, BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]],
            spacing: 90
        }
    }],
    [
        {
            tacticType: PathTactic,
            tacticConfig: {
                points: [
                    new CoordinateSegment(0.5, -0.1),
                    new SinusSegment(new CoordinateSegment(0.5, 1.2), 70, 0.002)
                ]
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
            tacticType: PathTactic,
            tacticConfig: {
                points: [
                    new CoordinateSegment(0.3, -0.1),
                    new SinusSegment(new CoordinateSegment(0.7, 1.2), 40, 0.0015)
                ]
            },
            formationType: DiamondFormation,
            startDelay: 1000,
            config: {
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
            tacticType: PathTactic,
            tacticConfig: {
                points: [
                    new CoordinateSegment(0.2, -0.1),
                    new SinusSegment(new CoordinateSegment(0.8, 1.2), 40, 0.0015)
                ]
            },
            formationType: DiamondFormation,
            config: {
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
            tacticType: PathTactic,
            tacticConfig: {
                points: [
                    new CoordinateSegment(0.25, -0.1),
                    new SinusSegment(new CoordinateSegment(0.25, 1.2), 30, 0.0015)
                ]
            },
            formationType: DiamondFormation,
            config: {
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
            tacticType: PathTactic,
            tacticConfig: {
                points: [
                    new CoordinateSegment(0.75, -0.1),
                    new SinusSegment(new CoordinateSegment(0.75, 1.2), 30, 0.0015)
                ]
            },
            formationType: DiamondFormation,
            config: {
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
