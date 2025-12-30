import type { LevelConfig } from './level';
import type { FormationConfig } from './level';
import { BloodBossTactic } from '../tactics/blood-boss-tactic';
import { BloodBossConfig } from '../../../ships/configurations/blood-boss-config';
import type { IFormationConstructor } from './level';
import { Ship } from '../../../ships/ship';
import type { ShipCollisionConfig } from '../../../ships/types';
import type { ShipConfig } from '../../../ships/types';
import Phaser from 'phaser';

// Simple Single Ship Formation
class SingleShipFormation {
    private ship: Ship | null = null;

    constructor(
        private scene: Phaser.Scene,
        private shipClass: new (scene: Phaser.Scene, x: number, y: number, config: ShipConfig, collisionConfig: ShipCollisionConfig) => Ship,
        private collisionConfig: ShipCollisionConfig,
        _config: any,
        private shipConfig?: ShipConfig
    ) { }

    spawn() {
        if (this.shipConfig) {
            console.log('BloodBossLevel: Spawning boss!');
            // Spawn off-screen at random X, tactic will move it in
            const startX = Phaser.Math.Between(0, this.scene.scale.width);
            const startY = -200;
            this.ship = new this.shipClass(this.scene, startX, startY, this.shipConfig, this.collisionConfig);
            console.log(`BloodBossLevel: Boss spawned at ${startX}, ${startY}`);
        }
    }

    update(_time: number, _delta: number) {
        if (this.ship && this.ship.sprite && this.ship.sprite.active) {
            // Ship logic handled by tactic
        }
    }

    getShips() {
        if (this.ship && this.ship.sprite && this.ship.sprite.active) {
            return [{ ship: this.ship, spawnTime: 0 }];
        }
        return [];
    }

    isComplete() {
        return !this.ship || !this.ship.sprite.active;
    }

    destroy() {
        if (this.ship) {
            this.ship.destroy();
        }
    }
}

const createBloodBossFormation = (): FormationConfig => {
    return {
        tacticType: BloodBossTactic,
        tacticConfig: {
            fireDuration: 4000,
            screenFractionY: 0.66,
            movementRadiusFraction: 0.5
        },
        formationType: SingleShipFormation as any as IFormationConstructor,
        shipConfig: BloodBossConfig,
        count: 1, // 1 Boss
        startDelay: 1000
    };
};

export const BloodBossLevel: LevelConfig = {
    name: 'Blood Boss',
    formations: [
        [
            createBloodBossFormation()
        ]
    ]
};
