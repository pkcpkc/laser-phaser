import BaseScene from '../base-scene';
import { Level, type LevelConfig } from './levels/level';
import { GameStatus } from '../../logic/game-status';
import { Loot } from '../../ships/loot';

export abstract class ShootEmUpScene extends BaseScene {
    protected level: Level | null = null;
    protected returnPlanetId?: string;

    protected warpGalaxyId?: string;
    protected planetColor?: string;
    protected levelId?: string;

    constructor(key: string) {
        super(key);
    }

    init(data: { returnPlanetId?: string, warpGalaxyId?: string, planetColor?: string, levelId?: string, galaxyId?: string }) {
        this.isTransitioning = false;
        this.returnPlanetId = data?.returnPlanetId;
        this.warpGalaxyId = data?.warpGalaxyId;
        this.planetColor = data?.planetColor;
        this.levelId = data?.levelId;
        // If we are playing a level in a galaxy, we need to know WHICH galaxy to credit the victory to.
        // We can either pass it in data or assume it's the current one if not passed?
        // But ShootEmUpScene doesn't HAVE a 'current galaxy' concept unless passed.
        // I will add galaxyId to the class properties.
        if (data?.galaxyId) {
            this.registry.set('activeGalaxyId', data.galaxyId);
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

        const sceneData: { planetId?: string, victory?: boolean, galaxyId?: string } = {
            planetId: this.returnPlanetId,
            victory: victory,
            galaxyId: this.registry.get('activeGalaxyId')
        };

        // Record the victory in GameStatus
        if (victory && sceneData.galaxyId) {
            GameStatus.getInstance().addVictory(sceneData.galaxyId);
            // Also mark intro as seen so it won't show again after completing the level
            if (this.returnPlanetId) {
                GameStatus.getInstance().markIntroSeen(this.returnPlanetId);
            }
        }

        // If victory, check for galaxy warp - override galaxyId if warping
        if (victory && this.warpGalaxyId) {
            sceneData.galaxyId = this.warpGalaxyId;
        }

        this.scene.start('GalaxyScene', sceneData);
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

        // Find if we are in victory or game over state
        const isVictory = this.gameManager.isVictoryState();

        if (isVictory) {
            // Check if there is any loot remaining
            const lootRemaining = this.children.list.some(child => child instanceof Loot && child.active);
            if (lootRemaining) {
                return;
            }
        }

        this.isTransitioning = true;
        this.finishLevel(isVictory);
    }

    update(time: number, delta: number) {
        super.update(time, delta);

        if (!this.gameManager.isGameActive()) {
            // Even if game is over/victory, we might want to update some things like loot animations?
            // But specifically for victory loot check:
            if (this.gameManager.isVictoryState()) {
                const lootRemaining = this.children.list.some(child => child instanceof Loot && child.active);
                if (lootRemaining) {
                    this.gameManager.setRestartMessage('COLLECT ALL LOOT');
                } else {
                    this.gameManager.setRestartMessage('PRESS FIRE');
                }
            }
            return;
        }

        // Update level
        if (this.level) {
            this.level.update(time, delta);
        }
    }
}
