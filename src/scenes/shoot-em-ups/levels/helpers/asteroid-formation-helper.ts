import type { ShipConfig } from '../../../../ships/types';
import type { FormationConfig } from '../level';
import { PathTactic } from '../../tactics/path-tactic';
import { DiamondFormation } from '../../formations/diamond-formation';
import { SmallAsteroidDustConfig } from '../../../../ships/configurations/asteroid-small-dust';
import { MediumAsteroidDustConfig } from '../../../../ships/configurations/asteroid-medium-dust';
import { LargeAsteroidDustConfig } from '../../../../ships/configurations/asteroid-large-dust';

/**
 * Helper to pick a random asteroid config based on weights.
 */
export function getAsteroidConfig(sizeWeights: { small: number; medium: number; large: number }): ShipConfig {
    const random = Math.random();
    if (random < sizeWeights.small) return SmallAsteroidDustConfig;
    if (random < sizeWeights.small + sizeWeights.medium) return MediumAsteroidDustConfig;
    return LargeAsteroidDustConfig;
}

/**
 * Helper to create a wave of individual asteroids.
 */
export function createAsteroidWave(
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
