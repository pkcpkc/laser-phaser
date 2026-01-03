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
import { LootType } from '../ships/types';
import { Loot } from '../ships/loot';
import { setupDebugKey } from '../logic/debug-utils';


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

        // Set world bounds - expanded to allow ship to partially leave screen
        // Player controller constrains the ship's origin to stay on-screen
        const WORLD_MARGIN = 100;
        this.matter.world.setBounds(-WORLD_MARGIN, -WORLD_MARGIN, width + WORLD_MARGIN * 2, height + WORLD_MARGIN * 2);

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

        // Debug Mode
        setupDebugKey(this);
    }

    protected createPlayerShip() {
        const { width, height } = this.scale;
        const categories = this.collisionManager.getCategories();

        const collisionConfig = {
            category: categories.shipCategory,
            collidesWith: categories.enemyCategory | categories.enemyLaserCategory | categories.lootCategory | categories.wallCategory,
            laserCategory: categories.laserCategory,
            laserCollidesWith: categories.enemyCategory,
            lootCategory: categories.lootCategory,
            lootCollidesWith: categories.shipCategory
        };

        this.ship = new Ship(this, width * 0.5, height - 50, BigCruiserWhiteLaserConfig, collisionConfig);

        // Enforce player ship physics properties overrides
        this.ship.sprite.setFixedRotation();
        this.ship.sprite.setAngle(-90);

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

        this.goldCount = loot[LootType.GOLD];
        this.silverCount = loot[LootType.SILVER];
        this.gemCount = loot[LootType.GEM];
        this.moduleCount = loot[LootType.MODULE];

        // Create Loot UI
        this.lootUI = new LootUI(this);
        this.lootUI.create();



        // Fire Button
        this.fireButton = this.add.text(width - 80, height - 95, '🔴', { fontFamily: 'Oswald, sans-serif', fontSize: '40px', padding: { top: 10, bottom: 10 } })
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

        this.fireButton.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
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

    protected isTransitioning: boolean = false;

    protected onGameOverInput() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        this.scene.restart();
    }

    protected handleLootCollected(lootGameObject: Phaser.GameObjects.GameObject) {
        if (!lootGameObject.active) return;

        const loot = lootGameObject as Loot;
        if (loot.type) {
            const value = loot.value || 1;
            const type: LootType = loot.type || LootType.SILVER;
            const gameStatus = GameStatus.getInstance();

            if (type === LootType.GOLD) {
                this.goldCount += value;
                this.lootUI.updateCounts(type, this.goldCount);
            } else if (type === LootType.GEM) {
                this.gemCount += value;
                this.lootUI.updateCounts(type, this.gemCount);
            } else if (type === LootType.MODULE) {
                this.moduleCount += value;
                this.lootUI.updateCounts(type, this.moduleCount);
            } else {
                this.silverCount += value;
                this.lootUI.updateCounts(type, this.silverCount);
            }
            gameStatus.updateLoot(type, value);
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

        // Update world bounds - expanded to allow ship to partially leave screen
        const WORLD_MARGIN = 100;
        this.matter.world.setBounds(-WORLD_MARGIN, -WORLD_MARGIN, width + WORLD_MARGIN * 2, height + WORLD_MARGIN * 2);

        // Update Loot UI positions
        if (this.lootUI) {
            this.lootUI.updatePositions();
        }

        if (this.gameManager) {
            this.gameManager.handleResize(width, height);
        }
    }

    update(time: number, _delta: number) {
        // Update starfield (keep animating even during RETRY screen)
        if (this.starfield) {
            this.starfield.update();
        }

        if (!this.gameManager.isGameActive()) {
            return;
        }

        // Update player controller
        if (this.playerController) {
            this.playerController.update(time);
        }
    }
}
