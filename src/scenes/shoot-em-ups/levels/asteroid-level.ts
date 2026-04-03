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
 * 1. Warmup (4 asteroids)
 * 2. Intense (12 asteroids)
 * 3. Heavy (20 asteroids)
 *
 * Refactored to use individual formations per asteroid for independent speeds.
 */
export const AsteroidLevel: LevelConfig = {
    name: 'Asteroid Field',
    formations: [
        // Wave 1: Warmup - 4 Asteroids
        createAsteroidWave(4, 0, 0.7, { small: 0.3, medium: 0.5, large: 0.2 }),

        // Wave 2: Intense - 12 Asteroids
        createAsteroidWave(12, 1500, 0.9, { small: 0.3, medium: 0.4, large: 0.3 }, 100, 300),

        // Wave 3: Heavy - 20 Asteroids
        createAsteroidWave(20, 1200, 0.95, { small: 0.2, medium: 0.5, large: 0.3 }, 80, 250)
    ]
};

