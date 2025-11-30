import Phaser from 'phaser';
import type { Laser } from './types';

export class RedLaser implements Laser {
    readonly TEXTURE_KEY = 'enemy-laser';

    createTexture(scene: Phaser.Scene) {
        if (!scene.textures.exists(this.TEXTURE_KEY)) {
            const graphics = scene.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0xff0000, 1);
            graphics.fillRect(0, 0, 4, 4);
            graphics.generateTexture(this.TEXTURE_KEY, 4, 4);
            graphics.destroy();
        }
    }

    fire(
        scene: Phaser.Scene,
        x: number,
        y: number,
        category: number,
        collidesWith: number
    ) {
        this.createTexture(scene);

        const laser = scene.matter.add.image(x, y, this.TEXTURE_KEY);
        laser.setFrictionAir(0);
        laser.setFixedRotation();
        laser.setSleepThreshold(-1);
        laser.setVelocityY(5); // Move down slower

        laser.setCollisionCategory(category);
        laser.setCollidesWith(collidesWith);

        const timer = scene.time.addEvent({
            delay: 100,
            loop: true,
            callback: () => {
                // console.log('RedLaser update', laser.active);
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
