import type { LevelConfig } from './level';
import { DiamondFormation } from '../formations/diamond-formation';
import { PathTactic } from '../tactics/path-tactic';
import { SinusSegment } from '../tactics/path-segments/sinus-segment';
import { CoordinateSegment } from '../tactics/path-segments/coordinate-segment';
import { PlayerTargetSegment } from '../tactics/path-segments/player-target-segment';
import { BloodHunterRedLaserConfig } from '../../../ships/configurations/blood-hunter-red-laser';
import { BloodBomberBloodRocketConfig } from '../../../ships/configurations/blood-bomber-blood-rocket';

export const BloodHuntersDiscoveryLevel: LevelConfig = {
    name: 'Blood Hunters Discovery',
    formations: [
        // Wave 1: single blood hunter straight down, a little to the left
        [
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(0.4, -0.1),
                        new CoordinateSegment(0.4, 1.2)
                    ]
                },
                formationType: DiamondFormation,
                config: {
                    shipFormationGrid: [[BloodHunterRedLaserConfig]],
                    spacing: 0
                }
            }
        ],
        // Wave 2: two blood hunters with sinus
        [
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(0.5, -0.1),
                        new SinusSegment(new CoordinateSegment(0.5, 1.2), 60, 0.002)
                    ]
                },
                formationType: DiamondFormation,
                config: {
                    shipFormationGrid: [[BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]],
                    spacing: 120
                }
            }
        ],
        // Wave 3: three blood hunters in 1,2 formation approaching players ship 50% 80% 100% in three steps
        [
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(0.5, -0.1),
                        new PlayerTargetSegment(0.5),
                        new PlayerTargetSegment(0.8),
                        new PlayerTargetSegment(1.0)
                    ]
                },
                formationType: DiamondFormation,
                config: {
                    shipFormationGrid: [
                        [BloodHunterRedLaserConfig],
                        [BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]
                    ],
                    spacing: 120,
                    verticalSpacing: 80
                }
            }
        ],
        // Wave 4: some blood hunters in 2,2 formation... approaching in three steps 40% 70% 110%
        [
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(0.5, -0.1),
                        new PlayerTargetSegment(0.4),
                        new PlayerTargetSegment(0.7),
                        new PlayerTargetSegment(1.1)
                    ]
                },
                formationType: DiamondFormation,
                config: {
                    shipFormationGrid: [
                        [BloodHunterRedLaserConfig, BloodHunterRedLaserConfig],
                        [BloodHunterRedLaserConfig, BloodHunterRedLaserConfig]
                    ],
                    spacing: 100,
                    verticalSpacing: 80
                }
            }
        ],
        // Wave 5: some blood hunters in 2 formation and sinus pretty straight, 2 formations of: two blood hunters, two blood bombers, 50% 70% approach player, then exit screen
        // "2 formations" might mean two separate WaveRunners in this step, or just one with a larger grid.
        // I'll use two separate runners to make them feel like "2 formations".
        [
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(0.3, -0.1),
                        new SinusSegment(new PlayerTargetSegment(0.5), 30, 0.001),
                        new SinusSegment(new PlayerTargetSegment(0.7), 30, 0.001),
                        new CoordinateSegment(0.3, 1.2)
                    ]
                },
                formationType: DiamondFormation,
                config: {
                    shipFormationGrid: [
                        [BloodHunterRedLaserConfig, BloodHunterRedLaserConfig],
                        [BloodBomberBloodRocketConfig, BloodBomberBloodRocketConfig]
                    ],
                    spacing: 100,
                    verticalSpacing: 80
                }
            },
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        new CoordinateSegment(0.7, -0.1),
                        new SinusSegment(new PlayerTargetSegment(0.5), 30, 0.001),
                        new SinusSegment(new PlayerTargetSegment(0.7), 30, 0.001),
                        new CoordinateSegment(0.7, 1.2)
                    ]
                },
                formationType: DiamondFormation,
                config: {
                    shipFormationGrid: [
                        [BloodHunterRedLaserConfig, BloodHunterRedLaserConfig],
                        [BloodBomberBloodRocketConfig, BloodBomberBloodRocketConfig]
                    ],
                    spacing: 100,
                    verticalSpacing: 80,
                    startDelay: 1000 // Offset the second formation slightly
                }
            }
        ]
    ]
};
