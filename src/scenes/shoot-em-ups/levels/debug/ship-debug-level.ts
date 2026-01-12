import { SingleShipFormation } from '../../formations/single-ship-formation';
import { SmallAsteroidDustConfig } from '../../../../ships/configurations/asteroid-small-dust';
import { MediumAsteroidDustConfig } from '../../../../ships/configurations/asteroid-medium-dust';
import { LargeAsteroidDustConfig } from '../../../../ships/configurations/asteroid-large-dust';
import type { LevelConfig, FormationConfig } from '../level';
import { PathTactic } from '../../tactics/path-tactic';

/**
 * Ship Debug Level - Asteroid field for testing ship configurations.
 * Identical to IntroAsteroidLevel but used for the debug mode.
 */
export const ShipDebugLevel: LevelConfig = {
    name: 'Ship Debug',
    loop: true,
    formations: [
        // Constant stream of asteroids (replicated wave)
        createDebugWave()
    ]
};

function createDebugWave(): FormationConfig[] {
    const wave: FormationConfig[] = [];
    let currentDelay = 0;
    const count = 8;

    for (let i = 0; i < count; i++) {
        // Random config
        const r = Math.random();
        let cfg = LargeAsteroidDustConfig;
        if (r < 0.3) cfg = SmallAsteroidDustConfig;
        else if (r < 0.7) cfg = MediumAsteroidDustConfig;

        const xPos = Math.random() * 0.9 + 0.05;

        wave.push({
            tacticType: PathTactic,
            tacticConfig: { points: [], faceMovement: false },
            formationType: SingleShipFormation,
            startDelay: currentDelay,
            shipConfigs: [cfg],
            config: {
                startWidthPercentage: xPos,
                endWidthPercentage: xPos,
                rotation: 0
            }
        });

        currentDelay += 300;
    }

    return wave;
}
