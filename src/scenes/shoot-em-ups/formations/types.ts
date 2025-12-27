import type { BaseEnemyData } from './base-formation';

export interface IFormation {
    /**
     * Spawn the formation in the scene
     */
    spawn(): void;

    /**
     * Get all ships managed by this formation
     */
    getShips(): BaseEnemyData[];

    /**
     * Check if formation is complete (all ships destroyed)
     */
    isComplete(): boolean;

    /**
     * Clean up resources
     */
    destroy(): void;

    /**
     * Update the formation (animations, shooting, etc.)
     * Note: Movement should largely be handled by the Tactic, but formations might have local animation.
     */
    update(time: number, delta: number): void;
}
