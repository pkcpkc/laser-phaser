import BaseScene from '../base-scene';
import { Level, type LevelConfig } from './levels/level';
import { GameStatus } from '../../logic/game-status';
import { Loot } from '../../ships/loot';
import { getLevelConfig, getLevel } from './level-registry';
import type { ShipConfig } from '../../ships/types';

// Dynamically import all ship configurations for debug mode
const configModules = import.meta.glob<{ [key: string]: ShipConfig }>(
    '../../ships/configurations/*.ts',
    { eager: true }
);

const allShipConfigs: ShipConfig[] = Object.values(configModules).flatMap(
    (module) => Object.values(module).filter((exp): exp is ShipConfig =>
        !!(exp && typeof exp === 'object' && 'definition' in exp && 'modules' in exp)
    )
);

export class ShootEmUpScene extends BaseScene {
    protected level: Level | null = null;
    protected returnPlanetId?: string;

    protected warpGalaxyId?: string;
    protected planetColor?: string;
    protected levelId?: string;

    constructor() {
        super('ShootEmUpScene');
        // Default background, can be overridden by level registry
        this.backgroundTexture = 'blood_nebula';
        this.backgroundFrame = undefined;
    }

    init(data: { returnPlanetId?: string, warpGalaxyId?: string, planetColor?: string, levelId?: string, galaxyId?: string }) {
        this.isTransitioning = false;
        this.returnPlanetId = data?.returnPlanetId;
        this.warpGalaxyId = data?.warpGalaxyId;
        this.planetColor = data?.planetColor;
        this.levelId = data?.levelId;

        // Set background from level registry if available
        if (this.levelId) {
            const levelEntry = getLevel(this.levelId);
            if (levelEntry?.backgroundTexture) {
                this.backgroundTexture = levelEntry.backgroundTexture;
            }
        }

        if (data?.galaxyId) {
            this.registry.set('activeGalaxyId', data.galaxyId);
        }
    }

    protected getLevelClass(): LevelConfig {
        if (this.levelId) {
            const levelConfig = getLevelConfig(this.levelId);
            if (levelConfig) {
                return levelConfig;
            }
            console.warn(`Level '${this.levelId}' not found in registry`);
        }
        // Fallback: return empty level config
        return { name: 'Unknown', formations: [] };
    }

    protected override getShipCollisionConfig() {
        const config = super.getShipCollisionConfig();
        if (this.levelId === 'ship-debug-level') {
            config.hasUnlimitedAmmo = true;
        }
        return config;
    }

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

        if (this.levelId === 'ship-debug-level') {
            this.createShipDebugUI();
        }
    }

    private createShipDebugUI() {
        // Create a dropdown to select ship
        const select = document.createElement('select');
        select.style.position = 'absolute';
        select.style.top = '20px';
        select.style.left = '50%';
        select.style.transform = 'translateX(-50%)';
        select.style.zIndex = '1000';
        select.style.padding = '10px';
        select.style.fontSize = '16px';
        select.style.fontFamily = 'Oswald, sans-serif';
        select.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        select.style.color = 'white';
        select.style.border = '1px solid #444';
        select.style.borderRadius = '5px';

        // Add options
        allShipConfigs.sort((a, b) => a.definition.id.localeCompare(b.definition.id)).forEach(config => {
            const option = document.createElement('option');
            option.value = config.definition.id;
            option.text = config.definition.id;
            select.appendChild(option);
        });

        // Select current ship if possible (default is BigCruiser so maybe logic needs adjustment if we want to reflect current?)
        // Assuming default first one or BigCruiserWhiteLaserConfig but we don't know easily which one matches exact instance.

        select.onchange = (e) => {
            const selectedId = (e.target as HTMLSelectElement).value;
            const config = allShipConfigs.find(c => c.definition.id === selectedId);
            if (config) {
                // Keep focus on game canvas so spacebar works
                (this.game.canvas as HTMLCanvasElement).focus();

                // Recreate ship
                this.recreatePlayerShip(config);
            }
        };

        document.body.appendChild(select);

        // Cleanup on shutdown
        this.events.once('shutdown', () => {
            if (document.body.contains(select)) {
                document.body.removeChild(select);
            }
        });
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

        const sceneData: { planetId?: string, victory?: boolean, galaxyId?: string, autoStart?: boolean } = {
            planetId: this.returnPlanetId,
            victory: victory,
            galaxyId: this.registry.get('activeGalaxyId'),
            autoStart: false
        };

        // Record the victory in GameStatus
        if (victory && sceneData.galaxyId) {
            GameStatus.getInstance().addVictory(sceneData.galaxyId);
            // Also mark intro as seen so it won't show again after completing the level
            if (this.returnPlanetId) {
                GameStatus.getInstance().markIntroSeen(this.returnPlanetId);
                GameStatus.getInstance().markPlanetDefeated(sceneData.galaxyId, this.returnPlanetId);
            }
        }

        // If victory, check for galaxy warp - override galaxyId if warping
        if (victory && this.warpGalaxyId) {
            this.scene.start('WormholeScene', { galaxyId: this.warpGalaxyId });
            return;
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

        // On RETRY (game over), go to GalaxyScene to let user choose to restart or pick an easier planet
        // On victory, proceed with normal finish flow (includes warp handling)
        if (!isVictory) {
            // Clean up before transitioning
            if (this.level) {
                this.level.destroy();
                this.level = null;
            }
            if (this.ship) {
                this.ship.destroy();
            }
            this.scene.start('GalaxyScene', {
                planetId: this.returnPlanetId,
                victory: false,
                galaxyId: this.registry.get('activeGalaxyId'),
                autoStart: false
            });
            return;
        }

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
