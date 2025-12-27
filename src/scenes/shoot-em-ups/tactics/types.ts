import type { IFormation } from '../formations/types';

export interface ITactic {
    /**
     * Assigns a formation to this tactic.
     */
    addFormation(formation: IFormation): void;

    /**
     * Updates the movement of assigned formations.
     */
    update(time: number, delta: number): void;
}
