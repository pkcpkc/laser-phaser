import Phaser from 'phaser';

export interface WaveConfig {
    enemyCount: { min: number; max: number };
    spacing: number;
    verticalOffset: number;
    amplitude: number;
    frequency: number;
    shootingChance: number;
    shotsPerEnemy: number;
    shotDelay: { min: number; max: number };
}

export interface EnemyData {
    sprite: Phaser.Physics.Matter.Image;
    startX: number;
    timeOffset: number;
}

export class BloodHuntersSinusWave {
    private scene: Phaser.Scene;
    private enemies: EnemyData[] = [];
    private config: WaveConfig;
    private enemyCategory: number;
    private laserCategory: number;
    private shipCategory: number;
    private enemyLaserCategory: number;

    constructor(
        scene: Phaser.Scene,
        enemyCategory: number,
        laserCategory: number,
        shipCategory: number,
        enemyLaserCategory: number,
        config?: Partial<WaveConfig>
    ) {
        this.scene = scene;
        this.enemyCategory = enemyCategory;
        this.laserCategory = laserCategory;
        this.shipCategory = shipCategory;
        this.enemyLaserCategory = enemyLaserCategory;

        // Default configuration
        this.config = {
            enemyCount: { min: 3, max: 6 },
            spacing: 100,
            verticalOffset: 60,
            amplitude: 50,
            frequency: 0.002,
            shootingChance: 0.5,
            shotsPerEnemy: 1,
            shotDelay: { min: 1000, max: 3000 },
            ...config
        };
    }

    spawn() {
        const { width } = this.scene.scale;
        const startX = width * 0.5;
        const startY = -50; // Start slightly above screen

        // Random number of enemies
        const numEnemies = Phaser.Math.Between(
            this.config.enemyCount.min,
            this.config.enemyCount.max
        );

        for (let i = 0; i < numEnemies; i++) {
            const x = startX + (i - Math.floor(numEnemies / 2)) * this.config.spacing;

            // Alternate between upper and lower positions
            const yOffset = (i % 2 === 0) ? 0 : this.config.verticalOffset;
            const y = startY + yOffset;

            const enemy = this.scene.matter.add.image(x, y, 'blood-hunter');
            enemy.setAngle(90); // Face down
            enemy.setFixedRotation();
            enemy.setFrictionAir(0);
            enemy.setCollisionCategory(this.enemyCategory);
            enemy.setCollidesWith(this.laserCategory | this.shipCategory);
            enemy.setVelocityY(2); // Initial velocity downwards

            this.enemies.push({ sprite: enemy, startX: x, timeOffset: i * 0.5 });

            // Shooting behavior
            if (Math.random() < this.config.shootingChance) {
                for (let j = 0; j < this.config.shotsPerEnemy; j++) {
                    const delay = Phaser.Math.Between(
                        this.config.shotDelay.min,
                        this.config.shotDelay.max
                    ) + j * 500;

                    this.scene.time.delayedCall(delay, () => {
                        if (enemy.active) {
                            this.fireEnemyLaser(enemy);
                        }
                    });
                }
            }
        }
    }

    update(time: number) {
        const { height } = this.scene.scale;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemyData = this.enemies[i];
            const enemy = enemyData.sprite;

            if (!enemy.active) {
                this.enemies.splice(i, 1);
                continue;
            }

            // Apply sinus movement to X
            const newX = enemyData.startX +
                Math.sin(time * this.config.frequency + enemyData.timeOffset) * this.config.amplitude;
            enemy.setPosition(newX, enemy.y);

            // Check if out of bounds (bottom)
            if (enemy.y > height + 50) {
                enemy.destroy();
                this.enemies.splice(i, 1);
            }
        }
    }

    private fireEnemyLaser(enemy: Phaser.Physics.Matter.Image) {
        if (!enemy.active) return;

        const { x, y } = enemy;

        // Generate red laser texture if not already created
        if (!this.scene.textures.exists('enemy-laser')) {
            const graphics = this.scene.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0xff0000, 1);
            graphics.fillRect(0, 0, 4, 4);
            graphics.generateTexture('enemy-laser', 4, 4);
            graphics.destroy();
        }

        const laser = this.scene.matter.add.image(x, y, 'enemy-laser');
        laser.setFrictionAir(0);
        laser.setFixedRotation();
        laser.setVelocityY(10); // Move down

        laser.setCollisionCategory(this.enemyLaserCategory);
        laser.setCollidesWith(this.shipCategory);

        const timer = this.scene.time.addEvent({
            delay: 100,
            loop: true,
            callback: () => {
                if (!laser.active) {
                    timer.remove();
                    return;
                }
                // Check bounds for cleanup
                if (laser.y < -100 || laser.y > this.scene.scale.height + 100 ||
                    laser.x < -100 || laser.x > this.scene.scale.width + 100) {
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

    isComplete(): boolean {
        return this.enemies.length === 0;
    }

    getEnemies(): EnemyData[] {
        return this.enemies;
    }

    destroy() {
        this.enemies.forEach(enemyData => {
            if (enemyData.sprite.active) {
                enemyData.sprite.destroy();
            }
        });
        this.enemies = [];
    }
}
