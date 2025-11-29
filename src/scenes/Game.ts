import Phaser from 'phaser';

export default class Game extends Phaser.Scene {
    private ship!: Phaser.Physics.Matter.Image;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private stars: { sprite: Phaser.GameObjects.Image, speed: number }[] = [];

    private shipCategory!: number;
    private laserCategory!: number;

    private enemies: { sprite: Phaser.Physics.Matter.Image, startX: number, timeOffset: number }[] = [];
    private enemyCategory!: number;
    private enemyLaserCategory!: number;

    private isGameOver: boolean = false;
    private gameOverText!: Phaser.GameObjects.Text;
    private restartText!: Phaser.GameObjects.Text;
    private emitter!: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor() {
        super('Game');
    }

    preload() {
        this.load.image('big-cruiser', 'res/ships/big-cruiser.png');
        this.load.image('blood-hunter', 'res/ships/blood-hunter.png');
        this.load.atlas('space', 'res/assets/space.png', 'res/assets/space.json');
    }

    create() {
        const { width, height } = this.scale;

        this.isGameOver = false;
        this.enemies = [];

        // Initialize collision categories
        this.shipCategory = this.matter.world.nextCategory();
        this.laserCategory = this.matter.world.nextCategory();
        this.enemyCategory = this.matter.world.nextCategory();
        this.enemyLaserCategory = this.matter.world.nextCategory();

        // Add t-ship using Matter.js
        this.ship = this.matter.add.image(width * 0.5, height - 50, 'big-cruiser');

        // Configure ship physics
        this.ship.setAngle(-90);
        this.ship.setFixedRotation();
        this.ship.setFrictionAir(0.05);
        this.ship.setMass(30);

        this.ship.setCollisionCategory(this.shipCategory);
        this.ship.setCollidesWith(~this.laserCategory); // Collide with everything except player lasers

        // Set world bounds
        this.matter.world.setBounds(0, 0, width, height);

        // Create particle emitter
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

        this.emitter.setDepth(-1); // Ensure particles are behind the ship
        this.emitter.startFollow(this.ship);

        // Generate laser texture
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 4, 4);
        graphics.generateTexture('laser', 4, 4);

        // Generate star texture
        graphics.clear();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 2, 2);
        graphics.generateTexture('star', 2, 2);

        graphics.destroy();

        // Create stars
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const star = this.add.image(x, y, 'star');
            star.setDepth(-1); // Ensure stars are behind everything
            const speed = Phaser.Math.FloatBetween(0.5, 2);
            this.stars.push({ sprite: star, speed });
        }

        // Spawn initial enemy formation
        this.spawnEnemyFormation();

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

                // Check for Laser vs Enemy
                // We need to identify which body is which.
                const gameObjectA = bodyA.gameObject as Phaser.GameObjects.GameObject;
                const gameObjectB = bodyB.gameObject as Phaser.GameObjects.GameObject;

                // Check for collision with World Bounds (no gameObject)
                // This is for lasers hitting walls
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

                        gameObjectA.destroy();
                        gameObjectB.destroy();

                        // Remove from enemies array if it's an enemy
                        if (categoryA === this.enemyCategory) {
                            this.enemies = this.enemies.filter(e => e.sprite !== gameObjectA);
                        }
                        if (categoryB === this.enemyCategory) {
                            this.enemies = this.enemies.filter(e => e.sprite !== gameObjectB);
                        }
                    }

                    // Ship vs Enemy
                    if ((categoryA === this.shipCategory && categoryB === this.enemyCategory) ||
                        (categoryB === this.shipCategory && categoryA === this.enemyCategory)) {

                        // Destroy ship
                        this.ship.destroy();
                        // Optionally destroy enemy too
                        if (categoryA === this.enemyCategory) gameObjectA.destroy();
                        if (categoryB === this.enemyCategory) gameObjectB.destroy();

                        // Stop emitter
                        this.emitter.stop();

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

                        // Stop emitter
                        this.emitter.stop();

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
    }

    private spawnEnemyFormation() {
        const { width } = this.scale;
        const startX = width * 0.5;
        const startY = -50; // Start slightly above screen
        const spacing = 100;
        const verticalOffset = 60; // Vertical spacing between upper and lower positions

        // Random number of enemies between 3 and 6
        const numEnemies = Phaser.Math.Between(3, 6);

        for (let i = 0; i < numEnemies; i++) {
            const x = startX + (i - Math.floor(numEnemies / 2)) * spacing;

            // Alternate between upper and lower positions
            const yOffset = (i % 2 === 0) ? 0 : verticalOffset;
            const y = startY + yOffset;

            const enemy = this.matter.add.image(x, y, 'blood-hunter');
            enemy.setAngle(90); // Face down (0 is right, 90 is down)
            enemy.setFixedRotation();
            enemy.setFrictionAir(0);
            enemy.setCollisionCategory(this.enemyCategory);
            // Collide with lasers AND ship
            enemy.setCollidesWith(this.laserCategory | this.shipCategory);

            // Initial velocity downwards
            enemy.setVelocityY(2);

            this.enemies.push({ sprite: enemy, startX: x, timeOffset: i * 0.5 });

            // Only 50% of enemies shoot
            if (Math.random() < 0.5) {
                // Each shooting enemy fires 1 laser
                const numShots = 1;
                for (let j = 0; j < numShots; j++) {
                    // Delay each shot randomly between 1000-3000ms (longer delay)
                    this.time.delayedCall(Phaser.Math.Between(1000, 3000) + j * 500, () => {
                        if (enemy.active) {
                            this.fireEnemyLaser(enemy);
                        }
                    });
                }
            }
        }
    }

    update(time: number, _delta: number) {
        if (this.isGameOver) {
            return;
        }

        const { width, height } = this.scale;

        // Update stars
        this.stars.forEach(star => {
            star.sprite.y += star.speed;
            if (star.sprite.y > height) {
                star.sprite.y = 0;
                star.sprite.x = Phaser.Math.Between(0, width);
            }
        });

        // Update enemies
        // Sinus movement: x = startX + sin(time) * amplitude
        const amplitude = 50;
        const frequency = 0.002;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemyData = this.enemies[i];
            const enemy = enemyData.sprite;

            if (!enemy.active) {
                this.enemies.splice(i, 1);
                continue;
            }

            // Apply sinus movement to X
            // We need to manually set velocity or position. 
            // Setting velocity is better for physics, but position is easier for exact path.
            // Let's try setting X position directly but keeping Y velocity.
            // Or better: calculate desired X and set velocity X to reach it?
            // Simple position set is fine for arcade physics usually, but Matter might fight it.
            // Let's try setting velocity X.
            // x = startX + sin(t) * A
            // dx/dt = cos(t) * A * freq

            // Let's just set position for X to be smooth and deterministic
            const newX = enemyData.startX + Math.sin(time * frequency + enemyData.timeOffset) * amplitude;
            enemy.setPosition(newX, enemy.y);

            // Check if out of bounds (bottom)
            if (enemy.y > height + 50) {
                enemy.destroy();
                this.enemies.splice(i, 1);
            }
        }

        // Respawn if all enemies are gone
        if (this.enemies.length === 0) {
            this.spawnEnemyFormation();
        }

        // Check if ship is active before controlling it
        if (this.ship.active) {
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
            const margin = 30; // Half the ship's approximate width
            const clampedX = Phaser.Math.Clamp(this.ship.x, margin, width - margin);
            const clampedY = Phaser.Math.Clamp(this.ship.y, margin, height - margin);

            if (this.ship.x !== clampedX || this.ship.y !== clampedY) {
                this.ship.setPosition(clampedX, clampedY);
                // Stop velocity when hitting boundaries to prevent pushing against walls
                if (this.ship.x === clampedX) {
                    this.ship.setVelocityX(0);
                }
                if (this.ship.y === clampedY) {
                    this.ship.setVelocityY(0);
                }
            }
        }
    }

    private fireLaser() {
        if (!this.ship.active) return;

        const { x, y } = this.ship;
        const laser = this.matter.add.image(x, y, 'laser');
        laser.setFrictionAir(0);
        laser.setFixedRotation();
        laser.setVelocityY(-10); // Move up

        // Collision filtering
        laser.setCollisionCategory(this.laserCategory);

        // Laser collides with everything EXCEPT ship
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
            // If we hit world bounds (which might not have a gameObject), destroy laser
            if (!bodyB.gameObject) {
                laser.destroy();
                timer.remove();
            }
        });
    }

    private fireEnemyLaser(enemy: Phaser.Physics.Matter.Image) {
        if (!enemy.active) return;

        const { x, y } = enemy;

        // Generate red laser texture if not already created
        if (!this.textures.exists('enemy-laser')) {
            const graphics = this.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0xff0000, 1);
            graphics.fillRect(0, 0, 4, 4);
            graphics.generateTexture('enemy-laser', 4, 4);
            graphics.destroy();
        }

        const laser = this.matter.add.image(x, y, 'enemy-laser');
        laser.setFrictionAir(0);
        laser.setFixedRotation();
        laser.setVelocityY(10); // Move down

        // Collision filtering
        laser.setCollisionCategory(this.enemyLaserCategory);

        // Enemy laser collides with ship only
        laser.setCollidesWith(this.shipCategory);

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
            // If we hit world bounds (which might not have a gameObject), destroy laser
            if (!bodyB.gameObject) {
                laser.destroy();
                timer.remove();
            }
        });
    }
}
