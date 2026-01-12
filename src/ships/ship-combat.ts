import Phaser from 'phaser';
import type { ShipDefinition, ShipCollisionConfig, LootConfig } from './types';
import { Explosion } from './effects/explosion';
import { DustExplosion } from './effects/dust-explosion';
import { Loot } from './loot';
import { TimeUtils } from '../utils/time-utils';

import { injectable } from 'inversify';

/**
 * Handles ship combat: health, damage, explosions, and loot spawning.
 */
@injectable()
export class ShipCombat {
    private _currentHealth: number;
    private isExploding = false;
    private isDestroyed = false;

    constructor(
        private readonly sprite: Phaser.Physics.Matter.Image,
        private readonly definition: ShipDefinition,
        private readonly collisionConfig: ShipCollisionConfig,
        private readonly lootConfig?: LootConfig,
        private readonly onDeath?: () => void
    ) {
        this._currentHealth = definition.gameplay.health;
    }

    get currentHealth(): number {
        return this._currentHealth;
    }

    get isAlive(): boolean {
        return !this.isDestroyed && this._currentHealth > 0;
    }

    /**
     * Apply damage to the ship. Triggers explosion if health drops to 0.
     */
    takeDamage(amount: number): void {
        if (this.isDestroyed || !this.sprite.active) return;

        this._currentHealth -= amount;

        if (this._currentHealth <= 0) {
            this.explode();
        } else {
            // Visual damage feedback
            this.sprite.setTint(0xff0000);
            TimeUtils.delayedCall(this.sprite.scene, 100, () => {
                if (this.sprite?.active) {
                    this.sprite.clearTint();
                }
            });
        }
    }

    /**
     * Trigger ship explosion with effects and loot spawning.
     */
    explode(): void {
        if (!this.sprite.active || this.isExploding) return;
        this.isExploding = true;

        // Play explosion effect immediately to ensure visibility
        const explosionConfig = this.definition.explosion;
        if (explosionConfig) {
            try {
                if (explosionConfig.type === 'dust') {
                    new DustExplosion(this.sprite.scene, this.sprite.x, this.sprite.y, {
                        lifespan: explosionConfig.lifespan,
                        speed: explosionConfig.speed,
                        scale: explosionConfig.scale,
                        color: explosionConfig.color,
                        particleCount: explosionConfig.particleCount,
                        radius: this.sprite.displayWidth * 0.5
                    });
                } else {
                    new Explosion(this.sprite.scene, this.sprite.x, this.sprite.y, explosionConfig);
                }
            } catch (e) {
                console.error('Failed to play explosion effect:', e);
            }
        }

        // Spawn loot immediately
        if (this.lootConfig) {
            this.lootConfig.forEach(lootItem => {
                try {
                    const chance = lootItem.dropChance ?? 1;
                    if (Math.random() <= chance) {
                        const loot = new Loot(this.sprite.scene, this.sprite.x, this.sprite.y, lootItem.type);

                        if (this.collisionConfig.lootCategory) {
                            loot.setCollisionCategory(this.collisionConfig.lootCategory);
                        }
                        if (this.collisionConfig.lootCollidesWith) {
                            loot.setCollidesWith(this.collisionConfig.lootCollidesWith);
                        }
                    }
                } catch (e) {
                    console.error('Failed to spawn loot:', e);
                }
            });
        }

        // Defer destruction to avoid physics world modification during collision
        TimeUtils.delayedCall(this.sprite.scene, 0, () => {
            if (!this.sprite.active && !this.isExploding) return; // Re-check simple active not strictly needed if we are just calling callback, but safe. 
            // Note: isExploding is true now.

            this.isDestroyed = true;
            this.onDeath?.();
        });
    }

    destroy(): void {
        this.isDestroyed = true;
    }
}
