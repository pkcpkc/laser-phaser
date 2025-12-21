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
            collisionConfig,
            () => this.handleVictory()
        );
        this.level.start();
    }

    private createBackButton() {
        // TEMP: Back to Map Button
        const { width } = this.scale;
        this.add.text(width - 100, 50, '🔙 Map', {
            fontFamily: 'Oswald, Impact, sans-serif',
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

    protected handleVictory() {
        // Stop the game/level logic
        if (this.level) {
            this.level.destroy();
            this.level = null;
        }

        const { width, height } = this.scale;

        // VICTORY Text
        const victoryText = this.add.text(width * 0.5, height * 0.4, 'VICTORY', {
            fontFamily: 'Oswald, Impact, sans-serif',
            fontSize: '120px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 8,
            shadow: { color: '#000000', fill: true, offsetX: 4, offsetY: 4, blur: 8 }
        }).setOrigin(0.5);

        // Vibrating effect
        this.tweens.add({
            targets: victoryText,
            x: '+=5',
            y: '+=5',
            duration: 50,
            yoyo: true,
            repeat: -1
        });

        // Press FIRE Text
        const fireText = this.add.text(width * 0.5, height * 0.6, 'Press FIRE', {
            fontFamily: 'Oswald, Impact, sans-serif',
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0);

        // Fade in FIRE text
        this.tweens.add({
            targets: fireText,
            alpha: 1,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        // Input to finish
        this.time.delayedCall(1000, () => {
            this.input.once('pointerdown', () => this.finishLevel());
            this.input.keyboard!.once('keydown-SPACE', () => this.finishLevel());
        });
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
