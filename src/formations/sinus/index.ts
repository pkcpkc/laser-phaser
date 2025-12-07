import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../../ships/ship';

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
    ship: Ship;
    startX: number;
    timeOffset: number;
}

export class SinusWave {
    private scene: Phaser.Scene;
    private enemies: EnemyData[] = [];
    private config: WaveConfig;
    private shipClass: new (scene: Phaser.Scene, x: number, y: number, collisionConfig: ShipCollisionConfig) => Ship;
    private collisionConfig: ShipCollisionConfig;
    private timers: Phaser.Time.TimerEvent[] = [];

    constructor(
        scene: Phaser.Scene,
        shipClass: new (scene: Phaser.Scene, x: number, y: number, collisionConfig: ShipCollisionConfig) => Ship,
        collisionConfig: ShipCollisionConfig,
        config?: Partial<WaveConfig>
    ) {
        this.scene = scene;
        this.shipClass = shipClass;
        this.collisionConfig = collisionConfig;

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

        // Dynamic ship count based on width
        const minShips = Math.max(2, Math.floor(width / 250));
        let maxShips = Math.max(3, Math.floor(width / 150));

        // Ensure max is at least min
        if (maxShips < minShips) {
            maxShips = minShips;
        }

        // Random number of enemies
        const numEnemies = Phaser.Math.Between(minShips, maxShips);

        for (let i = 0; i < numEnemies; i++) {
            const x = startX + (i - Math.floor(numEnemies / 2)) * this.config.spacing;

            // Alternate between upper and lower positions
            const yOffset = (i % 2 === 0) ? 0 : this.config.verticalOffset;
            const y = startY + yOffset;

            const ship = new this.shipClass(this.scene, x, y, this.collisionConfig);
            const enemy = ship.sprite;
            enemy.setData('ship', ship);

            enemy.setVelocityY(ship.config.definition.gameplay.speed || 2); // Initial velocity downwards

            this.enemies.push({ ship: ship, startX: x, timeOffset: i * 0.5 });

            // Shooting behavior
            if (Math.random() < this.config.shootingChance) {
                for (let j = 0; j < this.config.shotsPerEnemy; j++) {
                    const delay = Phaser.Math.Between(
                        this.config.shotDelay.min,
                        this.config.shotDelay.max
                    ) + j * 500;

                    const timer = this.scene.time.delayedCall(delay, () => {
                        if (enemy.active) {
                            this.fireEnemyLaser(ship);
                        }
                    });
                    this.timers.push(timer);
                }
            }
        }
    }

    update(time: number) {
        // console.log('SinusWave update', this.enemies.length);
        const { height } = this.scene.scale;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemyData = this.enemies[i];
            const enemy = enemyData.ship.sprite;

            if (!enemy.active) {
                this.enemies.splice(i, 1);
                continue;
            }

            // Apply sinus movement to X
            const phase = time * this.config.frequency + enemyData.timeOffset;
            const newX = enemyData.startX + Math.sin(phase) * this.config.amplitude;

            enemy.setPosition(newX, enemy.y);

            // Calculate rotation based on path derivative
            // vx = d/dt (A sin(wt + off)) = A w cos(wt + off)
            // We scale vx to match the approximate Y velocity units (pixels per frame)
            // Y velocity is 2 per frame.
            // vx (pixels per ms) * 16.66 (ms per frame) gives pixels per frame.
            const vx = this.config.amplitude * this.config.frequency * Math.cos(phase) * 16.66;
            const vy = enemyData.ship.config.definition.gameplay.speed || 2; // Constant downward velocity

            enemy.setRotation(Math.atan2(vy, vx));

            // Check if out of bounds (bottom)
            if (enemy.y > height + 50) {
                enemyData.ship.destroy();
                this.enemies.splice(i, 1);
            }
        }
    }

    private fireEnemyLaser(ship: Ship) {
        if (!ship.sprite.active) return;

        ship.fireLasers();
    }

    isComplete(): boolean {
        return this.enemies.length === 0;
    }

    getEnemies(): EnemyData[] {
        return this.enemies;
    }

    destroy() {
        this.timers.forEach(timer => timer.remove());
        this.timers = [];
        this.enemies.forEach(enemyData => {
            enemyData.ship.destroy();
        });
        this.enemies = [];
    }
}
