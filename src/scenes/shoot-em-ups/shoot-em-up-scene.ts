import BaseScene from '../base-scene';
import { Level, type LevelConfig } from './levels/level';
import { GameStatus } from '../../logic/game-status';

export abstract class ShootEmUpScene extends BaseScene {
    protected level: Level | null = null;
    protected returnPlanetId?: string;
    protected warpUniverseId?: string;
    protected planetColor?: string;
    protected levelId?: string;

    constructor(key: string) {
        super(key);
    }

    init(data: { returnPlanetId?: string, warpUniverseId?: string, planetColor?: string, levelId?: string, universeId?: string }) {
        this.isTransitioning = false;
        this.returnPlanetId = data?.returnPlanetId;
        this.warpUniverseId = data?.warpUniverseId;
        this.planetColor = data?.planetColor;
        this.levelId = data?.levelId;
        // If we are playing a level in a universe, we need to know WHICH universe to credit the victory to.
        // We can either pass it in data or assume it's the current one if not passed?
        // But ShootEmUpScene doesn't HAVE a 'current universe' concept unless passed.
        // I will add universeId to the class properties.
        if (data?.universeId) {
            this.registry.set('activeUniverseId', data.universeId);
        }
    }

    protected abstract getLevelClass(): LevelConfig;

    create() {
        super.create();

        // Level Context - Enemy Physics
        const categories = this.collisionManager.getCategories();
        const enemyCollisionConfig = {
            category: categories.enemyCategory,
            collidesWith: categories.shipCategory | categories.laserCategory,
            laserCategory: categories.enemyLaserCategory,
            laserCollidesWith: categories.shipCategory,
            lootCategory: categories.lootCategory,
            lootCollidesWith: categories.shipCategory,
            isEnemy: true
        };

        this.level = new Level(
            this,
            this.getLevelClass(),
            enemyCollisionConfig,
            () => this.handleVictory()
        );
        this.level.start();
    }

    // ... (rest of the file)

    protected finishLevel(victory: boolean = false) {
        if (this.level) {
            this.level.destroy();
            this.level = null;
        }

        if (this.ship) {
            this.ship.destroy();
        }

        const sceneData: { planetId?: string, victory?: boolean, universeId?: string } = {
            planetId: this.returnPlanetId,
            victory: victory,
            universeId: this.registry.get('activeUniverseId')
        };

        // Record the victory in GameStatus
        if (victory && sceneData.universeId) {
            GameStatus.getInstance().addVictory(sceneData.universeId);
        }

        // If victory, check for universe warp - override universeId if warping
        if (victory && this.warpUniverseId) {
            sceneData.universeId = this.warpUniverseId;
        }

        this.scene.start('PlanetMapScene', sceneData);
    }

    protected handleVictory() {
        // We do NOT stop the level here anymore.
        // The game continues (physics, loot collection) until user input.

        this.gameManager.handleVictory(this.planetColor ?? '#ffff00');
    }

    protected handleGameOver() {
        super.handleGameOver();
        if (this.level) {
            this.level.destroy();
            this.level = null;
        }
    }

    protected onGameOverInput() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

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
