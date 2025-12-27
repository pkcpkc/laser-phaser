import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../../../ships/ship';
import type { ShipConfig } from '../../../ships/types';
import type { IFormation } from './types';

export interface BaseEnemyData {
    ship: Ship;
    spawnTime: number;
    startX?: number;
    startY?: number;
    [key: string]: any; // Allow other properties like wobbleOffset
}

export interface ShootingConfig {
    shootingChance: number;
    shotsPerEnemy: number;
    shotDelay: { min: number; max: number };
    continuousFire?: boolean;
}

export abstract class BaseFormation implements IFormation {
    protected scene: Phaser.Scene;
    protected enemies: BaseEnemyData[] = [];
    protected shipClass: new (scene: Phaser.Scene, x: number, y: number, config: ShipConfig, collisionConfig: ShipCollisionConfig) => Ship;
    protected shipConfig?: ShipConfig;
    protected collisionConfig: ShipCollisionConfig;
    protected timers: Phaser.Time.TimerEvent[] = [];

    constructor(
        scene: Phaser.Scene,
        shipClass: new (scene: Phaser.Scene, x: number, y: number, config: ShipConfig, collisionConfig: ShipCollisionConfig) => Ship,
        collisionConfig: ShipCollisionConfig,
        shipConfig?: ShipConfig
    ) {
        this.scene = scene;
        this.shipClass = shipClass;
        this.collisionConfig = collisionConfig;
        this.shipConfig = shipConfig;
    }

    /**
     * Spawn the formation - must be implemented by subclasses
     */
    abstract spawn(): void;

    /**
     * Update the formation - must be implemented by subclasses
     */
    abstract update(time: number, delta?: number): void;

    /**
     * Schedule shooting behavior for a ship
     */
    protected scheduleShootingBehavior(ship: Ship, enemy: Phaser.Physics.Matter.Image, config: ShootingConfig): void {
        if (config.continuousFire) {
            if (Math.random() < config.shootingChance) {
                const startDelay = Phaser.Math.Between(0, 2000);
                this.scheduleContinuousFire(ship, config.shotDelay, startDelay);
            }
        } else if (config.shotsPerEnemy > 0) {
            if (Math.random() < config.shootingChance) {
                for (let j = 0; j < config.shotsPerEnemy; j++) {
                    const delay = Phaser.Math.Between(
                        config.shotDelay.min,
                        config.shotDelay.max
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

    /**
     * Fire lasers from an enemy ship
     */
    protected fireEnemyLaser(ship: Ship): void {
        if (!ship.sprite.active) return;
        ship.fireLasers();
    }

    /**
     * Get effective firing delay, using the lower of formation and weapon delays.
     * If formation defines a higher rate (lower delay) than the weapon allows,
     * the weapon's delay is used instead.
     */
    protected getEffectiveShotDelay(ship: Ship, formationDelay: { min: number; max: number }): { min: number; max: number } {
        // Check all weapons on the ship for their firingDelay
        // Use the highest (slowest) weapon delay to respect weapon limits
        let weaponMinDelay = 0;
        let weaponMaxDelay = 0;

        for (const mount of ship.config.mounts) {
            const weapon = new mount.weapon();
            if (weapon.firingDelay) {
                weaponMinDelay = Math.max(weaponMinDelay, weapon.firingDelay.min);
                weaponMaxDelay = Math.max(weaponMaxDelay, weapon.firingDelay.max);
            }
        }

        // If any weapon has a firingDelay, use the higher (slower) of formation or weapon
        if (weaponMaxDelay > 0) {
            return {
                min: Math.max(formationDelay.min, weaponMinDelay),
                max: Math.max(formationDelay.max, weaponMaxDelay)
            };
        }

        return formationDelay;
    }

    /**
     * Schedule continuous fire for a ship
     */
    protected scheduleContinuousFire(ship: Ship, shotDelay: { min: number; max: number }, delayOverride?: number): void {
        if (!ship.sprite.active) return;

        const effectiveDelay = this.getEffectiveShotDelay(ship, shotDelay);
        const delay = delayOverride ?? Phaser.Math.Between(
            effectiveDelay.min,
            effectiveDelay.max
        );

        const timer = this.scene.time.delayedCall(delay, () => {
            // Remove myself from the list
            this.timers = this.timers.filter(t => t !== timer);

            if (ship.sprite.active) {
                this.fireEnemyLaser(ship);
                this.scheduleContinuousFire(ship, shotDelay);
            }
        });
        this.timers.push(timer);
    }

    /**
     * Check if the formation is complete (all enemies destroyed)
     */
    isComplete(): boolean {
        return this.enemies.length === 0;
    }

    /**
     * Get all enemies in the formation
     */
    getEnemies(): BaseEnemyData[] {
        return this.enemies;
    }

    /**
     * Alias for getEnemies to satisfy IFormation if needed, 
     * but strictly IFormation returns BaseEnemyData[] which matches getEnemies
     */
    getShips(): BaseEnemyData[] {
        return this.enemies;
    }

    /**
     * Destroy the formation and clean up resources
     */
    destroy(): void {
        this.timers.forEach(timer => timer.remove());
        this.timers = [];
        this.enemies.forEach(enemyData => {
            enemyData.ship.destroy();
        });
        this.enemies = [];
    }
}

