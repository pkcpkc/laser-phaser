import Phaser from 'phaser';
import type { Laser } from './types';
import { Projectile } from './projectile';

export abstract class BaseLaser implements Laser {
    abstract readonly TEXTURE_KEY: string;
    abstract readonly COLOR: number;
    abstract readonly SPEED: number;

    // Optional recoil property
    readonly recoil?: number;
    // Optional scale property
    readonly scale?: number;

    readonly reloadTime?: number;
    readonly mountTextureKey?: string;

    readonly visibleOnMount: boolean = false;

    abstract readonly width: number;
    abstract readonly height: number;

    createTexture(scene: Phaser.Scene) {
        if (!scene.textures.exists(this.TEXTURE_KEY)) {
            const graphics = scene.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(this.COLOR, 1);
            graphics.fillRect(0, 0, this.width, this.height);
            graphics.generateTexture(this.TEXTURE_KEY, this.width, this.height);
            graphics.destroy();
        }
    }

    fire(
        scene: Phaser.Scene,
        x: number,
        y: number,
        angle: number,
        category: number,
        collidesWith: number
    ): Phaser.Physics.Matter.Image | undefined {
        this.createTexture(scene);

        // Instantiate pure Projectile
        const laser = new Projectile(
            scene,
            x,
            y,
            this.TEXTURE_KEY,
            undefined,
            category,
            collidesWith
        );

        laser.setRotation(angle);
        if (this.scale) {
            laser.setScale(this.scale);
        }

        // Calculate velocity vector from angle and speed
        const velocityX = Math.cos(angle) * this.SPEED;
        const velocityY = Math.sin(angle) * this.SPEED;

        laser.setVelocity(velocityX, velocityY);

        return laser;
    }
}

