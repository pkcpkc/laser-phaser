import { injectable } from 'inversify';
import type { IModuleManager } from '../di/interfaces/ship';
import Phaser from 'phaser';
import type { Laser } from './modules/lasers/types';
import type { Drive } from './modules/drives/types';
import { isWeapon, type ShipModule } from './modules/module-types';
import type { ShipConfig, ShipCollisionConfig, ShipMarker } from './types';
import { TimeUtils } from '../utils/time-utils';

export interface ActiveModule {
    x: number;
    y: number;
    angle: number;
    module: Laser | Drive;
    lastFired?: number;
}

/**
 * Manages ship modules: initialization, visual syncing, and firing.
 */
@injectable()
export class ModuleManager implements IModuleManager {
    private activeModules: ActiveModule[] = [];
    private moduleSprites: Map<ActiveModule, Phaser.GameObjects.Image> = new Map();
    private updateListener?: () => void;

    constructor(
        private readonly scene: Phaser.Scene,
        private readonly sprite: Phaser.Physics.Matter.Image,
        modules: ShipConfig['modules'] | undefined,
        private readonly collisionConfig: ShipCollisionConfig,
        originMarker?: ShipMarker
    ) {
        if (!modules) return;

        const originX = originMarker ? originMarker.x : (sprite.width * 0.5);
        const originY = originMarker ? originMarker.y : (sprite.height * 0.5);

        this.activeModules = modules.map(m => {
            const moduleX = m.marker.x - originX;
            const moduleY = m.marker.y - originY;
            const moduleAngle = m.marker.angle * (Math.PI / 180);

            const moduleData: ActiveModule = {
                x: moduleX,
                y: moduleY,
                angle: moduleAngle,
                module: new m.module()
            };

            // Create texture if needed
            if (moduleData.module.createTexture) {
                moduleData.module.createTexture(scene);
            }

            // Create visual sprite if visible on mount
            if (moduleData.module.visibleOnMount) {
                const shipModule = moduleData.module as ShipModule;
                const textureKey = shipModule.mountTextureKey || shipModule.TEXTURE_KEY;

                if (textureKey) {
                    const x = sprite.x;
                    const y = sprite.y;
                    const moduleSprite = scene.add.image(x + moduleX, y + moduleY, textureKey);

                    moduleSprite.setRotation(sprite.rotation + moduleAngle);
                    moduleSprite.setDepth(sprite.depth + 1);

                    if (moduleData.module.scale) {
                        moduleSprite.setScale(moduleData.module.scale);
                    }
                    this.moduleSprites.set(moduleData, moduleSprite);

                    if (moduleData.module.addMountEffect) {
                        moduleData.module.addMountEffect(scene, moduleSprite);
                    }
                } else {
                    console.warn('No texture key for visible mount module');
                }
            }

            return moduleData;
        });

        // Setup update listener for visual sync
        if (this.moduleSprites.size > 0) {
            this.updateListener = () => this.update();
            scene.events.on('postupdate', this.updateListener);

            // Initial + delayed update for race conditions
            this.update();
            TimeUtils.delayedCall(scene, 100, () => this.update());
        }
    }

    /**
     * Fire all weapon modules.
     */
    fireLasers(): void {
        if (!this.sprite.active) return;

        let totalRecoil = 0;
        const now = this.scene.time.now;

        for (const module of this.activeModules) {
            if (!isWeapon(module.module)) continue;
            const weapon = module.module;

            // Check reload cooldown
            if (weapon.reloadTime && module.lastFired) {
                if (now - module.lastFired < weapon.reloadTime) {
                    continue;
                }
            }

            // Check ammo (skip for enemies - unlimited)
            if (!this.collisionConfig.isEnemy) {
                if (weapon.currentAmmo !== undefined && weapon.currentAmmo <= 0) {
                    continue;
                }
            }

            const rotation = this.sprite.rotation;
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);

            const rotatedX = module.x * cos - module.y * sin;
            const rotatedY = module.x * sin + module.y * cos;

            const absoluteX = this.sprite.x + rotatedX;
            const absoluteY = this.sprite.y + rotatedY;
            let absoluteAngle = rotation + (module.angle || 0);

            if (weapon.fixedFireDirection) {
                absoluteAngle = -Math.PI / 2;
            }

            const shipBody = this.sprite.body as MatterJS.BodyType;
            const shipVelocity = { x: shipBody.velocity.x, y: shipBody.velocity.y };

            const projectile = weapon.fire(
                this.scene,
                absoluteX,
                absoluteY,
                absoluteAngle,
                this.collisionConfig.laserCategory,
                this.collisionConfig.laserCollidesWith,
                shipVelocity
            );

            if (projectile) {
                module.lastFired = now;

                // Refill ammo for enemies
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

        if (totalRecoil > 0) {
            this.sprite.thrustBack(totalRecoil / (this.activeModules.length || 1));
        }
    }

    /**
     * Sync module sprite positions with ship.
     */
    update(): void {
        if (!this.sprite.active || !this.sprite.visible) {
            this.moduleSprites.forEach(sprite => sprite.setVisible(false));
            return;
        }

        const rotation = this.sprite.rotation;
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const now = this.scene.time.now;

        this.moduleSprites.forEach((sprite, module) => {
            // Check weapon visibility (ammo/reload)
            if (isWeapon(module.module)) {
                const weapon = module.module;
                if (weapon.currentAmmo !== undefined && weapon.currentAmmo <= 0) {
                    sprite.setVisible(false);
                    return;
                }
                if (weapon.reloadTime && module.lastFired) {
                    if (now - module.lastFired < weapon.reloadTime) {
                        sprite.setVisible(false);
                        return;
                    }
                }
            }

            sprite.setVisible(true);

            const rotatedX = module.x * cos - module.y * sin;
            const rotatedY = module.x * sin + module.y * cos;

            sprite.setPosition(this.sprite.x + rotatedX, this.sprite.y + rotatedY);
            sprite.setRotation(rotation + (module.angle || 0));
        });
    }

    /**
     * Get modules for physics calculations.
     */
    getActiveModules(): ActiveModule[] {
        return this.activeModules;
    }

    destroy(): void {
        if (this.updateListener) {
            this.scene.events?.off('postupdate', this.updateListener);
            this.updateListener = undefined;
        }
        this.moduleSprites.forEach(sprite => sprite.destroy());
        this.moduleSprites.clear();
    }
}
