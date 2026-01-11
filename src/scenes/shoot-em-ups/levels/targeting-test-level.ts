import type { LevelConfig } from './level';

import { LinearTactic } from '../tactics/linear-tactic';
import { BloodBomberBloodRocketConfig } from '../../../ships/configurations/blood-bomber-blood-rocket';
import { DiamondFormation } from '../formations/diamond-formation';

/**
 * Targeting Test Level
 * Verifies that ships with LinearTactic and NO angle/endWidthPercentage fly towards the player.
 */
export const TargetingTestLevel: LevelConfig = {
    name: 'Targeting Test',
    loop: true,
    formations: [
        [
            {
                tacticType: LinearTactic,
                tacticConfig: {
                    angle: undefined, // Let it calculate targeting angle
                    fireAndWithdraw: true
                },
                formationType: DiamondFormation,
                shipConfigs: [BloodBomberBloodRocketConfig],
                config: {
                    startWidthPercentage: 0.5,
                    spawnY: -100,
                    formationGrid: [1, 2],
                    spacing: 80,
                    verticalSpacing: 60
                }
            }
        ]
    ]
};
