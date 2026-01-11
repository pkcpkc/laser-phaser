import type { LevelConfig } from './level';
import { AsteroidFieldFormation } from '../formations/asteroid-field-formation';
import { LinearTactic } from '../tactics/linear-tactic';

/**
 * Intro level - asteroid field only, no enemy ships.
 * Perfect for learning controls without being shot at.
 *
 * Structure:
 * 1. Warmup (1 asteroid)
 * 2. Duo (2 asteroids)
 * 3. Squad (4 asteroids)
 * 4-7. Increasing intensity (6 -> 12 asteroids)
 */
export const IntroAsteroidLevel: LevelConfig = {
    name: 'Asteroid Field',
    formations: [
        // Wave 1: Warmup - 1 Asteroid
        [
            {
                tacticType: LinearTactic,
                tacticConfig: { angle: Math.PI / 2 },
                formationType: AsteroidFieldFormation,
                config: {
                    count: 1,
                    spawnWidth: 0.3,
                    sizeWeights: { small: 0.0, medium: 0.5, large: 0.5 }
                }
            }
        ],
        // Wave 2: Duo - 2 Asteroids
        [
            {
                tacticType: LinearTactic,
                tacticConfig: { angle: Math.PI / 2 },
                formationType: AsteroidFieldFormation,
                startDelay: 1000,
                config: {
                    count: 2,
                    spawnWidth: 0.5,
                    sizeWeights: { small: 0.2, medium: 0.6, large: 0.2 }
                }
            }
        ],
        // Wave 3: Squad - 4 Asteroids
        [
            {
                tacticType: LinearTactic,
                tacticConfig: { angle: Math.PI / 2 },
                formationType: AsteroidFieldFormation,
                startDelay: 1000,
                config: {
                    count: 4,
                    spawnWidth: 0.7,
                    sizeWeights: { small: 0.3, medium: 0.5, large: 0.2 }
                }
            }
        ],
        // Wave 4: Ramp Up - 6 Asteroids
        [
            {
                tacticType: LinearTactic,
                tacticConfig: { angle: Math.PI / 2 },
                formationType: AsteroidFieldFormation,
                startDelay: 1500,
                config: {
                    count: 8,
                    spawnWidth: 0.8,
                    sizeWeights: { small: 0.4, medium: 0.4, large: 0.2 }
                }
            }
        ],
        // Wave 5: Intense - 8 Asteroids
        [
            {
                tacticType: LinearTactic,
                tacticConfig: { angle: Math.PI / 2 },
                formationType: AsteroidFieldFormation,
                startDelay: 1200,
                config: {
                    count: 12,
                    spawnWidth: 0.9,
                    sizeWeights: { small: 0.3, medium: 0.4, large: 0.3 }
                }
            }
        ],
        // Wave 6: Heavy - 10 Asteroids
        [
            {
                tacticType: LinearTactic,
                tacticConfig: { angle: Math.PI / 2 },
                formationType: AsteroidFieldFormation,
                startDelay: 900,
                config: {
                    count: 20,
                    spawnWidth: 0.95,
                    sizeWeights: { small: 0.2, medium: 0.5, large: 0.3 }
                }
            }
        ],
        // Wave 7: Chaos - 12 Asteroids
        [
            {
                tacticType: LinearTactic,
                tacticConfig: { angle: Math.PI / 2 },
                formationType: AsteroidFieldFormation,
                startDelay: 600,
                config: {
                    count: 35,
                    spawnWidth: 1.0,
                    sizeWeights: { small: 0.1, medium: 0.4, large: 0.5 }
                }
            }
        ]
    ]
};
