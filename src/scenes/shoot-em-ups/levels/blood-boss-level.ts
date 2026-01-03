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
        private shipConfigs?: ShipConfig[]
    ) { }

    spawn() {
        if (this.shipConfigs && this.shipConfigs.length > 0) {
            console.log('BloodBossLevel: Spawning boss!');
            // Spawn off-screen at random X, tactic will move it in
            const startX = Phaser.Math.Between(0, this.scene.scale.width);
            const startY = -200;
            this.ship = new this.shipClass(this.scene, startX, startY, this.shipConfigs[0], this.collisionConfig);
            console.log(`BloodBossLevel: Boss spawned at ${startX}, ${startY}`);
        }
    }

    getShips() {
        if (this.ship) {
            return [{ ship: this.ship, spawnTime: this.scene.time.now }];
        }
        return [];
    }

    isComplete(): boolean {
        return !this.ship || !this.ship.sprite.active;
    }

    update(_time: number, _delta: number): void {
        // Tactic handles all movement; no formation-specific logic needed
    }

    destroy() {
        if (this.ship) {
            this.ship.destroy();
            this.ship = null;
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
        shipConfigs: [BloodBossConfig],
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
