import type { IFormation, IFormationConstructor } from '../formations/types';
import type { ShipCollisionConfig } from '../../../ships/ship';
import type { ShipConfig } from '../../../ships/types';

export interface ITactic {
    /**
     * Initializes the tactic with formation parameters.
     */
    initialize(
        scene: Phaser.Scene,
        formationType: IFormationConstructor,
        formationConfig: any,
        shipClass: any,
        shipConfigs: ShipConfig[],
        collisionConfig: ShipCollisionConfig
    ): void;

    /**
     * Spawns the managed formation.
     */
    spawn(): void;

    /**
     * Assigns a formation to this tactic.
     */
    addFormation(formation: IFormation): void;

    /**
     * Updates the movement of assigned formations.
     */
    update(time: number, delta: number): void;

    /**
     * Check if all formations are complete.
     */
    isComplete(): boolean;

    /**
     * Clean up resources.
     */
    destroy(): void;
}
