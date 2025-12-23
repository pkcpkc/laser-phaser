import Phaser from 'phaser';

export class Projectile extends Phaser.Physics.Matter.Image {
    private readonly lifespan?: number;
    private spawnTime: number;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string,
        frame?: string | number,
        category?: number,
        collidesWith?: number,
        lifespan?: number
    ) {
        super(scene.matter.world, x, y, texture, frame);
        this.lifespan = lifespan;
        this.spawnTime = scene.time.now;

        scene.add.existing(this);

        this.setFrictionAir(0);
        this.setFixedRotation();
        this.setSleepThreshold(-1);

        if (category) this.setCollisionCategory(category);
        if (collidesWith) this.setCollidesWith(collidesWith);


    }

    preUpdate(time: number, _delta: number) {
        // Phaser.Physics.Matter.Image does not have a preUpdate method by default
        // But if we add it to the update list, this method will be called.
        // We do NOT call super.preUpdate() because it doesn't exist on the base class type definition.

        // 1. Lifespan Check
        if (this.lifespan && (time - this.spawnTime > this.lifespan)) {
            this.destroy();
            return;
        }

        // 2. Bounds Check (Wide margin)
        // using camera bounds + margin
        const camera = this.scene.cameras.main;
        const margin = 100;

        if (this.y < camera.scrollY - margin ||
            this.y > camera.scrollY + camera.height + margin ||
            this.x < camera.scrollX - margin ||
            this.x > camera.scrollX + camera.width + margin) {
            this.destroy();
        }
    }
}
