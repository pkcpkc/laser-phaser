import Phaser from 'phaser';
import type { Laser } from './mounts/lasers/types';
import type { ShipEffect } from './effects/types';

export * from './types';
import type { ShipConfig, ShipCollisionConfig } from './types';

export class Ship {
    readonly sprite: Phaser.Physics.Matter.Image;
    private primaryLaser?: Laser;
    private effect?: ShipEffect;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        public readonly config: ShipConfig,
        private readonly collisionConfig: ShipCollisionConfig
    ) {
        this.sprite = scene.matter.add.image(x, y, config.assetKey);

        // Apply Physics Config
        this.sprite.setAngle(config.physics.initialAngle || 0);
        if (config.physics.fixedRotation) this.sprite.setFixedRotation();
        if (config.physics.frictionAir !== undefined) this.sprite.setFrictionAir(config.physics.frictionAir);
        if (config.physics.mass) this.sprite.setMass(config.physics.mass);

        this.sprite.setSleepThreshold(-1);

        // Apply Collision Config
        this.sprite.setCollisionCategory(collisionConfig.category);
        this.sprite.setCollidesWith(collisionConfig.collidesWith);

        // Initialize Mounts
        if (config.mounts?.primary) {
            this.primaryLaser = new config.mounts.primary();
        }
    }

    setEffect(effect: ShipEffect) {
        if (this.effect) {
            this.effect.destroy();
        }
        this.effect = effect;
    }

    fireLasers() {
        if (!this.sprite.active || !this.primaryLaser) return;

        this.primaryLaser.fire(
            this.sprite.scene,
            this.sprite.x,
            this.sprite.y,
            this.collisionConfig.laserCategory,
            this.collisionConfig.laserCollidesWith
        );

        if (this.primaryLaser.recoil) {
            this.sprite.thrustBack(this.primaryLaser.recoil);
        }
    }

    explode() {
        if (!this.sprite.active) return;

        const explosionConfig = this.config.explosion;
        if (explosionConfig) {
            const emitter = this.sprite.scene.add.particles(0, 0, 'flares', {
                frame: explosionConfig.frame,
                angle: { min: 0, max: 360 },
                speed: explosionConfig.speed || { min: 50, max: 150 },
                scale: explosionConfig.scale || { start: 0.4, end: 0 },
                lifespan: explosionConfig.lifespan || 500,
                blendMode: explosionConfig.blendMode || 'ADD',
                emitting: false
            });
            emitter.setDepth(200);
            emitter.explode(16, this.sprite.x, this.sprite.y);

            // Auto destroy emitter after explosion
            this.sprite.scene.time.delayedCall(1000, () => {
                emitter.destroy();
            });
        }

        this.destroy();
    }

    destroy() {
        if (this.effect) {
            this.effect.destroy();
            this.effect = undefined;
        }
        if (this.sprite && this.sprite.active) {
            this.sprite.destroy();
        }
    }
}
