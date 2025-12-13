import BaseScene from '../base-scene';
import { Level } from '../../levels/level';

export abstract class ShootEmUpScene extends BaseScene {
    protected level: Level | null = null;

    constructor(key: string) {
        super(key);
    }

    create() {
        super.create();
        this.startLevel();
        this.createBackButton();
    }

    protected abstract getLevelClass(): any;

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

        const LevelClass = this.getLevelClass();
        this.level = new Level(
            this,
            LevelClass,
            collisionConfig
        );
        this.level.start();
    }

    private createBackButton() {
        // TEMP: Back to Map Button
        const { width } = this.scale;
        this.add.text(width - 100, 50, '🔙 Map', {
            fontSize: '24px',
            backgroundColor: '#000000'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.finishLevel();
            });
    }

    protected finishLevel() {
        if (this.level) {
            this.level.destroy();
            this.level = null;
        }
        this.scene.start('PlanetMapScene');
    }

    protected handleGameOver() {
        super.handleGameOver();
        if (this.level) {
            this.level.destroy();
            this.level = null;
        }
    }

    protected onGameOverInput() {
        this.finishLevel();
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
