import Phaser from 'phaser';
import { Projectile } from './lasers/projectile';

// Default constants
const DEFAULT_RELOAD_TIME = 200;

/**
 * Base class for all weapon types (lasers, rockets, etc.)
 * Contains common firing logic including ship velocity inheritance.
 */
export abstract class WeaponBase {
    abstract readonly TEXTURE_KEY: string;
    abstract readonly COLOR: number;
    abstract readonly SPEED: number;
    abstract readonly damage: number;
    abstract readonly width: number;
    abstract readonly height: number;

    // How much ship velocity affects projectile speed
    protected readonly SHIP_VELOCITY_FACTOR: number = 0.4;

    // Optional properties
    readonly recoil?: number;
    readonly scale?: number;
    readonly reloadTime: number = DEFAULT_RELOAD_TIME;
    readonly mountTextureKey?: string;
    readonly visibleOnMount: boolean = false;
    readonly firingDelay?: { min: number; max: number };
    readonly fixedFireDirection?: boolean;
    currentAmmo?: number;

    /**
     * Create the texture for the projectile.
     * Override in subclasses for custom textures.
     */
    createTexture(scene: Phaser.Scene) {
        if (!scene.textures.exists(this.TEXTURE_KEY)) {
            const graphics = scene.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(this.COLOR, 1);
            graphics.fillRect(0, 0, this.width, this.height);
            graphics.generateTexture(this.TEXTURE_KEY, this.width, this.height);
            graphics.destroy();
        }
    }

    /**
     * Fire the weapon, creating a projectile with velocity based on angle and ship movement.
     */
    fire(
        scene: Phaser.Scene,
        x: number,
        y: number,
        angle: number,
        category: number,
        collidesWith: number,
        shipVelocity?: { x: number; y: number }
    ): Phaser.Physics.Matter.Image | undefined {
        this.createTexture(scene);

        // Instantiate projectile using Pool
        const projectile = Projectile.getFromPool(
            scene,
            x,
            y,
            this.TEXTURE_KEY,
            undefined,
            category,
            collidesWith,
            this.damage
        );

        projectile.setRotation(angle);
        if (this.scale) {
            projectile.setScale(this.scale);
        }

        // Set hit effect color from weapon's COLOR
        projectile.hitColor = this.COLOR;

        // Calculate velocity vector from angle and speed
        let velocityX = Math.cos(angle) * this.SPEED;
        let velocityY = Math.sin(angle) * this.SPEED;

        // Add ship velocity to projectile velocity (using class factor)
        if (shipVelocity) {
            velocityX += shipVelocity.x * this.SHIP_VELOCITY_FACTOR;
            velocityY += shipVelocity.y * this.SHIP_VELOCITY_FACTOR;
        }

        projectile.setVelocity(velocityX, velocityY);

        // Add trail effect (can be overridden by subclasses)
        this.addTrailEffect(scene, projectile);

        return projectile;
    }

    /**
     * Add a trail effect to the projectile.
     * Override in subclasses for custom trail effects.
     */
    protected addTrailEffect(_scene: Phaser.Scene, _projectile: Phaser.Physics.Matter.Image) {
        // Default implementation - can be overridden by subclasses
    }

    /**
     * Optional mount effect when weapon is visible on ship.
     * Override in subclasses for custom mount effects.
     */
    addMountEffect?(scene: Phaser.Scene, mountSprite: Phaser.GameObjects.Image): void;
}
