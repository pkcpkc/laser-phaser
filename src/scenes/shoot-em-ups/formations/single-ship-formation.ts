import Phaser from 'phaser';
import type { IFormation } from './types';
import type { ShipConfig } from '../../../ships/types';
import { Ship, type ShipCollisionConfig } from '../../../ships/ship';

// Simple Single Ship Formation
export class SingleShipFormation implements IFormation {
    private ship: Ship | null = null;
    constructor(
        private scene: Phaser.Scene,
        private shipClass: new (scene: Phaser.Scene, x: number, y: number, config: ShipConfig, collisionConfig: ShipCollisionConfig) => Ship,
        private collisionConfig: ShipCollisionConfig,
        _config: any,
        private shipConfigs?: ShipConfig[]
    ) { }

    spawn() {
        const x = this.scene.cameras.main.width / 2;
        const y = -100; // Spawn offscreen top

        // Use the first config if provided, otherwise default to a minimal empty config
        const shipConfig = this.shipConfigs?.[0] || {} as ShipConfig;
        this.ship = new this.shipClass(this.scene, x, y, shipConfig, this.collisionConfig);
        // this.scene.add.existing(this.ship); Ship constructor already does this
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
        // Nothing to update in formation itself
    }

    destroy() {
        if (this.ship) {
            this.ship.destroy();
            this.ship = null;
        }
    }
}
