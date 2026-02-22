import { injectable, unmanaged } from 'inversify';
import type { IShip } from '../di/interfaces/ship';
import Phaser from 'phaser';
import type { Drive } from './modules/drives/types';
import type { ShipEffect } from './effects/types';
import { HealthIndicator } from './health-indicator';
import { ModuleManager } from './module-manager';
import { ShipCombat } from './ship-combat';
import type { ShipConfig, ShipCollisionConfig } from './types';
export * from './types';

/**
 * Main ship entity using composition for cleaner separation of concerns.
 */
@injectable()
export class Ship implements IShip {
    readonly sprite: Phaser.Physics.Matter.Image;
    private modules: ModuleManager;
    private combat: ShipCombat;
    private effect?: ShipEffect;
    private hasEnteredScreen: boolean = false;
    private originalCollidesWith: number = 0;
    private isDestroyed = false;
    private healthIndicator?: HealthIndicator;

    constructor(
        @unmanaged() scene: Phaser.Scene,
        @unmanaged() x: number,
        @unmanaged() y: number,
        @unmanaged() public readonly config: ShipConfig,
        @unmanaged() collisionConfig: ShipCollisionConfig
    ) {
        // Determine texture
        const assetKey = config.definition.randomizeAssetKey
            ? config.definition.randomizeAssetKey(scene)
            : config.definition.assetKey;

        // Validate texture
        if (!scene.textures.exists(assetKey)) {
            console.error(`Ship ${config.definition.id}: Texture '${assetKey}' not found!`);
        } else if (config.definition.frame && !scene.textures.get(assetKey).has(config.definition.frame)) {
            console.error(`Ship ${config.definition.id}: Frame '${config.definition.frame}' not found in texture '${assetKey}'!`);
        }

        // Create sprite
        this.sprite = scene.matter.add.image(x, y, assetKey, config.definition.frame);
        this.sprite.setData('ship', this);

        // Apply physics config
        const phys = config.definition.physics;
        this.sprite.setAngle(phys.initialAngle || 0);
        if (phys.fixedRotation) this.sprite.setFixedRotation();
        if (phys.frictionAir !== undefined) this.sprite.setFrictionAir(phys.frictionAir);
        if (phys.massRange) {
            const mass = Phaser.Math.FloatBetween(phys.massRange.min, phys.massRange.max);
            this.sprite.setMass(mass);
        } else if (phys.mass) {
            this.sprite.setMass(phys.mass);
        }
        this.sprite.setSleepThreshold(-1);

        if (this.mass) {
            this.sprite.setMass(this.mass);
        }

        // Apply collision config
        this.sprite.setCollisionCategory(collisionConfig.category);

        // Apply origin from markers
        const originMarker = config.definition.markers.find(m => m.type === 'origin');
        if (originMarker) {
            this.sprite.setOrigin(
                originMarker.x / this.sprite.width,
                originMarker.y / this.sprite.height
            );
        } else {
            this.sprite.setOrigin(0.5, 0.5);
        }

        // Spawn protection for enemies spawning off-screen
        if (collisionConfig.isEnemy && y < 0) {
            this.originalCollidesWith = collisionConfig.collidesWith;
            this.sprite.setCollidesWith(0);
            this.hasEnteredScreen = false;
        } else {
            this.sprite.setCollidesWith(collisionConfig.collidesWith);
            this.hasEnteredScreen = true;
        }

        // Initialize module manager
        this.modules = new ModuleManager(
            scene,
            this.sprite,
            config.modules,
            collisionConfig,
            originMarker
        );

        // Initialize combat system
        this.combat = new ShipCombat(
            this.sprite,
            config.definition,
            collisionConfig,
            config.loot,
            () => this.destroy()
        );

        // Setup spawn protection check if needed
        if (!this.hasEnteredScreen) {
            const checkSpawn = () => {
                if (!this.hasEnteredScreen && this.sprite.active && this.sprite.y > 0) {
                    this.hasEnteredScreen = true;
                    this.sprite.setCollidesWith(this.originalCollidesWith);
                }
            };
            scene.events.on('postupdate', checkSpawn);
            this.sprite.once('destroy', () => scene.events.off('postupdate', checkSpawn));
        }

        // Cleanup on destroy
        this.sprite.once('destroy', () => this.destroy());

        // Create effect if defined
        if (config.definition.createEffect) {
            this.setEffect(config.definition.createEffect(scene, this));
        }

        // Health bar initialization
        const isPlayer = !collisionConfig.isEnemy;
        const maxHealth = config.definition.gameplay.health;
        // Always show for player, or if maxHealth >= 100
        if (isPlayer || maxHealth >= 100) {
            this.healthIndicator = new HealthIndicator(scene, this.sprite, this.combat, config.definition);
            this.healthIndicator.redraw();
        }
    }

    // === Delegated Combat Methods ===

    get currentHealth(): number {
        return this.combat.currentHealth;
    }

    takeDamage(amount: number): void {
        this.combat.takeDamage(amount);
        if (this.healthIndicator) {
            this.healthIndicator.onDamage();
            this.healthIndicator.redraw();
        }
    }

    explode(): void {
        this.combat.explode();
    }

    // === Delegated Module Methods ===

    fireLasers(): void {
        this.modules.fireLasers();
    }

    // === Ship-specific Methods ===

    setEffect(effect: ShipEffect): void {
        if (this.effect) {
            this.effect.destroy();
        }
        this.effect = effect;
    }

    destroy(): void {
        if (this.isDestroyed) return;
        this.isDestroyed = true;

        if (this.healthIndicator) {
            this.healthIndicator.destroy();
            this.healthIndicator = undefined;
        }

        if (this.effect) {
            this.effect.destroy();
            this.effect = undefined;
        }

        this.modules.destroy();
        this.combat.destroy();

        if (this.sprite?.active) {
            this.sprite.destroy();
        }
    }

    // === Physics Properties ===

    get mass(): number {
        // If mass was randomized on creation, we should rely on the body mass
        if (this.sprite && this.sprite.body) {
            return this.sprite.body.mass;
        }
        return this.config.definition.physics.mass || 1;
    }

    get acceleration(): number {
        let totalThrust = 0;
        let driveCount = 0;

        for (const m of this.modules.getActiveModules()) {
            if ('thrust' in m.module) {
                totalThrust += (m.module as Drive).thrust;
                driveCount++;
            }
        }

        if (totalThrust > 0) {
            let acc = totalThrust / this.mass;
            if (driveCount > 1) {
                acc *= 0.7; // Diminishing returns for multiple drives
            }
            return acc;
        }

        return this.config.definition.gameplay.speed || 0;
    }

    get maxSpeed(): number {
        const frictionAir = this.config.definition.physics.frictionAir || 0.01;
        return this.acceleration / frictionAir;
    }

}
