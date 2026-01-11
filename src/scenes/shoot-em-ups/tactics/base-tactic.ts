import type { ITactic } from './types';
import type { IFormation, IFormationConstructor } from '../formations/types';
import type { ShipCollisionConfig } from '../../../ships/ship';
import type { ShipConfig } from '../../../ships/types';

export abstract class BaseTactic implements ITactic {
    protected formations: IFormation[] = [];
    protected initData?: {
        scene: Phaser.Scene,
        formationType: IFormationConstructor,
        formationConfig: any,
        shipClass: any,
        shipConfigs: ShipConfig[],
        collisionConfig: ShipCollisionConfig
    };

    initialize(
        scene: Phaser.Scene,
        formationType: IFormationConstructor,
        formationConfig: any,
        shipClass: any,
        shipConfigs: ShipConfig[],
        collisionConfig: ShipCollisionConfig
    ): void {
        this.initData = {
            scene,
            formationType,
            formationConfig,
            shipClass,
            shipConfigs,
            collisionConfig
        };
    }

    spawn(): void {
        if (!this.initData) {
            console.warn('Tactic spawn called before initialize');
            return;
        }

        const formation = new this.initData.formationType(
            this.initData.scene,
            this.initData.shipClass,
            this.initData.collisionConfig,
            this.initData.formationConfig ?? {},
            this.initData.shipConfigs
        );
        formation.spawn();
        this.addFormation(formation);
    }

    addFormation(formation: IFormation): void {
        this.formations.push(formation);
    }

    update(time: number, delta: number): void {
        // Clean up completed or destroyed formations from the list
        this.formations = this.formations.filter(f => !f.isComplete());

        for (const formation of this.formations) {
            formation.update(time, delta);
            this.updateFormation(formation, time, delta);
        }
    }

    isComplete(): boolean {
        return this.formations.length === 0;
    }

    destroy(): void {
        for (const formation of this.formations) {
            formation.destroy();
        }
        this.formations = [];
    }

    protected abstract updateFormation(formation: IFormation, time: number, delta: number): void;
}
