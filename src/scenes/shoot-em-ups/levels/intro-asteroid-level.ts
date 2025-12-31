import type { LevelConfig } from './level';
import { AsteroidFieldFormation } from '../formations/asteroid-field-formation';
import { LinearTactic } from '../tactics/linear-tactic';

/**
 * Intro level - asteroid field only, no enemy ships.
 * Perfect for learning controls without being shot at.
 */
export const IntroAsteroidLevel: LevelConfig = {
    name: 'Asteroid Field',
    formations: [
        // Wave 1: Light asteroid field
        [
            {
                tacticType: LinearTactic,
                tacticConfig: { angle: Math.PI / 2 },
                formationType: AsteroidFieldFormation,
                count: 1,
                config: {
                    count: 4,
                    spawnWidth: 0.7,
                    minSpeed: 0.5,
                    maxSpeed: 1.5,
                    sizeWeights: { small: 0.6, medium: 0.3, large: 0.1 }
                }
            }
        ],
        // Wave 2: More asteroids
        [
            {
                tacticType: LinearTactic,
                tacticConfig: { angle: Math.PI / 2 },
                formationType: AsteroidFieldFormation,
                count: 1,
                startDelay: 500,
                config: {
                    count: 6,
                    spawnWidth: 0.8,
                    minSpeed: 0.8,
                    maxSpeed: 2,
                    sizeWeights: { small: 0.4, medium: 0.4, large: 0.2 }
                }
            }
        ],
        // Wave 3: Dense field with larger asteroids
        [
            {
                tacticType: LinearTactic,
                tacticConfig: { angle: Math.PI / 2 },
                formationType: AsteroidFieldFormation,
                count: 1,
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
