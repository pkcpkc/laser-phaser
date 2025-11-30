import BaseScene from '../base-scene';
import { BloodHunter } from '../../ships/blood-hunter';
import { SinusWave } from '../../waves/sinus';

export default class BloodHuntersScene extends BaseScene {
    private currentWave: SinusWave | null = null;

    constructor() {
        super('BloodHunters');
    }

    preload() {
        super.preload();
        this.load.image(BloodHunter.assetKey, BloodHunter.assetPath);
    }

    create() {
        super.create();

        // Initialize wave
        this.spawnWave();
    }

    private spawnWave() {
        console.log('Spawning Wave');
        const categories = this.collisionManager.getCategories();

        const collisionConfig = {
            category: categories.enemyCategory,
            collidesWith: categories.laserCategory | categories.shipCategory,
            laserCategory: categories.enemyLaserCategory,
            laserCollidesWith: categories.shipCategory
        };

        this.currentWave = new SinusWave(
            this,
            BloodHunter,
            collisionConfig
        );
        this.currentWave.spawn();
    }

    protected handleGameOver() {
        super.handleGameOver();
        if (this.currentWave) {
            this.currentWave.destroy();
            this.currentWave = null;
        }
    }

    update(time: number, delta: number) {
        super.update(time, delta);

        if (!this.gameManager.isGameActive()) {
            return;
        }

        // Update wave
        if (this.currentWave) {
            this.currentWave.update(time);
            if (this.currentWave.isComplete()) {
                this.spawnWave();
            }
        }
    }
}
