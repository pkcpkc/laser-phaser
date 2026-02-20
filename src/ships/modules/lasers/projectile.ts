import Phaser from 'phaser';
import { ObjectPool } from '../../../utils/object-pool';

export class Projectile extends Phaser.Physics.Matter.Image {
    private lifespan?: number;
    private spawnTime: number;

    /** Hit effect color - set from weapon's COLOR property */
    public hitColor: number = 0xffffff;

    /** Whether this is a rocket (shows explosion) or laser (shows simple hit) */
    public isRocket: boolean = false;

    private static scenePools: WeakMap<Phaser.Scene, Record<string, ObjectPool<Projectile>>> = new WeakMap();
    private poolKey: string;
    private cacheCategory?: number;
    private cacheCollidesWith?: number;

    constructor(
        scene: Phaser.Scene,
        texture: string,
        frame?: string | number,
        category?: number,
        collidesWith?: number,
        public damage: number = 0,
        lifespan?: number,
        poolKey: string = ''
    ) {
        // Spawn off-screen natively
        super(scene.matter.world, -9999, -9999, texture, frame);
        this.lifespan = lifespan;
        this.spawnTime = scene.time.now;
        this.poolKey = poolKey;

        scene.add.existing(this);

        this.setFrictionAir(0);
        this.setFixedRotation();
        this.setSleepThreshold(-1);

        this.cacheCategory = category;
        this.cacheCollidesWith = collidesWith;

        if (category) this.setCollisionCategory(category);
        if (collidesWith) this.setCollidesWith(collidesWith);
    }

    public static getFromPool(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string,
        frame?: string | number,
        category?: number,
        collidesWith?: number,
        damage: number = 0,
        lifespan?: number
    ): Projectile {
        if (!Projectile.scenePools.has(scene)) {
            Projectile.scenePools.set(scene, {});
            scene.events.once('shutdown', () => {
                Projectile.scenePools.delete(scene);
            });
        }

        const pools = Projectile.scenePools.get(scene)!;
        const key = `${texture}-${category}-${collidesWith}-${damage}`;

        if (!pools[key]) {
            pools[key] = new ObjectPool<Projectile>(() => {
                return new Projectile(scene, texture, frame, category, collidesWith, damage, lifespan, key);
            }, 50); // Pre-warm 50 projectiles for intense moments
        }

        const p = pools[key].get();
        p.fire(x, y, lifespan);
        return p;
    }

    public fire(x: number, y: number, lifespan?: number) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.lifespan = lifespan;
        this.spawnTime = this.scene.time.now;
        this.isRocket = false; // Reset state for pooled reuse

        // Restore collision properties that were cleared by ObjectPool
        if (this.cacheCategory) this.setCollisionCategory(this.cacheCategory);
        if (this.cacheCollidesWith) this.setCollidesWith(this.cacheCollidesWith);

        // Reset physics state
        this.setAwake();
    }

    public override destroy() {
        // Overridden to return to pool instead of actual destruction
        let poolForRelease: ObjectPool<Projectile> | undefined;

        if (this.poolKey && this.scene && Projectile.scenePools.has(this.scene)) {
            const pools = Projectile.scenePools.get(this.scene);
            if (pools && pools[this.poolKey]) {
                poolForRelease = pools[this.poolKey];
            }
        }

        if (poolForRelease) {
            poolForRelease.release(this);
        } else {
            super.destroy();
        }
    }

    preUpdate(time: number, _delta: number) {
        if (!this.active) return; // Pooled check

        // 1. Lifespan Check
        if (this.lifespan && (time - this.spawnTime > this.lifespan)) {
            this.destroy(); // Returns to pool
            return;
        }

        // 2. Bounds Check (Wide margin)
        const camera = this.scene.cameras.main;
        const margin = 100;

        if (this.y < camera.scrollY - margin ||
            this.y > camera.scrollY + camera.height + margin ||
            this.x < camera.scrollX - margin ||
            this.x > camera.scrollX + camera.width + margin) {
            this.destroy(); // Returns to pool
        }
    }
}
