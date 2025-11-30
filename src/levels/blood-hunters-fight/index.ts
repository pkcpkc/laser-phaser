import Phaser from 'phaser';
import { BloodHuntersSinusWave } from '../../waves/blood-hunters-sinus';

export class BloodHuntersFightLevel {
    private scene: Phaser.Scene;
    private currentWave: BloodHuntersSinusWave | null = null;
    private enemyCategory: number;
    private laserCategory: number;
    private shipCategory: number;
    private enemyLaserCategory: number;
    private isActive: boolean = false;

    constructor(
        scene: Phaser.Scene,
        enemyCategory: number,
        laserCategory: number,
        shipCategory: number,
        enemyLaserCategory: number
    ) {
        this.scene = scene;
        this.enemyCategory = enemyCategory;
        this.laserCategory = laserCategory;
        this.shipCategory = shipCategory;
        this.enemyLaserCategory = enemyLaserCategory;
    }

    start() {
        this.isActive = true;
        this.spawnWave();
    }

    private spawnWave() {
        if (!this.isActive) return;

        this.currentWave = new BloodHuntersSinusWave(
            this.scene,
            this.enemyCategory,
            this.laserCategory,
            this.shipCategory,
            this.enemyLaserCategory
        );
        this.currentWave.spawn();
    }

    update(time: number) {
        if (!this.isActive) return;

        if (this.currentWave) {
            this.currentWave.update(time);

            // Respawn wave if current one is complete
            if (this.currentWave.isComplete()) {
                this.currentWave = null;
                this.spawnWave();
            }
        }
    }

    getEnemies() {
        return this.currentWave ? this.currentWave.getEnemies() : [];
    }

    stop() {
        this.isActive = false;
        if (this.currentWave) {
            this.currentWave.destroy();
            this.currentWave = null;
        }
    }

    destroy() {
        this.stop();
    }
}
