import Phaser from 'phaser';
import { BigCruiser } from '../ships/big-cruiser';
import { BloodHunter } from '../ships/blood-hunter';
import VirtualJoystick from 'phaser3-rex-plugins/plugins/virtualjoystick.js';
import { SinusWave } from '../waves/sinus';
import { Starfield } from '../backgrounds/starfield';
import { Ship } from '../ships/ship';
import { EngineTrail } from '../ships/effects/engine-trail';

export default class Game extends Phaser.Scene {
    private ship!: Ship;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private starfield!: Starfield;

    private shipCategory!: number;
    private laserCategory!: number;

    private currentWave: SinusWave | null = null;
    private enemyCategory!: number;
    private enemyLaserCategory!: number;

    private isGameOver: boolean = false;
    private gameOverText!: Phaser.GameObjects.Text;
    private restartText!: Phaser.GameObjects.Text;

    private joystick!: VirtualJoystick;
    private isFiring: boolean = false;
    private lastFired: number = 0;

    constructor() {
        super('Game');
    }

    preload() {
        this.load.image(BigCruiser.assetKey, BigCruiser.assetPath);
        this.load.image(BloodHunter.assetKey, BloodHunter.assetPath);
        this.load.atlas('flares', 'res/assets/flares.png', 'res/assets/flares.json');

        this.load.on('filecomplete', (key: string, type: string, _data: any) => {
            console.log(`Loaded: ${key} (${type})`);
        });
        this.load.on('loaderror', (file: any) => {
            console.error(`Load Error: ${file.key} `, file);
        });
    }

    create() {
        const { width, height } = this.scale;

        this.isGameOver = false;

        // Initialize collision categories
        this.shipCategory = this.matter.world.nextCategory();
        this.laserCategory = this.matter.world.nextCategory();
        this.enemyCategory = this.matter.world.nextCategory();
        this.enemyLaserCategory = this.matter.world.nextCategory();

        const collisionConfig = {
            category: this.shipCategory,
            collidesWith: ~this.laserCategory,
            laserCategory: this.laserCategory,
            laserCollidesWith: ~this.shipCategory
        };

        this.ship = new BigCruiser(this, width * 0.5, height - 50, collisionConfig);
        this.ship.setEffect(EngineTrail);

        // Set world bounds
        this.matter.world.setBounds(0, 0, width, height);

        // Create starfield

        // Create starfield
        this.starfield = new Starfield(this);

        // Spawn initial enemy formation
        this.spawnWave();

        // UI Texts
        this.gameOverText = this.add.text(width * 0.5, height * 0.4, 'GAME OVER', {
            fontSize: '64px',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setVisible(false).setDepth(100);

        this.restartText = this.add.text(width * 0.5, height * 0.6, 'Press SPACE to Restart', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5).setVisible(false).setDepth(100);

        // Restart Input Listener
        this.input.keyboard!.on('keydown-SPACE', () => {
            if (this.isGameOver) {
                this.scene.restart();
            }
        });

        // Set up collision handling
        this.matter.world.on('collisionstart', (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
            event.pairs.forEach(pair => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                // Check for Laser vs World Bounds (no gameObject)
                // This is for lasers hitting walls
                if ((bodyA.collisionFilter.category === this.laserCategory && !bodyB.gameObject) ||
                    (bodyB.collisionFilter.category === this.laserCategory && !bodyA.gameObject)) {
                    if (bodyA.gameObject) bodyA.gameObject.destroy();
                    if (bodyB.gameObject) bodyB.gameObject.destroy();
                    return;
                }

                const gameObjectA = bodyA.gameObject as Phaser.GameObjects.GameObject;
                const gameObjectB = bodyB.gameObject as Phaser.GameObjects.GameObject;

                if (gameObjectA && gameObjectB) {
                    const categoryA = bodyA.collisionFilter.category;
                    const categoryB = bodyB.collisionFilter.category;

                    // Laser vs Enemy
                    if ((categoryA === this.laserCategory && categoryB === this.enemyCategory) ||
                        (categoryB === this.laserCategory && categoryA === this.enemyCategory)) {

                        gameObjectA.destroy();
                        gameObjectB.destroy();
                    }

                    // Ship vs Enemy
                    if ((categoryA === this.shipCategory && categoryB === this.enemyCategory) ||
                        (categoryB === this.shipCategory && categoryA === this.enemyCategory)) {

                        // Destroy ship
                        this.ship.destroy();
                        // Optionally destroy enemy too
                        if (categoryA === this.enemyCategory) gameObjectA.destroy();
                        if (categoryB === this.enemyCategory) gameObjectB.destroy();

                        // Game Over logic
                        this.isGameOver = true;
                        this.gameOverText.setVisible(true);
                        this.restartText.setVisible(true);
                    }

                    // Ship vs Enemy Laser
                    if ((categoryA === this.shipCategory && categoryB === this.enemyLaserCategory) ||
                        (categoryB === this.shipCategory && categoryA === this.enemyLaserCategory)) {

                        // Destroy ship
                        this.ship.destroy();
                        // Destroy enemy laser
                        if (categoryA === this.enemyLaserCategory) gameObjectA.destroy();
                        if (categoryB === this.enemyLaserCategory) gameObjectB.destroy();

                        // Game Over logic
                        this.isGameOver = true;
                        this.gameOverText.setVisible(true);
                        this.restartText.setVisible(true);
                    }
                }
            });
        });


        // Set up keyboard controls
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Joystick
        this.joystick = new VirtualJoystick(this, {
            x: 100,
            y: height - 100,
            radius: 60,
            base: this.add.circle(0, 0, 60, 0x888888, 0.3),
            thumb: this.add.text(0, 0, '✥', { fontSize: '48px' }).setOrigin(0.5),
            dir: '8dir',
            forceMin: 16,
            enable: true
        });

        // Fire Button
        this.add.text(width - 100, height - 100, '🔴', { fontSize: '80px' })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => { this.isFiring = true; })
            .on('pointerup', () => { this.isFiring = false; })
            .on('pointerout', () => { this.isFiring = false; });
    }

    private spawnWave() {
        const collisionConfig = {
            category: this.enemyCategory,
            collidesWith: this.laserCategory | this.shipCategory,
            laserCategory: this.enemyLaserCategory,
            laserCollidesWith: this.shipCategory
        };

        this.currentWave = new SinusWave(
            this,
            BloodHunter,
            collisionConfig
        );
        this.currentWave.spawn();
    }

    update(time: number, _delta: number) {
        if (this.isGameOver) {
            return;
        }

        const { width, height } = this.scale;

        // Update stars
        if (this.starfield) {
            this.starfield.update();
        }

        // Update wave
        if (this.currentWave) {
            this.currentWave.update(time);
            if (this.currentWave.isComplete()) {
                this.spawnWave();
            }
        }

        // Check if ship is active before controlling it
        if (this.ship.sprite.active) {
            if (this.cursors.left.isDown) {
                this.ship.sprite.thrustLeft(BigCruiser.gameplay.thrust || 0.1);
            } else if (this.cursors.right.isDown) {
                this.ship.sprite.thrustRight(BigCruiser.gameplay.thrust || 0.1);
            }

            if (this.cursors.up.isDown) {
                this.ship.sprite.thrust(BigCruiser.gameplay.thrust || 0.1);
            } else if (this.cursors.down.isDown) {
                this.ship.sprite.thrustBack(BigCruiser.gameplay.thrust || 0.1);
            }

            if (this.input.keyboard!.checkDown(this.cursors.space, 250)) {
                this.fireLaser();
            }

            // Joystick control
            if (this.joystick.left) {
                this.ship.sprite.thrustLeft(BigCruiser.gameplay.thrust || 0.1);
            } else if (this.joystick.right) {
                this.ship.sprite.thrustRight(BigCruiser.gameplay.thrust || 0.1);
            }

            if (this.joystick.up) {
                this.ship.sprite.thrust(BigCruiser.gameplay.thrust || 0.1);
            } else if (this.joystick.down) {
                this.ship.sprite.thrustBack(BigCruiser.gameplay.thrust || 0.1);
            }

            // Fire control
            if (this.isFiring) {
                if (time > this.lastFired + 250) {
                    this.fireLaser();
                    this.lastFired = time;
                }
            }

            // Keep ship within game boundaries
            const margin = 30; // Half the ship's approximate width
            const clampedX = Phaser.Math.Clamp(this.ship.sprite.x, margin, width - margin);
            const clampedY = Phaser.Math.Clamp(this.ship.sprite.y, margin, height - margin);

            if (this.ship.sprite.x !== clampedX || this.ship.sprite.y !== clampedY) {
                this.ship.sprite.setPosition(clampedX, clampedY);
                // Stop velocity when hitting boundaries to prevent pushing against walls
                if (this.ship.sprite.x === clampedX) {
                    this.ship.sprite.setVelocityX(0);
                }
                if (this.ship.sprite.y === clampedY) {
                    this.ship.sprite.setVelocityY(0);
                }
            }
        }
    }

    private fireLaser() {
        if (!this.ship.sprite.active) return;

        this.ship.fireLasers();

        // Recoil
        this.ship.sprite.thrustBack(0.02);
    }
}
