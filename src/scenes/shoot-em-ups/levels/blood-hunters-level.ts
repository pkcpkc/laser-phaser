import type { LevelConfig, FormationConfig } from './level';
import { DiamondFormation, type DiamondFormationConfig } from '../formations/diamond-formation';
// New imports
import { LineFormation } from '../formations/line-formation';
import { SinusTactic } from '../tactics/sinus-tactic';
import { LinearTactic } from '../tactics/linear-tactic';

import { BloodHunterRedLaserConfig } from '../../../ships/configurations/blood-hunter-red-laser';
import { BloodFighterBigRedLaserConfig } from '../../../ships/configurations/blood-fighter-big-red-laser';
import { BloodBomberBloodRocketConfig } from '../../../ships/configurations/blood-bomber-blood-rocket';

// Helper for Diamond Formations (with Linear Travel)
const createDiamondConfig = (
    startWidthPercentage: number,
    endWidthPercentage: number,
    formationGrid?: number[],
    startDelay: number = 0
): FormationConfig => {
    // Calculate angle for LinearTactic from start% to end%
    // Assuming 800 width, 600 height for simplicity or just angles.
    // Normalized 0 to 1.
    // We can't easily calculate exact angle without screen dimensions here unless we assume standard.
    // Or we use LinearTactic with targetX? I haven't implemented targetX yet.
    // Let's use angle.
    // Center to Center = Down (PI/2)
    // Left (0.25) to Center (0.5) -> Moving Right-Down.
    // Right (0.75) to Center (0.5) -> Moving Left-Down.

    // Approximate angles:
    // If start != end, we need an angle.
    let angle = Math.PI / 2;
    if (Math.abs(startWidthPercentage - endWidthPercentage) > 0.1) {
        // dx = (end - start) * width
        // dy = height
        // angle = atan2(dy, dx)
        // Let's assume aspect ratio 4:3 (800x600).
        // deltaX = (end - start) * 800
        // deltaY = 600 + buffer
        // angle = atan2(deltaY, deltaX)
        const dx = (endWidthPercentage - startWidthPercentage) * 800;
        const dy = 600 + 200;
        angle = Math.atan2(dy, dx);
    }

    const config: Partial<DiamondFormationConfig> = {
        startWidthPercentage,
        // endWidthPercentage unused now by Formation, Tactic handles path
        spacing: 90,
        verticalSpacing: 70,
        shotDelay: { min: 2000, max: 3000 },
        continuousFire: true,
        shootingChance: 1.0,
        rotation: angle - Math.PI / 2 // Rotate formation to match travel
    };

    if (formationGrid) {
        config.formationGrid = formationGrid;
    }

    return {
        tacticType: LinearTactic,
        tacticConfig: {
            angle: angle
        },
        formationType: DiamondFormation,
        shipConfigs: [BloodFighterBigRedLaserConfig],
        count: 1,
        interval: 3000,
        startDelay: startDelay,
        config: config
    };
};

// Helper for Sinus Formations (Line + SinusTactic)
const createSinusConfig = (): FormationConfig => ({
    tacticType: SinusTactic,
    tacticConfig: {
        amplitude: 50,
        frequency: 0.002
    },
    formationType: LineFormation,
    shipConfigs: [BloodHunterRedLaserConfig],
    count: 1,
    interval: 2000,
    config: {
        enemyCount: { min: 3, max: 5 },
        spacing: 100,
        verticalOffset: 60
    }
});

// Helper for Bomber Formations
const createBomberConfig = (): FormationConfig => {
    // Start 0.2, End 0.8
    const angle = Math.atan2(800, (0.8 - 0.2) * 800); // Rough approximation

    return {
        tacticType: LinearTactic,
        tacticConfig: {
            angle: angle
        },
        formationType: DiamondFormation,
        shipConfigs: [BloodBomberBloodRocketConfig],
        count: 1,
        interval: 4000,
        config: {
            startWidthPercentage: 0.2,
            formationGrid: [2, 4], // 2 front, 3 back
            spacing: 100,
            verticalSpacing: 80,
            rotation: angle - Math.PI / 2
        }
    };
};

export const BloodHuntersLevel: LevelConfig = {
    name: 'Blood Hunters',
    formations: [
        [
            createSinusConfig(),
            createDiamondConfig(0.25, 0.5, [1, 2], 1000) // Center
        ],
        [
            createBomberConfig()
        ],
        [
            createDiamondConfig(0.75, 0.5) // Start from left
        ]
    ]
};
