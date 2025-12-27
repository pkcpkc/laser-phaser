import Phaser from 'phaser';
import { BigCruiserWhiteLaserConfig } from '../ships/configurations/big-cruiser-white-laser';
import { Starfield } from '../backgrounds/starfield';
import { Ship } from '../ships/ship';
import { EngineTrail } from '../ships/effects/engine-trail';
import { CollisionManager } from '../logic/collision-manager';
import { PlayerController } from '../logic/player-controller';
import { GameManager } from '../logic/game-manager';
import { GameStatus } from '../logic/game-status';
import { LootUI } from '../ui/loot-ui';

export default class BaseScene extends Phaser.Scene {
    protected ship!: Ship;
    protected cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    protected starfield!: Starfield;
    protected fireButton!: Phaser.GameObjects.Text;

    protected collisionManager!: CollisionManager;
    protected playerController!: PlayerController;
    protected gameManager!: GameManager;
    protected lootUI!: LootUI;

    protected backgroundTexture: string = 'nebula';
    protected backgroundFrame: string | undefined = undefined;

    constructor(key: string) {
        super(key);
    }



    create() {
        const { width, height } = this.scale;

        // Initialize Managers
        this.gameManager = new GameManager(this);
        this.collisionManager = new CollisionManager(
            this,
            () => this.handleGameOver(),
            (loot) => this.handleLootCollected(loot)
        );

        // Set world bounds
        this.matter.world.setBounds(0, 0, width, height);

        // Create starfield
        this.starfield = new Starfield(this, this.backgroundTexture, this.backgroundFrame);

        // Create Player Ship
        this.createPlayerShip();

        // Setup Collisions
        this.collisionManager.setupCollisions();

        // UI & Controls
        this.createUI();
        this.setupControls();

        // Mobile Optimizations
        this.input.addPointer(3);
        this.game.canvas.style.touchAction = 'none';

        // Handle resize
        this.scale.on('resize', this.handleResize, this);
    }

    protected createPlayerShip() {
        const { width, height } = this.scale;
        const categories = this.collisionManager.getCategories();

        const collisionConfig = {
            category: categories.shipCategory,
            collidesWith: categories.enemyCategory | categories.enemyLaserCategory | categories.lootCategory,
            laserCategory: categories.laserCategory,
            laserCollidesWith: categories.enemyCategory,
            lootCategory: categories.lootCategory,
            lootCollidesWith: categories.shipCategory
        };

        this.ship = new Ship(this, width * 0.5, height - 50, BigCruiserWhiteLaserConfig, collisionConfig);
        this.ship.setEffect(new EngineTrail(this.ship));
    }

    protected goldCount: number = 0;
    protected silverCount: number = 0;
    protected gemCount: number = 0;
    protected moduleCount: number = 0;

    protected createUI() {
        const { width, height } = this.scale;
        const gameStatus = GameStatus.getInstance();
        const loot = gameStatus.getLoot();

        this.goldCount = loot.gold;
        this.silverCount = loot.silver;
        this.gemCount = loot.gems;
        this.moduleCount = loot.modules;

        // Create Loot UI
        this.lootUI = new LootUI(this);
        this.lootUI.create();



        // Fire Button
        this.fireButton = this.add.text(width - 80, height - 95, '🔴', { fontFamily: 'Oswald, Impact, sans-serif', fontSize: '40px', padding: { top: 10, bottom: 10 } })
            .setOrigin(0.5)
            .setInteractive();

        // Hide controls on first space press
        this.input.keyboard!.once('keydown-SPACE', () => {

            if (this.fireButton) {
                this.fireButton.setVisible(false);
            }
        });

        // Restart Listener
        this.input.keyboard?.on('keydown-SPACE', () => {
            if (!this.gameManager.isGameActive() || this.gameManager.isVictoryState()) {
                this.onGameOverInput();
            }
        });

        this.fireButton.on('pointerdown', () => {
            if (!this.gameManager.isGameActive() || this.gameManager.isVictoryState()) {
                this.onGameOverInput();
            }
        });

        // Add global click listener for Game Over input
        this.input.on('pointerdown', () => {
            if (!this.gameManager.isGameActive() || this.gameManager.isVictoryState()) {
                this.onGameOverInput();
            }
        });
    }

    protected onGameOverInput() {
        this.scene.restart();
    }

    protected handleLootCollected(lootGameObject: Phaser.GameObjects.GameObject) {
        if (!lootGameObject.active) return;

        const loot = lootGameObject as any; // Cast to access config
        if (loot.config) {
            const value = loot.config.value || 1;
            const type = loot.config.type || 'silver';
            const gameStatus = GameStatus.getInstance();

            if (type === 'gold') {
                this.goldCount += value;
                this.lootUI.updateCounts('gold', this.goldCount);
                gameStatus.updateLoot('gold', value);
            } else if (type === 'gem') {
                this.gemCount += value;
                this.lootUI.updateCounts('gem', this.gemCount);
                gameStatus.updateLoot('gem', value);
            } else if (type === 'module') {
                this.moduleCount += value;
                this.lootUI.updateCounts('module', this.moduleCount);
                gameStatus.updateLoot('module', value);
            } else {
                this.silverCount += value;
                this.lootUI.updateCounts('silver', this.silverCount);
                gameStatus.updateLoot('silver', value);
            }
        }

        // Defer destruction to avoid physics issues
        this.time.delayedCall(0, () => {
            if (lootGameObject.active) {
                lootGameObject.destroy();
            }
        });
    }

    protected setupControls() {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.playerController = new PlayerController(this, this.ship, this.cursors);
        this.playerController.setFireButton(this.fireButton);
    }

    protected handleGameOver() {
        if (this.ship && this.ship.sprite.active) {
            this.ship.explode();
        }
        this.gameManager.handleGameOver();
    }

    protected handleResize(gameSize: Phaser.Structs.Size) {
        if (!this.sys || !this.sys.isActive() || !this.matter || !this.matter.world) {
            return;
        }

        const { width, height } = gameSize;

        // Update world bounds
        this.matter.world.setBounds(0, 0, width, height);

        // Update Loot UI positions
        if (this.lootUI) {
            this.lootUI.updatePositions();
        }

        if (this.gameManager) {
            this.gameManager.handleResize(width, height);
        }
    }

    update(time: number, _delta: number) {
        if (!this.gameManager.isGameActive()) {
            return;
        }

        // Update starfield
        if (this.starfield) {
            this.starfield.update();
        }

        // Update player controller
        if (this.playerController) {
            this.playerController.update(time);
        }
    }
}
