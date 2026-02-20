import type { LevelConfig, FormationConfig } from './level';
import { BloodBossTactic } from '../tactics/blood-boss-tactic';
import { BloodBossConfig } from '../../../ships/configurations/blood-boss-config';
import { DiamondFormation } from '../formations/diamond-formation';
import { SingleShipFormation } from '../formations/single-ship-formation';
import { PathTactic } from '../tactics/path-tactic';
import { CoordinateSegment } from '../tactics/path-segments/coordinate-segment';
import { SinusSegment } from '../tactics/path-segments/sinus-segment';
import { PlayerTargetSegment } from '../tactics/path-segments/player-target-segment';
import { BloodHunterRedLaserConfig } from '../../../ships/configurations/blood-hunter-red-laser';
import { BloodBomberBloodRocketConfig } from '../../../ships/configurations/blood-bomber-blood-rocket';
import { createAsteroidWave } from './helpers/asteroid-formation-helper';

const createBloodBossFormation = (startDelay: number = 0): FormationConfig => {
    return {
        tacticType: BloodBossTactic,
        tacticConfig: {
            fireDuration: 4000,
            screenFractionY: 0.66,
            movementRadiusFraction: 0.5
        },
        formationType: SingleShipFormation,
        shipConfigs: [BloodBossConfig],
        startDelay
    };
};


export const BloodBossLevel: LevelConfig = {
    name: 'Blood Boss',
    formations: [
        // Wave 1: Blood Hunters in different attack vectors and formations
        [
            // Top-left diagonal approach
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(-0.1, -0.1),
                        new CoordinateSegment(0.4, 0.4),
                        new CoordinateSegment(1.2, 1.2)
                    ]
                },
                formationType: DiamondFormation,
                config: {
                    shipFormationGrid: [[BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]],
                    spacing: 120,
                    autoFire: true,
                    startWidthPercentage: 0.1
                }
            },
            // Top-right diagonal approach (slightly delayed)
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(1.1, -0.1),
                        new CoordinateSegment(0.6, 0.4),
                        new CoordinateSegment(-0.2, 1.2)
                    ]
                },
                formationType: DiamondFormation,
                config: {
                    shipFormationGrid: [[BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]],
                    spacing: 120,
                    autoFire: true,
                    startWidthPercentage: 0.9,
                    startDelay: 2000
                }
            },
            // Center sinusoidal sweep
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(0.5, -0.1),
                        new SinusSegment(new CoordinateSegment(0.5, 1.2), 100, 0.003)
                    ]
                },
                formationType: DiamondFormation,
                config: {
                    shipFormationGrid: [
                        [null, BloodHunterRedLaserConfig, null],
                        [BloodHunterRedLaserConfig, null, BloodHunterRedLaserConfig]
                    ],
                    spacing: 100,
                    verticalSpacing: 80,
                    autoFire: true,
                    startDelay: 4000
                }
            }
        ],

        // Wave 2: Combined formations of blood hunters with blood bombers
        [
            // Large mixed diamond formation
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(0.5, -0.2),
                        new PlayerTargetSegment(0.4),
                        new PlayerTargetSegment(0.8),
                        new CoordinateSegment(0.5, 1.3)
                    ]
                },
                formationType: DiamondFormation,
                config: {
                    shipFormationGrid: [
                        [BloodHunterRedLaserConfig],
                        [BloodBomberBloodRocketConfig, BloodBomberBloodRocketConfig],
                        [BloodHunterRedLaserConfig, BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]
                    ],
                    spacing: 120,
                    verticalSpacing: 90,
                    autoFire: true,
                    startWidthPercentage: 0.5
                }
            },
            // Left flank: Blood Bombers (Approach and Withdraw)
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(0.1, -0.1),
                        new PlayerTargetSegment(0.5),
                        new CoordinateSegment(0.1, 1.2)
                    ]
                },
                formationType: DiamondFormation,
                config: {
                    shipFormationGrid: [[BloodBomberBloodRocketConfig]],
                    autoFire: true,
                    startWidthPercentage: 0.1,
                    startDelay: 3000
                }
            },
            // Right flank: Blood Hunters
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(0.9, -0.1),
                        new SinusSegment(new CoordinateSegment(0.8, 1.2), 60, 0.002)
                    ]
                },
                formationType: DiamondFormation,
                config: {
                    shipFormationGrid: [[BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]],
                    spacing: 100,
                    autoFire: true,
                    startWidthPercentage: 0.9,
                    startDelay: 4500
                }
            },
            // Final heavy charge
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(0.5, -0.1),
                        new PlayerTargetSegment(0.6),
                        new PlayerTargetSegment(1.2)
                    ]
                },
                formationType: DiamondFormation,
                config: {
                    shipFormationGrid: [
                        [BloodHunterRedLaserConfig, BloodHunterRedLaserConfig],
                        [BloodBomberBloodRocketConfig, BloodBomberBloodRocketConfig]
                    ],
                    spacing: 140,
                    verticalSpacing: 100,
                    autoFire: true,
                    startDelay: 7000
                }
            }
        ],

        // Wave 3: the blood boss with some random asteroids, single blood hunters and combined formations.
        [
            createBloodBossFormation(2000),
            ...createAsteroidWave(15, 0, 0.9, { small: 0.4, medium: 0.4, large: 0.2 }, 1000, 3000),

            // Periodic Blood Hunter escorts
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(0.2, -0.1),
                        new PlayerTargetSegment(0.5),
                        new CoordinateSegment(0.8, 1.2)
                    ]
                },
                formationType: DiamondFormation,
                config: {
                    shipFormationGrid: [[BloodHunterRedLaserConfig]],
                    autoFire: true,
                    startWidthPercentage: 0.2,
                    startDelay: 10000
                }
            },
            // Early V-formation squad
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(0.5, -0.1),
                        new CoordinateSegment(0.5, 0.4),
                        new SinusSegment(new CoordinateSegment(0.5, 1.2), 80, 0.002)
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
                    autoFire: true,
                    startDelay: 6000
                }
            },
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(0.8, -0.1),
                        new PlayerTargetSegment(0.5),
                        new CoordinateSegment(0.2, 1.2)
                    ]
                },
                formationType: DiamondFormation,
                config: {
                    shipFormationGrid: [[BloodHunterRedLaserConfig]],
                    autoFire: true,
                    startWidthPercentage: 0.8,
                    startDelay: 15000
                }
            },
            // Bomber pair
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(0.3, -0.1),
                        new PlayerTargetSegment(0.7),
                        new CoordinateSegment(0.7, 1.3)
                    ]
                },
                formationType: DiamondFormation,
                config: {
                    shipFormationGrid: [[BloodBomberBloodRocketConfig, BloodBomberBloodRocketConfig]],
                    spacing: 150,
                    autoFire: true,
                    startDelay: 20000
                }
            },

            // Mixed support formation (Approach and Withdraw)
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(0.5, -0.2),
                        new PlayerTargetSegment(0.4),
                        new PlayerTargetSegment(0.8),
                        new CoordinateSegment(0.5, 1.3)
                    ]
                },
                formationType: DiamondFormation,
                config: {
                    shipFormationGrid: [
                        [BloodHunterRedLaserConfig, BloodBomberBloodRocketConfig, BloodHunterRedLaserConfig]
                    ],
                    spacing: 120,
                    autoFire: true,
                    startDelay: 30000
                }
            },

            // Late heavy sweep
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(0.1, -0.1),
                        new CoordinateSegment(0.9, 0.5),
                        new CoordinateSegment(0.1, 1.2)
                    ]
                },
                formationType: DiamondFormation,
                config: {
                    shipFormationGrid: [
                        [BloodHunterRedLaserConfig, BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]
                    ],
                    spacing: 80,
                    autoFire: true,
                    startDelay: 40000
                }
            }
        ]
    ]
};
