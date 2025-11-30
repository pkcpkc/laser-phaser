import Phaser from 'phaser';
import type { Laser } from './mounts/lasers/types';
import type { ShipEffect, ShipEffectConstructor } from './effects/types';

export interface ShipPhysicsConfig {
    mass?: number;
    frictionAir?: number;
    fixedRotation?: boolean;
    initialAngle?: number;
}

export interface ShipGameplayConfig {
    health: number;
    speed?: number;
    thrust?: number;
    rotationSpeed?: number;
}

export interface ShipMountConfig {
    primary: new () => Laser;
}

export interface ShipConfig {
    id: string;
    assetKey: string;
    assetPath: string;
    markerPath: string;
    physics: ShipPhysicsConfig;
    gameplay: ShipGameplayConfig;
    mounts?: ShipMountConfig;
}

export interface ShipCollisionConfig {
    category: number;
    collidesWith: number;
    laserCategory: number;
    laserCollidesWith: number;
}

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

    setEffect(EffectClass: ShipEffectConstructor) {
        if (this.effect) {
            this.effect.destroy();
        }
        this.effect = new EffectClass(this);
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
