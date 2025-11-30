import Phaser from 'phaser';
import { BigCruiser } from '../../ships/big-cruiser';
import { BloodHunter } from '../../ships/blood-hunter';
import VirtualJoystick from 'phaser3-rex-plugins/plugins/virtualjoystick.js';
import { SinusWave } from '../../waves/sinus';
import { Starfield } from '../../backgrounds/starfield';
import { Ship } from '../../ships/ship';
import { EngineTrail } from '../../ships/effects/engine-trail';

export default class BloodHuntersScene extends Phaser.Scene {
    private ship!: Ship;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private starfield!: Starfield;

    private shipCategory!: number;
    private laserCategory!: number;
    private enemyCategory!: number;
    private enemyLaserCategory!: number;

    private currentWave: SinusWave | null = null;

    private isGameOver: boolean = false;
    private gameOverText!: Phaser.GameObjects.Text;
    private restartText!: Phaser.GameObjects.Text;
    private explosionEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

    private joystick!: VirtualJoystick;
    private isFiring: boolean = false;
    private lastFired: number = 0;

    private fireButton!: Phaser.GameObjects.Text;

    constructor() {
        super('BloodHunters');
    }

    preload() {
        this.load.image(BigCruiser.assetKey, BigCruiser.assetPath);
        this.load.image(BloodHunter.assetKey, BloodHunter.assetPath);
        this.load.atlas('flares', 'res/assets/flares.png', 'res/assets/flares.json');
    }

    create() {
        const { width, height } = this.scale;

        this.isGameOver = false;

        // Initialize collision categories
        this.shipCategory = this.matter.world.nextCategory();
        this.laserCategory = this.matter.world.nextCategory();
        this.enemyCategory = this.matter.world.nextCategory();
        this.enemyLaserCategory = this.matter.world.nextCategory();

        // Set world bounds
        this.matter.world.setBounds(0, 0, width, height);

        // Create starfield background
        this.starfield = new Starfield(this);

        // Create explosion emitter
        this.explosionEmitter = this.add.particles(0, 0, 'flares', {
            frame: 'red',
            angle: { min: 0, max: 360 },
            speed: { min: 50, max: 150 },
            scale: { start: 0.4, end: 0 },
            lifespan: 500,
            blendMode: 'ADD',
            emitting: false
        });
        this.explosionEmitter.setDepth(200);

        // Create player ship
        this.createPlayerShip();

        // Initialize wave
        this.spawnWave();

        // Create UI
        this.createUI();

        // Set up collision handling
        this.setupCollisions();

        // Set up keyboard controls
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Mobile Optimizations
        this.input.addPointer(3);
        this.game.canvas.style.touchAction = 'none';

        // Joystick
        this.joystick = new VirtualJoystick(this, {
            x: 80,
            y: height - 100,
            radius: 60,
            base: this.add.circle(0, 0, 60, 0x888888, 0.3),
            thumb: this.add.text(0, 0, '✥', { fontSize: '36px' }).setOrigin(0.5),
            dir: '8dir',
            forceMin: 16,
            enable: true
        });

        // Fire Button
        this.fireButton = this.add.text(width - 80, height - 95, '🔴', { fontSize: '40px', padding: { top: 10, bottom: 10 } })
            .setOrigin(0.5)
            .setInteractive()
            .setInteractive()
            .on('pointerdown', () => {
                if (this.isGameOver) {
                    this.scene.restart();
                } else {
                    this.isFiring = true;
                }
            })
            .on('pointerup', () => { this.isFiring = false; })
            .on('pointerout', () => { this.isFiring = false; });

        // Handle resize
        this.scale.on('resize', this.handleResize, this);
    }

    private spawnWave() {
        console.log('Spawning Wave');
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

    private handleResize(gameSize: Phaser.Structs.Size) {
        const { width, height } = gameSize;

        // Update world bounds
        this.matter.world.setBounds(0, 0, width, height);

        // Update UI positions
        if (this.joystick) {
            this.joystick.setPosition(80, height - 100);
        }
        if (this.fireButton) {
            this.fireButton.setPosition(width - 80, height - 95);
        }
        if (this.gameOverText) {
            this.gameOverText.setPosition(width * 0.5, height * 0.4);
        }
        if (this.restartText) {
            this.restartText.setPosition(width * 0.5, height * 0.6);
        }
    }

    private createPlayerShip() {
        const { width, height } = this.scale;

        const collisionConfig = {
            category: this.shipCategory,
            collidesWith: ~this.laserCategory,
            laserCategory: this.laserCategory,
            laserCollidesWith: ~this.shipCategory
        };

        this.ship = new BigCruiser(this, width * 0.5, height - 50, collisionConfig);
        this.ship.setEffect(EngineTrail);
    }

    private createUI() {
        const { width, height } = this.scale;

        this.gameOverText = this.add.text(width * 0.5, height * 0.4, 'GAME OVER', {
            fontSize: '64px',
            color: '#00dd00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setVisible(false).setDepth(100);

        this.restartText = this.add.text(width * 0.5, height * 0.6, 'Press FIRE', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5).setVisible(false).setDepth(100);

        // Restart Input Listener
        this.input.keyboard!.on('keydown-SPACE', () => {
            if (this.isGameOver) {
                this.scene.restart();
            }
        });
    }

    private setupCollisions() {
        this.matter.world.on('collisionstart', (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
            // console.log('Collision started'); // Too spammy, maybe just log count?
            event.pairs.forEach(pair => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                const gameObjectA = bodyA.gameObject as Phaser.GameObjects.GameObject;
                const gameObjectB = bodyB.gameObject as Phaser.GameObjects.GameObject;

                // Laser hitting world bounds
                if ((bodyA.collisionFilter.category === this.laserCategory && !gameObjectB) ||
                    (bodyB.collisionFilter.category === this.laserCategory && !gameObjectA)) {
                    if (gameObjectA) gameObjectA.destroy();
                    if (gameObjectB) gameObjectB.destroy();
                    return;
                }

                if (gameObjectA && gameObjectB) {
                    const categoryA = bodyA.collisionFilter.category;
                    const categoryB = bodyB.collisionFilter.category;

                    // Laser vs Enemy
                    if ((categoryA === this.laserCategory && categoryB === this.enemyCategory) ||
                        (categoryB === this.laserCategory && categoryA === this.enemyCategory)) {

                        const enemyBody = categoryA === this.enemyCategory ? bodyA : bodyB;
                        const enemy = enemyBody.gameObject as Phaser.Physics.Matter.Image;

                        if (enemy) {
                            this.explosionEmitter.explode(16, enemy.x, enemy.y);
                            const ship = enemy.getData('ship') as Ship;
                            if (ship) ship.destroy();
                            else {
                                if (categoryA === this.enemyCategory) gameObjectA.destroy();
                                if (categoryB === this.enemyCategory) gameObjectB.destroy();
                            }
                        }

                        if (categoryA === this.laserCategory) gameObjectA.destroy();
                        if (categoryB === this.laserCategory) gameObjectB.destroy();
                    }

                    // Ship vs Enemy
                    if ((categoryA === this.shipCategory && categoryB === this.enemyCategory) ||
                        (categoryB === this.shipCategory && categoryA === this.enemyCategory)) {

                        if (categoryA === this.enemyCategory) {
                            const enemy = gameObjectA as Phaser.Physics.Matter.Image;
                            if (enemy.active) {
                                this.explosionEmitter.explode(16, enemy.x, enemy.y);
                                const ship = enemy.getData('ship') as Ship;
                                if (ship) ship.destroy();
                                else gameObjectA.destroy();
                            }
                        }
                        if (categoryB === this.enemyCategory) {
                            const enemy = gameObjectB as Phaser.Physics.Matter.Image;
                            if (enemy.active) {
                                this.explosionEmitter.explode(16, enemy.x, enemy.y);
                                const ship = enemy.getData('ship') as Ship;
                                if (ship) ship.destroy();
                                else gameObjectB.destroy();
                            }
                        }

                        this.handleGameOver();
                    }

                    // Ship vs Enemy Laser
                    if ((categoryA === this.shipCategory && categoryB === this.enemyLaserCategory) ||
                        (categoryB === this.shipCategory && categoryA === this.enemyLaserCategory)) {

                        // Destroy enemy laser
                        if (categoryA === this.enemyLaserCategory && gameObjectA.active) gameObjectA.destroy();
                        if (categoryB === this.enemyLaserCategory && gameObjectB.active) gameObjectB.destroy();

                        this.handleGameOver();
                    }
                }
            });
        });
    }

    private handleGameOver() {
        if (this.ship && this.ship.sprite.active) {
            this.ship.destroy();
        }
        this.isGameOver = true;
        this.gameOverText.setVisible(true);
        this.restartText.setVisible(true);
        if (this.currentWave) {
            this.currentWave.destroy();
            this.currentWave = null;
        }
    }

    update(time: number, _delta: number) {
        // console.log('Bodies:', this.matter.world.getAllBodies().length);
        if (this.isGameOver) {
            return;
        }

        // Update starfield
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

        // Update player ship controls
        if (this.ship.sprite.active) {
            this.updateShipControls();
        }
    }

    private updateShipControls() {
        const { width, height } = this.scale;
        const time = this.time.now;

        if (this.cursors.left.isDown || this.joystick.left) {
            this.ship.sprite.thrustLeft(BigCruiser.gameplay.thrust || 0.1);
        } else if (this.cursors.right.isDown || this.joystick.right) {
            this.ship.sprite.thrustRight(BigCruiser.gameplay.thrust || 0.1);
        }

        if (this.cursors.up.isDown || this.joystick.up) {
            this.ship.sprite.thrust(BigCruiser.gameplay.thrust || 0.1);
        } else if (this.cursors.down.isDown || this.joystick.down) {
            this.ship.sprite.thrustBack(BigCruiser.gameplay.thrust || 0.1);
        }

        if (this.input.keyboard!.checkDown(this.cursors.space, 250)) {
            this.fireLaser();
        }

        // Fire control
        if (this.isFiring) {
            if (time > this.lastFired + 250) {
                this.fireLaser();
                this.lastFired = time;
            }
        }

        // Keep ship within game boundaries
        const margin = 30;
        const clampedX = Phaser.Math.Clamp(this.ship.sprite.x, margin, width - margin);
        const clampedY = Phaser.Math.Clamp(this.ship.sprite.y, margin, height - margin);

        if (this.ship.sprite.x !== clampedX || this.ship.sprite.y !== clampedY) {
            this.ship.sprite.setPosition(clampedX, clampedY);
            if (this.ship.sprite.x === clampedX) {
                this.ship.sprite.setVelocityX(0);
            }
            if (this.ship.sprite.y === clampedY) {
                this.ship.sprite.setVelocityY(0);
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
