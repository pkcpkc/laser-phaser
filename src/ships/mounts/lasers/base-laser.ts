import Phaser from 'phaser';
import type { Laser } from './types';

export abstract class BaseLaser implements Laser {
    abstract readonly TEXTURE_KEY: string;
    abstract readonly COLOR: number;
    abstract readonly SPEED: number;

    // Optional recoil property
    readonly recoil?: number;

    createTexture(scene: Phaser.Scene) {
        if (!scene.textures.exists(this.TEXTURE_KEY)) {
            const graphics = scene.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(this.COLOR, 1);
            graphics.fillRect(0, 0, 4, 4);
            graphics.generateTexture(this.TEXTURE_KEY, 4, 4);
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
    ) {
        this.createTexture(scene);

        const laser = scene.matter.add.image(x, y, this.TEXTURE_KEY);
        laser.setFrictionAir(0);
        laser.setFixedRotation();
        laser.setSleepThreshold(-1);

        laser.setRotation(angle);

        // Calculate velocity vector from angle and speed
        // Phaser rotation is in radians. 0 is right, PI/2 is down, PI is left, -PI/2 is up.
        // However, standard math usually has 0 as right. 
        // Let's assume the angle passed in matches Phaser's coordinate system.
        const velocityX = Math.cos(angle) * this.SPEED;
        const velocityY = Math.sin(angle) * this.SPEED;

        laser.setVelocity(velocityX, velocityY);

        laser.setCollisionCategory(category);
        laser.setCollidesWith(collidesWith);

        const timer = scene.time.addEvent({
            delay: 100,
            loop: true,
            callback: () => {
                if (!laser.active) {
                    timer.remove();
                    return;
                }
                // Check bounds for cleanup
                if (laser.y < -100 || laser.y > scene.scale.height + 100 ||
                    laser.x < -100 || laser.x > scene.scale.width + 100) {
                    laser.destroy();
                    timer.remove();
                }
            }
        });

        laser.setOnCollide((data: any) => {
            const bodyB = data.bodyB;
            if (!bodyB.gameObject) {
                laser.destroy();
                timer.remove();
            }
        });

        return laser;
    }
}
