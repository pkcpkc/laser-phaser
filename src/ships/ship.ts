import Phaser from 'phaser';
import type { Laser } from './mounts/lasers/types';
import type { ShipEffect } from './effects/types';
import { Explosion } from './effects/explosion';

export * from './types';
import type { ShipConfig, ShipCollisionConfig } from './types';

import { Loot } from './loot';

interface ActiveMount {
    x: number;
    y: number;
    angle: number;
    weapon: Laser;
}

export class Ship {
    readonly sprite: Phaser.Physics.Matter.Image;
    private activeMounts: ActiveMount[] = [];
    private effect?: ShipEffect;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        public readonly config: ShipConfig,
        private readonly collisionConfig: ShipCollisionConfig
    ) {
        // Use definition for asset loading
        this.sprite = scene.matter.add.image(x, y, config.definition.assetKey);
        this.sprite.setData('ship', this);

        const phys = config.definition.physics;
        // Apply Physics Config
        this.sprite.setAngle(phys.initialAngle || 0);
        if (phys.fixedRotation) this.sprite.setFixedRotation();
        if (phys.frictionAir !== undefined) this.sprite.setFrictionAir(phys.frictionAir);
        if (phys.mass) this.sprite.setMass(phys.mass);

        this.sprite.setSleepThreshold(-1);

        // Apply Collision Config
        this.sprite.setCollisionCategory(collisionConfig.category);
        this.sprite.setCollidesWith(collisionConfig.collidesWith);

        // Initialize Mounts
        this.activeMounts = [];
        if (config.mounts) {
            this.activeMounts = config.mounts.map(m => {
                // Determine relative position based on sprite center
                // Markers are usually absolute pixels on the original image? 
                // Previous code assumed marker x/y are pixels on the image.
                const mountX = m.marker.x - (this.sprite.width * 0.5);
                const mountY = m.marker.y - (this.sprite.height * 0.5);
                const mountAngle = m.marker.angle * (Math.PI / 180);

                return {
                    x: mountX,
                    y: mountY,
                    angle: mountAngle,
                    weapon: new m.weapon()
                };
            });
        }
    }

    setEffect(effect: ShipEffect) {
        if (this.effect) {
            this.effect.destroy();
        }
        this.effect = effect;
    }

    fireLasers() {
        if (!this.sprite.active) return;

        let totalRecoil = 0;

        for (const mount of this.activeMounts) {
            const rotation = this.sprite.rotation;

            // Rotate mount point offset
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);

            const rotatedX = mount.x * cos - mount.y * sin;
            const rotatedY = mount.x * sin + mount.y * cos;

            const absoluteX = this.sprite.x + rotatedX;
            const absoluteY = this.sprite.y + rotatedY;
            const absoluteAngle = rotation + (mount.angle || 0);

            mount.weapon.fire(
                this.sprite.scene,
                absoluteX,
                absoluteY,
                absoluteAngle,
                this.collisionConfig.laserCategory,
                this.collisionConfig.laserCollidesWith
            );

            if (mount.weapon.recoil) {
                totalRecoil += mount.weapon.recoil;
            }
        }

        // Apply average or total recoil? Usually concurrent fire adds up.
        // If getting too crazy, might want to damp it, but let's try sum first.
        if (totalRecoil > 0) {
            this.sprite.thrustBack(totalRecoil / (this.activeMounts.length || 1)); // Averaging recoil for stability for now
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

            const explosionConfig = this.config.definition.explosion;
            if (explosionConfig) {
                new Explosion(this.sprite.scene, this.sprite.x, this.sprite.y, explosionConfig);
            }

            // Loot Spawning Logic
            // Priority: Mount (5%) -> Standard Loot (Configured Chance)

            let lootSpawned = false;

            // 1. Try to spawn Mount (5% chance)
            if (Math.random() <= 0.05) {
                // console.log('Spawning MOUNT loot');
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
            // Loot config is now on the definition or the instance?
            // Types says ShipConfig has loot, but ShipDefinition doesn't have it explicitly in my previous step?
            // Checking types.ts content I wrote:
            // ShipConfig has loot?: LootConfig

            if (!lootSpawned && this.config.loot) {
                try {
                    const chance = this.config.loot.dropChance ?? 1;
                    if (Math.random() <= chance) {
                        // console.log('Spawning standard loot');
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
