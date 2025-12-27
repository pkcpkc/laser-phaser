import type { ITactic } from './types';
import type { IFormation } from '../formations/types';

export abstract class BaseTactic implements ITactic {
    protected formations: IFormation[] = [];

    addFormation(formation: IFormation): void {
        this.formations.push(formation);
    }

    update(time: number, delta: number): void {
        // Clean up completed or destroyed formations
        this.formations = this.formations.filter(f => !f.isComplete());

        for (const formation of this.formations) {
            this.updateFormation(formation, time, delta);
        }
    }

    protected abstract updateFormation(formation: IFormation, time: number, delta: number): void;
}
