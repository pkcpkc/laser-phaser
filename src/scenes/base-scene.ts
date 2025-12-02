import Phaser from 'phaser';
import { BigCruiser } from '../ships/big-cruiser';
import VirtualJoystick from 'phaser3-rex-plugins/plugins/virtualjoystick.js';
import { Starfield } from '../backgrounds/starfield';
import { Ship } from '../ships/ship';
import { EngineTrail } from '../ships/effects/engine-trail';
import { CollisionManager } from '../logic/collision-manager';
import { PlayerController } from '../logic/player-controller';
import { GameManager } from '../logic/game-manager';

export default class BaseScene extends Phaser.Scene {
    protected ship!: Ship;
    protected cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    protected starfield!: Starfield;
    protected joystick!: VirtualJoystick;
    protected fireButton!: Phaser.GameObjects.Text;

    protected collisionManager!: CollisionManager;
    protected playerController!: PlayerController;
    protected gameManager!: GameManager;

    constructor(key: string) {
        super(key);
    }

    preload() {
        this.load.image(BigCruiser.assetKey, BigCruiser.assetPath);
        this.load.atlas('flares', 'res/assets/flares.png', 'res/assets/flares.json');
    }

    create() {
        const { width, height } = this.scale;

        // Initialize Managers
        this.gameManager = new GameManager(this);
        this.collisionManager = new CollisionManager(this, () => this.handleGameOver());

        // Set world bounds
        this.matter.world.setBounds(0, 0, width, height);

        // Create starfield
        this.starfield = new Starfield(this);

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
            collidesWith: categories.enemyCategory | categories.enemyLaserCategory,
            laserCategory: categories.laserCategory,
            laserCollidesWith: categories.enemyCategory
        };

        this.ship = new BigCruiser(this, width * 0.5, height - 50, collisionConfig);
        this.ship.setEffect(new EngineTrail(this.ship));
    }

    protected createUI() {
        const { width, height } = this.scale;

        // Joystick
        this.joystick = new VirtualJoystick(this, {
            x: 100,
            y: height - 100,
            radius: 100,
            base: this.add.circle(0, 0, 100, 0x888888, 0.3),
            thumb: this.add.text(0, 0, '✥', { fontSize: '36px' }).setOrigin(0.5),
            dir: '8dir',
            forceMin: 40,
            enable: true
        });

        // Fire Button
        this.fireButton = this.add.text(width - 80, height - 95, '🔴', { fontSize: '40px', padding: { top: 10, bottom: 10 } })
            .setOrigin(0.5)
            .setInteractive();

        // Restart Listener
        this.input.keyboard!.on('keydown-SPACE', () => {
            if (!this.gameManager.isGameActive()) {
                this.scene.restart();
            }
        });

        this.fireButton.on('pointerdown', () => {
            if (!this.gameManager.isGameActive()) {
                this.scene.restart();
            }
        });
    }

    protected setupControls() {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.playerController = new PlayerController(this, this.ship, this.cursors, this.joystick);
        this.playerController.setFireButton(this.fireButton);
    }

    protected handleGameOver() {
        if (this.ship && this.ship.sprite.active) {
            this.ship.explode();
        }
        this.gameManager.handleGameOver();
    }

    protected handleResize(gameSize: Phaser.Structs.Size) {
        const { width, height } = gameSize;

        // Update world bounds
        this.matter.world.setBounds(0, 0, width, height);

        // Update UI positions
        if (this.joystick) {
            this.joystick.setPosition(100, height - 100);
        }
        if (this.fireButton) {
            this.fireButton.setPosition(width - 80, height - 95);
        }

        this.gameManager.handleResize(width, height);
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
