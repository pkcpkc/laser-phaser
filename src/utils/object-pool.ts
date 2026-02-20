import Phaser from 'phaser';

export class ObjectPool<T extends Phaser.Physics.Matter.Image> {
    private pool: T[] = [];
    private factory: () => T;

    constructor(factory: () => T, initialSize: number = 0) {
        this.factory = factory;
        for (let i = 0; i < initialSize; i++) {
            const item = this.factory();
            this.deactivate(item);
            this.pool.push(item);
        }
    }

    public get(): T {
        if (this.pool.length > 0) {
            return this.pool.pop()!;
        }
        return this.factory();
    }

    public release(item: T) {
        this.deactivate(item);
        this.pool.push(item);
    }

    private deactivate(item: T) {
        item.setActive(false);
        item.setVisible(false);
        // Safely move offscreen and sleep physics body
        item.setPosition(-9999, -9999);
        item.setVelocity(0, 0);
        item.setAngularVelocity(0);
        item.setRotation(0);
        item.setCollidesWith(0);
    }

    public getActiveCount(): number {
        // Only applicable if we track it; but since we hand items out, we don't naturally track active list here.
        return 0;
    }

    public getPoolSize(): number {
        return this.pool.length;
    }
}
