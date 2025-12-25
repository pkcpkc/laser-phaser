import Phaser from 'phaser';
import type { Laser } from './types';
import { Projectile } from './projectile';

// Trail Effect Constants
const TRAIL_CIRCLE_RADIUS = 2;
const TRAIL_SIZE = 4;
const TRAIL_LIFESPAN = 150;
const TRAIL_SCALE_START = 0.8;
const TRAIL_ALPHA_START = 0.6;
const CLEANUP_DELAY = 200;
const DEFAULT_RELOAD_TIME = 200;

export abstract class BaseLaser implements Laser {
    abstract readonly TEXTURE_KEY: string;
    abstract readonly COLOR: number;
    abstract readonly SPEED: number;

    // Optional recoil property
    readonly recoil?: number;
    // Optional scale property
    readonly scale?: number;

    readonly reloadTime: number = DEFAULT_RELOAD_TIME; // Default 200ms between shots
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

        // Add trail effect
        this.addTrailEffect(scene, laser);

        return laser;
    }

    protected addTrailEffect(scene: Phaser.Scene, laser: Phaser.Physics.Matter.Image) {
        // Create trail particle texture if needed
        const trailTextureKey = `${this.TEXTURE_KEY}-trail`;
        if (!scene.textures.exists(trailTextureKey)) {
            const g = scene.make.graphics({ x: 0, y: 0 });
            g.fillStyle(this.COLOR, 1);
            g.fillCircle(TRAIL_CIRCLE_RADIUS, TRAIL_CIRCLE_RADIUS, TRAIL_CIRCLE_RADIUS);
            g.generateTexture(trailTextureKey, TRAIL_SIZE, TRAIL_SIZE);
            g.destroy();
        }

        const particles = scene.add.particles(0, 0, trailTextureKey, {
            lifespan: TRAIL_LIFESPAN,
            scale: { start: TRAIL_SCALE_START, end: 0 },
            alpha: { start: TRAIL_ALPHA_START, end: 0 },
            tint: this.COLOR,
            speed: 0,
            blendMode: 'ADD',
            emitting: false
        });

        const updateListener = () => {
            if (laser.active) {
                particles.emitParticleAt(laser.x, laser.y);
            }
        };

        scene.events.on('update', updateListener);

        laser.once('destroy', () => {
            scene.events.off('update', updateListener);
            scene.time.delayedCall(CLEANUP_DELAY, () => {
                particles.destroy();
            });
        });
    }
}

