import BaseScene from '../base-scene';

import { Level } from '../../levels/level';
import { BloodHuntersLevel } from '../../levels/blood-hunters-level';

export default class BloodHuntersScene extends BaseScene {
    private level: Level | null = null;

    constructor() {
        super('BloodHunters');
    }



    create() {
        super.create();

        // Initialize Level
        this.startLevel();
    }

    private startLevel() {
        console.log('Starting Level');
        const categories = this.collisionManager.getCategories();

        const collisionConfig = {
            category: categories.enemyCategory,
            collidesWith: categories.laserCategory | categories.shipCategory,
            laserCategory: categories.enemyLaserCategory,
            laserCollidesWith: categories.shipCategory,
            lootCategory: categories.lootCategory,
            lootCollidesWith: categories.shipCategory
        };

        this.level = new Level(
            this,
            BloodHuntersLevel,
            collisionConfig
        );
        this.level.start();
    }

    protected handleGameOver() {
        super.handleGameOver();
        if (this.level) {
            this.level.destroy();
            this.level = null;
        }
    }

    update(time: number, delta: number) {
        super.update(time, delta);

        if (!this.gameManager.isGameActive()) {
            return;
        }

        // Update level
        if (this.level) {
            this.level.update(time, delta);
        }
    }
}
