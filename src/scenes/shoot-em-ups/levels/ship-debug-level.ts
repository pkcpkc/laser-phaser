import type { LevelConfig } from './level';
import { AsteroidFieldFormation } from '../formations/asteroid-field-formation';
import { LinearTactic } from '../tactics/linear-tactic';

/**
 * Ship Debug Level - Asteroid field for testing ship configurations.
 * Identical to IntroAsteroidLevel but used for the debug mode.
 */
export const ShipDebugLevel: LevelConfig = {
    name: 'Ship Debug',
    loop: true,
    formations: [
        // Constant stream of asteroids
        [
            {
                tacticType: LinearTactic,
                tacticConfig: { angle: Math.PI / 2, loopLength: 2000 },
                formationType: AsteroidFieldFormation,
                config: {
                    count: 8,
                    spawnWidth: 0.9,
                    minSpeed: 1,
                    maxSpeed: 2.5,
                    sizeWeights: { small: 0.3, medium: 0.4, large: 0.3 }
                }
            }
        ]
    ]
};
