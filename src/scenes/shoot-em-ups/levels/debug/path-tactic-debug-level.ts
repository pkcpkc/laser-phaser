import type { LevelConfig } from '../level';
import { DiamondFormation } from '../../formations/diamond-formation';
import { PathTactic } from '../../tactics/path-tactic';
import { BloodHunterRedLaserConfig } from '../../../../ships/configurations/blood-hunter-red-laser';

export const PathTacticDemoLevel: LevelConfig = {
    name: 'Path Tactic Demo',
    formations: [
        // Wave 1: ZigZag from Top Left to Bottom Right
        // Wave 4: Kamikaze Swarm (Target Player)
        [
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        [0.2, -0.1], // Start Top Left
                        { type: 'player', approach: 0.8 }, { type: 'player', approach: 1.0 }, // 80% to player position
                        [1.1, 1.1]   // Exit Bottom Right
                    ]
                },
                formationType: DiamondFormation,
                shipConfigs: [BloodHunterRedLaserConfig],
                startDelay: 3000,
                config: {
                    formationGrid: [1],
                    spacing: 50
                }
            },
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        [0.8, -0.1], // Start Top Right
                        { type: 'player', approach: 0.8 }, // 80% to player position
                        [-0.1, 1.1]   // Exit Bottom Left
                    ]
                },
                formationType: DiamondFormation,
                shipConfigs: [BloodHunterRedLaserConfig],
                startDelay: 3500,
                config: {
                    formationGrid: [1],
                    spacing: 50
                }
            }
        ], [
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        [0.1, -0.1], // Start Top Left (offscreen)
                        [0.1, 0.2],  // Down
                        [0.8, 0.4],  // Cross to Right
                        [0.2, 0.6],  // Cross to Left
                        [0.9, 0.8],  // Cross to Right
                        [0.5, 1.2]   // Exit Bottom Center
                    ],
                    faceMovement: true
                },
                formationType: DiamondFormation,
                shipConfigs: [BloodHunterRedLaserConfig],
                config: {
                    formationGrid: [1], // Single ship
                    spacing: 50
                }
            }
        ],
        // Wave 2: Loop (Circle)
        [
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        [0.5, -0.1], // Top Center
                        [0.5, 0.3],  // Center
                        [0.8, 0.3],  // Right
                        [0.8, 0.6],  // Right Down
                        [0.5, 0.6],  // Center Down
                        [0.2, 0.6],  // Left Down
                        [0.2, 0.3],  // Left Top
                        [0.5, 0.3],  // Center (Loop closed)
                        [0.5, 1.2]   // Exit
                    ]
                },
                formationType: DiamondFormation,
                shipConfigs: [BloodHunterRedLaserConfig],
                startDelay: 2000,
                config: {
                    formationGrid: [1, 2], // 3 ships
                    spacing: 60,
                    verticalSpacing: 50
                }
            }
        ],
        // Wave 3: Crossing Paths with multiple Start Points
        // Note: Array of configs allow multiple formations in one wave
        [
            // Left to Right
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        [-0.1, 0.2],
                        [1.1, 0.8]
                    ]
                },
                formationType: DiamondFormation,
                shipConfigs: [BloodHunterRedLaserConfig],
                startDelay: 2000,
                config: {
                    formationGrid: [1],
                    spacing: 50
                }
            },
            // Right to Left
            {
                tacticType: PathTactic,
                tacticConfig: {
                    points: [
                        [1.1, 0.2],
                        [-0.1, 0.8]
                    ]
                },
                formationType: DiamondFormation,
                shipConfigs: [BloodHunterRedLaserConfig],
                startDelay: 2000,
                config: {
                    formationGrid: [1],
                    spacing: 50
                }
            }
        ]

    ]
};
