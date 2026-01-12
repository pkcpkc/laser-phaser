import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../../../ships/ship';
import type { ShipConfig } from '../../../ships/types';
import { DiamondFormation, type DiamondFormationConfig } from './diamond-formation';

export class SingleShipFormation extends DiamondFormation {
    constructor(
        scene: Phaser.Scene,
        shipClass: new (scene: Phaser.Scene, x: number, y: number, config: ShipConfig, collisionConfig: ShipCollisionConfig) => Ship,
        collisionConfig: ShipCollisionConfig,
        config?: Partial<DiamondFormationConfig>,
        shipConfigs?: ShipConfig[]
    ) {
        // Enforce 1x1 grid for single ship
        const singleConfig: DiamondFormationConfig = {
            ...config,
            formationGrid: [1], // Single row, single ship
            startWidthPercentage: config?.startWidthPercentage ?? 0.5,
            endWidthPercentage: config?.endWidthPercentage ?? 0.5,
        } as DiamondFormationConfig;

        super(scene, shipClass, collisionConfig, singleConfig, shipConfigs);
    }
}
