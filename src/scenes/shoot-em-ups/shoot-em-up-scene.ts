import BaseScene from '../base-scene';
import { Level } from '../../levels/level';

export abstract class ShootEmUpScene extends BaseScene {
    protected level: Level | null = null;
    protected returnPlanetId?: string;
    protected warpUniverseId?: string;

    constructor(key: string) {
        super(key);
    }

    init(data: { returnPlanetId?: string, warpUniverseId?: string }) {
        this.returnPlanetId = data?.returnPlanetId;
        this.warpUniverseId = data?.warpUniverseId;
    }

    create() {
        super.create();
        this.startLevel();

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




    protected finishLevel(victory: boolean = false) {
        if (this.level) {
            this.level.destroy();
            this.level = null;
        }

        const sceneData: { planetId?: string, victory?: boolean, universeId?: string } = {
            planetId: this.returnPlanetId,
            victory: victory
        };

        // If victory, check for universe warp
        if (victory && this.warpUniverseId) {
            sceneData.universeId = this.warpUniverseId;
        }

        this.scene.start('PlanetMapScene', sceneData);
    }

    protected handleVictory() {
        // Stop the game/level logic
        if (this.level) {
            this.level.destroy();
            this.level = null;
        }

        this.gameManager.handleVictory();
    }

    protected handleGameOver() {
        super.handleGameOver();
        if (this.level) {
            this.level.destroy();
            this.level = null;
        }
    }

    protected onGameOverInput() {
        // Find if we are in victory or game over state
        const isVictory = this.gameManager.isVictoryState();
        this.finishLevel(isVictory);
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
