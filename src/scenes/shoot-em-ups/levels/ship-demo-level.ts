import type { LevelConfig } from './level';
import type { ShipConfig } from '../../../ships/types';
import { ExplicitFormation } from '../formations/index';
import { LinearTactic } from '../tactics/linear-tactic';

// Dynamically import all ship configurations from the configurations folder
const configModules = import.meta.glob<{ [key: string]: ShipConfig }>(
    '../../../ships/configurations/*.ts',
    { eager: true }
);

// Extract all ShipConfig exports from the modules
const allShipConfigs: ShipConfig[] = Object.values(configModules).flatMap(
    (module) => Object.values(module).filter((exp): exp is ShipConfig =>
        exp && typeof exp === 'object' && 'definition' in exp && 'mounts' in exp
    )
);

const commonFiringConfig = {
    shootingChance: 1.0,
    shotsPerEnemy: 0,
    continuousFire: true,
    shotDelay: { min: 0, max: 0 },
    oscillate: true,
    oscillateSpeed: 0.05 // pixels per ms
};

// Generate formations dynamically - ships placed in a row starting from top-left
const generateFormations = () => {
    const shipWidth = 50; // Estimated ship width
    const shipSpacing = 100; // Space between ship centers
    const startX = shipWidth; // Start with half ship width offset so first ship is fully visible
    const startY = -100;

    return allShipConfigs.map((shipConfig, index) => {
        const x = startX + (index * shipSpacing);
        // Calculate loop distance roughly to screen height plus buffer
        // Note: We don't have Scene reference here, so we guess standard height + buffer
        const loopLength = 600 + 200; // 800px loop

        return {
            formationType: ExplicitFormation,
            shipConfig,
            count: 1,
            config: {
                positions: [{ x, y: startY }],
                ...commonFiringConfig
            },
            // Add Tactic for oscillation
            tacticType: LinearTactic,
            tacticConfig: {
                // LinearTactic uses: dist = speed * (elapsed / FRAME_DURATION_MS)
                // speed is PX_PER_FRAME.
                // config.oscillateSpeed is 0.05 px/ms -> 0.05 * 16.66 = 0.833 px/frame.
                speed: commonFiringConfig.oscillateSpeed * 16.66,
                angle: Math.PI / 2, // Down
                loopLength: loopLength
            }
        };
    });
};

export const ShipDemoLevel: LevelConfig = {
    name: 'Ship Demo',
    formations: [generateFormations()]
};
