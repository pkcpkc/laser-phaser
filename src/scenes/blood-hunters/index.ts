import Phaser from 'phaser';
import { BloodHuntersFightLevel } from '../../levels/blood-hunters-fight';

export default class BloodHuntersScene extends Phaser.Scene {
    private ship!: Phaser.Physics.Matter.Image;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private stars: { sprite: Phaser.GameObjects.Image, speed: number }[] = [];

    private shipCategory!: number;
    private laserCategory!: number;
    private enemyCategory!: number;
    private enemyLaserCategory!: number;

    private level!: BloodHuntersFightLevel;

    private isGameOver: boolean = false;
    private gameOverText!: Phaser.GameObjects.Text;
    private restartText!: Phaser.GameObjects.Text;
    private emitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private explosionEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor() {
        super('BloodHunters');
    }

    preload() {
        this.load.image('big-cruiser', 'res/ships/big-cruiser.png');
        this.load.image('blood-hunter', 'res/ships/blood-hunter.png');
        this.load.atlas('space', 'res/assets/space.png', 'res/assets/space.json');
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
        this.createStarfield();

        // Create player ship
        this.createPlayerShip();

        // Create particle emitter for ship
        this.createShipEmitter();

        // Generate laser texture
        this.createLaserTexture();

        // Initialize level
        this.level = new BloodHuntersFightLevel(
            this,
            this.enemyCategory,
            this.laserCategory,
            this.shipCategory,
            this.enemyLaserCategory
        );
        this.level.start();

        // Create UI
        this.createUI();

        // Set up collision handling
        this.setupCollisions();

        // Set up keyboard controls
        this.cursors = this.input.keyboard!.createCursorKeys();
    }

    private createStarfield() {
        const { width, height } = this.scale;

        // Generate star texture
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 2, 2);
        graphics.generateTexture('star', 2, 2);
        graphics.destroy();

        // Create stars
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const star = this.add.image(x, y, 'star');
            star.setDepth(-1);
            const speed = Phaser.Math.FloatBetween(0.5, 2);
            this.stars.push({ sprite: star, speed });
        }
    }

    private createPlayerShip() {
        const { width, height } = this.scale;

        this.ship = this.matter.add.image(width * 0.5, height - 50, 'big-cruiser');
        this.ship.setAngle(-90);
        this.ship.setFixedRotation();
        this.ship.setFrictionAir(0.05);
        this.ship.setMass(30);
        this.ship.setSleepThreshold(-1);
        this.ship.setCollisionCategory(this.shipCategory);
        this.ship.setCollidesWith(~this.laserCategory);
    }

    private createShipEmitter() {
        this.emitter = this.add.particles(0, 0, 'space', {
            frame: 'blue',
            speed: {
                onEmit: () => {
                    if (this.ship && this.ship.body) {
                        return (this.ship.body as MatterJS.BodyType).speed;
                    }
                    return 0;
                }
            },
            lifespan: {
                onEmit: () => {
                    if (this.ship && this.ship.body) {
                        return Phaser.Math.Percent((this.ship.body as MatterJS.BodyType).speed, 0, 300) * 20000;
                    }
                    return 0;
                }
            },
            alpha: {
                onEmit: () => {
                    if (this.ship && this.ship.body) {
                        return Phaser.Math.Percent((this.ship.body as MatterJS.BodyType).speed, 0, 300) * 1000;
                    }
                    return 0;
                }
            },
            scale: { start: 1.0, end: 0 },
            blendMode: 'ADD'
        });

        this.emitter.setDepth(-1);
        this.emitter.startFollow(this.ship);

        // Create explosion emitter
        this.explosionEmitter = this.add.particles(0, 0, 'flares', {
            frame: 'red',
            lifespan: 1000,
            speed: { min: 20, max: 50 },
            scale: { start: 0.4, end: 0 },
            gravityY: 100,
            blendMode: 'ADD',
            emitting: false
        });
        this.explosionEmitter.setDepth(200);
    }

    private createLaserTexture() {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 4, 4);
        graphics.generateTexture('laser', 4, 4);
        graphics.destroy();
    }

    private createUI() {
        const { width, height } = this.scale;

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
                        }

                        gameObjectA.destroy();
                        gameObjectB.destroy();
                    }

                    // Ship vs Enemy
                    if ((categoryA === this.shipCategory && categoryB === this.enemyCategory) ||
                        (categoryB === this.shipCategory && categoryA === this.enemyCategory)) {

                        if (categoryA === this.enemyCategory) {
                            const enemy = gameObjectA as Phaser.Physics.Matter.Image;
                            if (enemy.active) {
                                this.explosionEmitter.explode(16, enemy.x, enemy.y);
                                gameObjectA.destroy();
                            }
                        }
                        if (categoryB === this.enemyCategory) {
                            const enemy = gameObjectB as Phaser.Physics.Matter.Image;
                            if (enemy.active) {
                                this.explosionEmitter.explode(16, enemy.x, enemy.y);
                                gameObjectB.destroy();
                            }
                        }

                        this.handleGameOver();
                    }

                    // Ship vs Enemy Laser
                    if ((categoryA === this.shipCategory && categoryB === this.enemyLaserCategory) ||
                        (categoryB === this.shipCategory && categoryA === this.enemyLaserCategory)) {
                        this.handleGameOver();
                        if (categoryA === this.enemyLaserCategory) gameObjectA.destroy();
                        if (categoryB === this.enemyLaserCategory) gameObjectB.destroy();
                    }
                }
            });
        });
    }

    private handleGameOver() {
        this.ship.destroy();
        this.emitter.stop();
        this.isGameOver = true;
        this.gameOverText.setVisible(true);
        this.restartText.setVisible(true);
        this.level.stop();
    }

    update(time: number, _delta: number) {
        // console.log('Bodies:', this.matter.world.getAllBodies().length);
        if (this.isGameOver) {
            return;
        }

        const { width, height } = this.scale;

        // Update starfield
        this.stars.forEach(star => {
            star.sprite.y += star.speed;
            if (star.sprite.y > height) {
                star.sprite.y = 0;
                star.sprite.x = Phaser.Math.Between(0, width);
            }
        });

        // Update level (which updates waves)
        this.level.update(time);

        // Update player ship controls
        if (this.ship.active) {
            this.updateShipControls();
        }
    }

    private updateShipControls() {
        const { width, height } = this.scale;

        if (this.cursors.left.isDown) {
            this.ship.thrustLeft(0.1);
        } else if (this.cursors.right.isDown) {
            this.ship.thrustRight(0.1);
        }

        if (this.cursors.up.isDown) {
            this.ship.thrust(0.1);
        } else if (this.cursors.down.isDown) {
            this.ship.thrustBack(0.1);
        }

        if (this.input.keyboard!.checkDown(this.cursors.space, 250)) {
            this.fireLaser();
        }

        // Keep ship within game boundaries
        const margin = 30;
        const clampedX = Phaser.Math.Clamp(this.ship.x, margin, width - margin);
        const clampedY = Phaser.Math.Clamp(this.ship.y, margin, height - margin);

        if (this.ship.x !== clampedX || this.ship.y !== clampedY) {
            this.ship.setPosition(clampedX, clampedY);
            if (this.ship.x === clampedX) {
                this.ship.setVelocityX(0);
            }
            if (this.ship.y === clampedY) {
                this.ship.setVelocityY(0);
            }
        }
    }

    private fireLaser() {
        if (!this.ship.active) return;

        const { x, y } = this.ship;
        const laser = this.matter.add.image(x, y, 'laser');
        laser.setFrictionAir(0);
        laser.setFixedRotation();
        laser.setSleepThreshold(-1);
        laser.setVelocityY(-10);

        laser.setCollisionCategory(this.laserCategory);
        laser.setCollidesWith(~this.shipCategory);

        // Recoil
        this.ship.thrustBack(0.02);

        const timer = this.time.addEvent({
            delay: 100,
            loop: true,
            callback: () => {
                if (!laser.active) {
                    timer.remove();
                    return;
                }
                // Check bounds for cleanup
                if (laser.y < -100 || laser.y > this.scale.height + 100 ||
                    laser.x < -100 || laser.x > this.scale.width + 100) {
                    laser.destroy();
                    timer.remove();
                }
            }
        });

        laser.setOnCollide((data: any) => {
            const bodyB = data.bodyB;
            if (!bodyB.gameObject) {
                laser.destroy();
                timer.remove();
            }
        });
    }
}
