import Phaser from 'phaser';
import type { Laser } from './mounts/lasers/types';
import type { ShipEffect } from './effects/types';
import { Explosion } from './effects/explosion';

export * from './types';
import type { ShipConfig, ShipCollisionConfig, MountPoint } from './types';

import { Loot } from './loot';

export class Ship {
    readonly sprite: Phaser.Physics.Matter.Image;
    private primaryLaser?: Laser;
    private effect?: ShipEffect;
    private mountPoints: MountPoint[];

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        public readonly config: ShipConfig,
        private readonly collisionConfig: ShipCollisionConfig
    ) {
        this.sprite = scene.matter.add.image(x, y, config.assetKey);
        this.sprite.setData('ship', this);

        // Apply Physics Config
        this.sprite.setAngle(config.physics.initialAngle || 0);
        if (config.physics.fixedRotation) this.sprite.setFixedRotation();
        if (config.physics.frictionAir !== undefined) this.sprite.setFrictionAir(config.physics.frictionAir);
        if (config.physics.mass) this.sprite.setMass(config.physics.mass);

        this.sprite.setSleepThreshold(-1);

        // Apply Collision Config
        this.sprite.setCollisionCategory(collisionConfig.category);
        this.sprite.setCollidesWith(collisionConfig.collidesWith);

        // Initialize Mounts
        this.mountPoints = config.mountPoints || [{ x: 0, y: 0, angle: 0 }];

        if (config.mounts?.primary) {
            this.primaryLaser = new config.mounts.primary();
        }
    }

    setEffect(effect: ShipEffect) {
        if (this.effect) {
            this.effect.destroy();
        }
        this.effect = effect;
    }

    fireLasers() {
        if (!this.sprite.active || !this.primaryLaser) return;

        for (const mount of this.mountPoints) {
            const rotation = this.sprite.rotation;

            // Rotate mount point offset
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);

            const rotatedX = mount.x * cos - mount.y * sin;
            const rotatedY = mount.x * sin + mount.y * cos;

            const absoluteX = this.sprite.x + rotatedX;
            const absoluteY = this.sprite.y + rotatedY;
            const absoluteAngle = rotation + (mount.angle || 0);

            this.primaryLaser.fire(
                this.sprite.scene,
                absoluteX,
                absoluteY,
                absoluteAngle,
                this.collisionConfig.laserCategory,
                this.collisionConfig.laserCollidesWith
            );
        }

        if (this.primaryLaser.recoil) {
            this.sprite.thrustBack(this.primaryLaser.recoil);
        }
    }

    private isExploding = false;

    explode() {
        if (!this.sprite.active || this.isExploding) return;
        this.isExploding = true;

        // Defer explosion logic to avoid modifying physics world during collision step
        this.sprite.scene.time.delayedCall(0, () => {
            // console.log('Ship exploding deferred execution');
            if (!this.sprite.active) return; // Double check in case already destroyed

            const explosionConfig = this.config.explosion;
            if (explosionConfig) {
                new Explosion(this.sprite.scene, this.sprite.x, this.sprite.y, explosionConfig);
            }

            // Loot Spawning Logic
            // Priority: Mount (5%) -> Standard Loot (Configured Chance)

            let lootSpawned = false;

            // 1. Try to spawn Mount (5% chance)
            if (Math.random() <= 0.05) {
                console.log('Spawning MOUNT loot');
                const mountLootConfig = {
                    text: '📦',
                    type: 'mount' as const,
                    lifespan: 5000
                };
                const loot = new Loot(this.sprite.scene, this.sprite.x, this.sprite.y, mountLootConfig);
                if (this.collisionConfig.lootCategory) {
                    loot.setCollisionCategory(this.collisionConfig.lootCategory);
                }
                if (this.collisionConfig.lootCollidesWith) {
                    loot.setCollidesWith(this.collisionConfig.lootCollidesWith);
                }
                lootSpawned = true;
            }

            // 2. If no Mount spawned, try Standard Loot
            if (!lootSpawned && this.config.loot) {
                try {
                    const chance = this.config.loot.dropChance ?? 1;
                    if (Math.random() <= chance) {
                        console.log('Spawning standard loot');
                        const loot = new Loot(this.sprite.scene, this.sprite.x, this.sprite.y, this.config.loot);
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
            }

            this.destroy();
        });
    }

    destroy() {
        if (this.effect) {
            this.effect.destroy();
            this.effect = undefined;
        }
        if (this.sprite && this.sprite.active) {
            this.sprite.destroy();
        }
    }
}
