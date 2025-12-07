import Phaser from 'phaser';
import { BaseRocket } from './base-rocket';

export class GreenRocket extends BaseRocket {
    readonly TEXTURE_KEY = 'green-rocket';
    readonly COLOR = 0x00ff00;
    readonly SPEED = 4; // Slower than laser (8)
    readonly recoil = 0.1;
    readonly width = 2;
    readonly height = 2;

    readonly maxAmmo = 20;

    constructor() {
        super();
        this.currentAmmo = this.maxAmmo;
    }

    override fire(
        scene: Phaser.Scene,
        x: number,
        y: number,
        angle: number,
        category: number,
        collidesWith: number
    ) {
        // Create the base projectile
        const rocket = super.fire(scene, x, y, angle, category, collidesWith);

        if (rocket) {
            // Add rotating pixel effect
            this.addRotatingEffect(scene, rocket);
        }

        return rocket;
    }

    private addRotatingEffect(scene: Phaser.Scene, rocket: Phaser.Physics.Matter.Image) {
        // Create 2 small pixels that orbit the rocket
        const radius = 8;
        const speed = 0.2; // Radians per frame approx

        const particles = [
            scene.add.rectangle(rocket.x, rocket.y, 2, 2, 0x00ff00),
            scene.add.rectangle(rocket.x, rocket.y, 2, 2, 0x00ff00),
            scene.add.rectangle(rocket.x, rocket.y, 2, 2, 0x00ff00),
            scene.add.rectangle(rocket.x, rocket.y, 2, 2, 0x00ff00)
        ];

        let rotation = 0;

        const updateListener = () => {
            if (!rocket.active) {
                particles.forEach(p => p.destroy());
                scene.events.off('update', updateListener);
                return;
            }

            rotation += speed;

            // Update particle positions
            // Particle 1 (0 deg)
            particles[0].setPosition(
                rocket.x + Math.cos(rotation) * radius,
                rocket.y + Math.sin(rotation) * radius
            );

            // Particle 2 (90 deg)
            particles[1].setPosition(
                rocket.x + Math.cos(rotation + Math.PI * 0.5) * radius,
                rocket.y + Math.sin(rotation + Math.PI * 0.5) * radius
            );

            // Particle 3 (180 deg)
            particles[2].setPosition(
                rocket.x + Math.cos(rotation + Math.PI) * radius,
                rocket.y + Math.sin(rotation + Math.PI) * radius
            );

            // Particle 4 (270 deg)
            particles[3].setPosition(
                rocket.x + Math.cos(rotation + Math.PI * 1.5) * radius,
                rocket.y + Math.sin(rotation + Math.PI * 1.5) * radius
            );
        };

        scene.events.on('update', updateListener);

        // Ensure cleanup if scene shuts down
        rocket.once('destroy', () => {
            particles.forEach(p => p.destroy());
            scene.events.off('update', updateListener);
        });
    }
}
