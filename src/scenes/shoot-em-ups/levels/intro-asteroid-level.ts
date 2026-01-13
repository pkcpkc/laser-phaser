import type { LevelConfig, FormationConfig } from './level';
import { DiamondFormation } from '../formations/diamond-formation';
import { PathTactic } from '../tactics/path-tactic';
import { SmallAsteroidDustConfig } from '../../../ships/configurations/asteroid-small-dust';
import { MediumAsteroidDustConfig } from '../../../ships/configurations/asteroid-medium-dust';
import { LargeAsteroidDustConfig } from '../../../ships/configurations/asteroid-large-dust';
import type { ShipConfig } from '../../../ships/types';


/**
 * Helper to pick a random asteroid config based on weights.
 */
function getAsteroidConfig(sizeWeights: { small: number; medium: number; large: number }): ShipConfig {
    const random = Math.random();
    if (random < sizeWeights.small) return SmallAsteroidDustConfig;
    if (random < sizeWeights.small + sizeWeights.medium) return MediumAsteroidDustConfig;
    return LargeAsteroidDustConfig;
}

/**
 * Helper to create a wave of individual asteroids.
 * Each asteroid gets its own formation/tactic runner, allowing for independent movement speeds.
 */
function createAsteroidWave(
    count: number,
    startDelay: number,
    spawnWidth: number,
    sizeWeights: { small: number; medium: number; large: number },
    minInterval: number = 200,
    maxInterval: number = 600
): FormationConfig[] {
    const wave: FormationConfig[] = [];
    let currentDelay = startDelay;

    for (let i = 0; i < count; i++) {
        const shipConfig = getAsteroidConfig(sizeWeights);
        const xPos = (Math.random() * spawnWidth) + (1 - spawnWidth) / 2;

        wave.push({
            tacticType: PathTactic,
            tacticConfig: { points: [], faceMovement: false },
            formationType: DiamondFormation,
            startDelay: currentDelay,
            config: {
                shipFormationGrid: [[shipConfig]],
                startWidthPercentage: xPos,
                endWidthPercentage: xPos,
                rotation: 0
            }
        });

        const delay = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;
        currentDelay += delay;
    }

    return wave;
}

/**
 * Intro level - asteroid field only, no enemy ships.
 * Perfect for learning controls without being shot at.
 *
 * Structure:
 * 1. Warmup (1 asteroid)
 * 2. Duo (2 asteroids)
 * 3. Squad (4 asteroids)
 * 4-7. Increasing intensity (6 -> 12 asteroids)
 *
 * Refactored to use individual formations per asteroid for independent speeds.
 */
export const IntroAsteroidLevel: LevelConfig = {
    name: 'Asteroid Field',
    formations: [
        // Wave 1: Warmup - 1 Asteroid
        createAsteroidWave(1, 0, 0.3, { small: 0.0, medium: 0.5, large: 0.5 }),

        // Wave 2: Duo - 2 Asteroids
        createAsteroidWave(2, 1000, 0.5, { small: 0.2, medium: 0.6, large: 0.2 }),

        // Wave 3: Squad - 4 Asteroids
        createAsteroidWave(4, 1000, 0.7, { small: 0.3, medium: 0.5, large: 0.2 }),

        // Wave 4: Ramp Up - 8 Asteroids (Previous count 8)
        createAsteroidWave(8, 1500, 0.8, { small: 0.4, medium: 0.4, large: 0.2 }, 150, 400),

        // Wave 5: Intense - 12 Asteroids
        createAsteroidWave(12, 1200, 0.9, { small: 0.3, medium: 0.4, large: 0.3 }, 100, 300),

        // Wave 6: Heavy - 20 Asteroids
        createAsteroidWave(20, 900, 0.95, { small: 0.2, medium: 0.5, large: 0.3 }, 80, 250),

        // Wave 7: Chaos - 35 Asteroids
        createAsteroidWave(35, 600, 1.0, { small: 0.1, medium: 0.4, large: 0.5 }, 50, 200)
    ]
};
