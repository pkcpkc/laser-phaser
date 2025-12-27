import Phaser from 'phaser';
import type { Laser } from './modules/lasers/types';
import type { Drive } from './modules/drives/types';
import type { ShipEffect } from './effects/types';
import { Explosion } from './effects/explosion';

export * from './types';
import type { ShipConfig, ShipCollisionConfig } from './types';

import { Loot } from './loot';

interface ActiveModule {
    x: number;
    y: number;
    angle: number;
    module: Laser | Drive;
    lastFired?: number;
}

export class Ship {
    readonly sprite: Phaser.Physics.Matter.Image;
    private activeModules: ActiveModule[] = [];
    private moduleSprites: Map<ActiveModule, Phaser.GameObjects.Image> = new Map();
    private effect?: ShipEffect;
    private updateListener?: () => void;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        public readonly config: ShipConfig,
        private readonly collisionConfig: ShipCollisionConfig
    ) {
        // Use definition for asset loading
        this.sprite = scene.matter.add.image(x, y, config.definition.assetKey, config.definition.frame);
        this.sprite.setData('ship', this);

        const phys = config.definition.physics;
        // Apply Physics Config
        this.sprite.setAngle(phys.initialAngle || 0);
        if (phys.fixedRotation) this.sprite.setFixedRotation();
        if (phys.frictionAir !== undefined) this.sprite.setFrictionAir(phys.frictionAir);
        if (phys.mass) this.sprite.setMass(phys.mass);

        this.sprite.setSleepThreshold(-1);

        // Initial mass set
        if (this.mass) {
            this.sprite.setMass(this.mass);
        }

        // Apply Collision Config
        this.sprite.setCollisionCategory(collisionConfig.category);
        this.sprite.setCollidesWith(collisionConfig.collidesWith);

        // Initialize Modules
        this.activeModules = [];
        if (config.modules) {
            this.activeModules = config.modules.map(m => {
                // Determine relative position based on sprite center
                // Markers are usually absolute pixels on the original image? 
                // Previous code assumed marker x/y are pixels on the image.
                const moduleX = m.marker.x - (this.sprite.width * 0.5);
                const moduleY = m.marker.y - (this.sprite.height * 0.5);
                const moduleAngle = m.marker.angle * (Math.PI / 180);

                const moduleData = {
                    x: moduleX,
                    y: moduleY,
                    angle: moduleAngle,
                    module: new m.module()
                };

                // Create texture if needed/possible
                if (moduleData.module.createTexture) {
                    moduleData.module.createTexture(scene);
                }

                // Create sprite if visible on mount
                if (moduleData.module.visibleOnMount) {
                    // Create a visual-only sprite (no physics)
                    // Use the mountTextureKey if available, otherwise TEXTURE_KEY
                    const module = moduleData.module as any;
                    const textureKey = module.mountTextureKey || module.TEXTURE_KEY;

                    if (textureKey) {
                        const moduleSprite = scene.add.image(x + moduleX, y + moduleY, textureKey);

                        // Initial rotation
                        moduleSprite.setRotation(this.sprite.rotation + moduleAngle);
                        moduleSprite.setDepth(this.sprite.depth + 1); // Ensure on top
                        // Inherit scale if present
                        if (moduleData.module.scale) {
                            moduleSprite.setScale(moduleData.module.scale);
                        }
                        this.moduleSprites.set(moduleData, moduleSprite);

                        // Add mount effect if weapon provides one
                        if (moduleData.module.addMountEffect) {
                            moduleData.module.addMountEffect(scene, moduleSprite);
                        }
                    } else {
                        console.warn('No texture key for visible mount module');
                    }
                }

                return moduleData;
            });
        }

        // Setup update listener to sync mount sprites
        if (this.moduleSprites.size > 0) {
            this.updateListener = () => this.updateModules();
            // Use postupdate to ensure ship physics/movement has finished for the frame
            this.sprite.scene.events.on('postupdate', this.updateListener);

            // cleanup on destroy is important
            this.sprite.once('destroy', () => {
                this.destroy();
            });
            // Force initial update to set correct position and visibility
            this.updateModules();

            // Checking for load race conditions: Update again after a short delay to ensure dimensions are loaded
            scene.time.delayedCall(100, () => {
                this.updateModules();
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
        const now = this.sprite.scene.time.now;


        for (const module of this.activeModules) {
            // Type guard: Check if module is a weapon (has fire method)
            const weapon = module.module as any; // Cast to access potential weapon properties safely with checks
            if (typeof weapon.fire !== 'function') continue;

            // Check reload cooldown
            if (weapon.reloadTime && module.lastFired) {
                if (now - module.lastFired < weapon.reloadTime) {
                    continue; // Still reloading
                }
            }

            // Check ammo (skip for enemies - unlimited ammo)
            if (!this.collisionConfig.isEnemy) {
                if (weapon.currentAmmo !== undefined && weapon.currentAmmo <= 0) {
                    continue; // Out of ammo
                }
            }

            const rotation = this.sprite.rotation;

            // Rotate mount point offset
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);

            const rotatedX = module.x * cos - module.y * sin;
            const rotatedY = module.x * sin + module.y * cos;

            const absoluteX = this.sprite.x + rotatedX;
            const absoluteY = this.sprite.y + rotatedY;
            const absoluteAngle = rotation + (module.angle || 0);

            const projectile = weapon.fire(
                this.sprite.scene,
                absoluteX,
                absoluteY,
                absoluteAngle,
                this.collisionConfig.laserCategory,
                this.collisionConfig.laserCollidesWith
            );

            if (projectile) {
                module.lastFired = now; // Mark time fired

                // Refill ammo for enemies (unlimited ammo)
                if (this.collisionConfig.isEnemy && weapon.currentAmmo !== undefined) {
                    if (weapon.maxAmmo) {
                        weapon.currentAmmo = weapon.maxAmmo;
                    }
                }
            }

            if (weapon.recoil) {
                totalRecoil += weapon.recoil;
            }
        }

        // Apply average or total recoil? Usually concurrent fire adds up.
        // If getting too crazy, might want to damp it, but let's try sum first.
        if (totalRecoil > 0) {
            this.sprite.thrustBack(totalRecoil / (this.activeModules.length || 1)); // Averaging recoil for stability for now
        }
    }

    private updateModules() {
        // If ship is not active or not visible, hide all mounts
        if (!this.sprite.active || !this.sprite.visible) {
            this.moduleSprites.forEach(sprite => sprite.setVisible(false));
            return;
        }

        const rotation = this.sprite.rotation;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        this.moduleSprites.forEach((sprite, module) => {
            // Check ammo visibility
            const now = this.sprite.scene.time.now;
            const weapon = module.module as any;

            // Only check usage stats for weapons
            if (typeof weapon.fire === 'function') {
                // 1. Check Ammo
                if (weapon.currentAmmo !== undefined && weapon.currentAmmo <= 0) {
                    sprite.setVisible(false);
                    return;
                }

                // 2. Check Reload State
                if (weapon.reloadTime && module.lastFired) {
                    if (now - module.lastFired < weapon.reloadTime) {
                        sprite.setVisible(false); // Reloading -> Hide
                        return;
                    }
                }
            }

            // Default: Visible
            sprite.setVisible(true);

            // Sync position
            const rotatedX = module.x * cos - module.y * sin;
            const rotatedY = module.x * sin + module.y * cos;

            const absoluteX = this.sprite.x + rotatedX;
            const absoluteY = this.sprite.y + rotatedY;
            const absoluteAngle = rotation + (module.angle || 0);

            sprite.setPosition(absoluteX, absoluteY);
            sprite.setRotation(absoluteAngle);
        });
    }

    private isExploding = false;
    private isDestroyed = false;

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
                    type: 'module' as const,
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
        if (this.isDestroyed) return;
        this.isDestroyed = true;

        if (this.effect) {
            this.effect.destroy();
            this.effect = undefined;
        }

        // Clean up mount sprites
        if (this.updateListener) {
            this.sprite?.scene?.events?.off('postupdate', this.updateListener);
            this.updateListener = undefined;
        }
        this.moduleSprites.forEach(sprite => sprite.destroy());
        this.moduleSprites.clear();

        if (this.sprite && this.sprite.active) {
            this.sprite.destroy();
        }
    }

    // --- Physics Properties ---

    get mass(): number {
        return this.config.definition.physics.mass || 1;
    }

    get speed(): number {
        let totalThrust = 0;
        for (const m of this.activeModules) {
            if ('thrust' in m.module) {
                totalThrust += (m.module as Drive).thrust;
            }
        }

        // Speed = (Sum(Drive.thrust)) / Ship.mass
        // If no drives, fallback to defined speed or 0
        if (totalThrust > 0) {
            return totalThrust / this.mass;
        }

        return this.config.definition.gameplay.speed || 0;
    }
}
