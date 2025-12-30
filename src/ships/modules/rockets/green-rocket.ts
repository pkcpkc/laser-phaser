import Phaser from 'phaser';
import { BaseRocket } from './base-rocket';

export class GreenRocket extends BaseRocket {
    readonly TEXTURE_KEY = 'green-rocket';
    readonly mountTextureKey = 'green-rocket-mount';
    readonly COLOR = 0x00ff00;
    readonly SPEED = 4; // Slower than laser (8)
    readonly recoil = 0.1;
    readonly width = 2;
    readonly height = 2;

    readonly reloadTime = 2000;
    readonly firingDelay = { min: 200, max: 200 };

    readonly damage = 10;

    readonly maxAmmo = 20;

    constructor() {
        super();
        this.currentAmmo = this.maxAmmo;
    }

    override createTexture(scene: Phaser.Scene) {
        // Create standard projectile texture
        super.createTexture(scene);

        // Create specific mount texture (cluster of dots to mimic the effect)
        if (!scene.textures.exists(this.mountTextureKey)) {
            const size = 20; // Enough space for radius 8
            const graphics = scene.make.graphics({ x: 0, y: 0 });

            // Center is at size/2, size/2
            const cx = size / 2;
            const cy = size / 2;
            const radius = 8;

            graphics.fillStyle(this.COLOR, 1);

            // Central dot
            graphics.fillRect(cx - 1, cy - 1, 2, 2);

            // Orbiting dots (static)
            graphics.fillRect(cx + radius - 1, cy - 1, 2, 2); // Right
            graphics.fillRect(cx - radius - 1, cy - 1, 2, 2); // Left
            graphics.fillRect(cx - 1, cy + radius - 1, 2, 2); // Down
            graphics.fillRect(cx - 1, cy - radius - 1, 2, 2); // Up

            graphics.generateTexture(this.mountTextureKey, size, size);
            graphics.destroy();
        }
    }

    override fire(
        scene: Phaser.Scene,
        x: number,
        y: number,
        angle: number,
        category: number,
        collidesWith: number,
        shipVelocity?: { x: number; y: number }
    ) {
        // Create the base projectile
        const rocket = super.fire(scene, x, y, angle, category, collidesWith, shipVelocity);

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

        // Create particles for trail
        const particles = scene.add.particles(0, 0, this.TEXTURE_KEY, {
            lifespan: 500,
            scale: { start: 1.0, end: 0 },
            alpha: { start: 1.0, end: 0 },
            tint: [0x00ff00, 0x00aa00],
            speed: 0,
            blendMode: 'ADD',
            emitting: false
        });

        if (!scene.textures.exists('green-dot')) {
            const g = scene.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0x00ff00);
            g.fillRect(0, 0, 4, 4);
            g.generateTexture('green-dot', 4, 4);
            g.destroy();
        }

        particles.setTexture('green-dot');

        const orbitingPixels = [
            scene.add.rectangle(rocket.x, rocket.y, 2, 2, 0x00ff00),
            scene.add.rectangle(rocket.x, rocket.y, 2, 2, 0x00ff00),
            scene.add.rectangle(rocket.x, rocket.y, 2, 2, 0x00ff00),
            scene.add.rectangle(rocket.x, rocket.y, 2, 2, 0x00ff00)
        ];

        let rotation = 0;

        const updateListener = () => {
            if (!rocket.active) {
                orbitingPixels.forEach(p => p.destroy());
                scene.events.off('update', updateListener);
                // Delay particle destruction to let trails fade out
                scene.time.delayedCall(500, () => {
                    particles.destroy();
                });
                return;
            }

            rotation += speed;

            // Update particle positions
            for (let i = 0; i < 4; i++) {
                const angle = rotation + (Math.PI / 2) * i;
                const px = rocket.x + Math.cos(angle) * radius;
                const py = rocket.y + Math.sin(angle) * radius;

                orbitingPixels[i].setPosition(px, py);
                particles.emitParticleAt(px, py);
            }
        };

        scene.events.on('update', updateListener);

        // Ensure cleanup if scene shuts down
        rocket.once('destroy', () => {
            orbitingPixels.forEach(p => p.destroy());
            scene.events.off('update', updateListener);
            scene.time.delayedCall(500, () => {
                particles.destroy();
            });
        });
    }
}
