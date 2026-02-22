import { describe, it, expect, vi } from 'vitest';
import { ObjectPool } from '../../../src/utils/object-pool';
import Phaser from 'phaser';

vi.mock('phaser', () => ({
    default: {
        Physics: { Matter: { Image: class { } } }
    }
}));

describe('ObjectPool', () => {
    // create a fake factory
    const createMockItem = () => {
        return {
            setActive: vi.fn(),
            setVisible: vi.fn(),
            setPosition: vi.fn(),
            setVelocity: vi.fn(),
            setAngularVelocity: vi.fn(),
            setRotation: vi.fn(),
            setCollidesWith: vi.fn()
        } as unknown as Phaser.Physics.Matter.Image;
    };

    it('should initialize with given size', () => {
        const factory = vi.fn(createMockItem);
        const pool = new ObjectPool(factory, 3);
        expect(factory).toHaveBeenCalledTimes(3);
        expect(pool.getPoolSize()).toBe(3);
    });

    it('should provide a new item when empty', () => {
        const factory = vi.fn(createMockItem);
        const pool = new ObjectPool(factory, 0);
        const item = pool.get();
        expect(item).toBeDefined();
        expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should provide an item from the pool', () => {
        const pool = new ObjectPool(createMockItem, 1);
        const item1 = pool.get();
        expect(pool.getPoolSize()).toBe(0);

        pool.release(item1);
        expect(pool.getPoolSize()).toBe(1);

        const item2 = pool.get();
        expect(item2).toBe(item1);
        expect(pool.getPoolSize()).toBe(0);
    });

    it('should deactivate item on release', () => {
        const pool = new ObjectPool(createMockItem, 0);
        const item = pool.get();
        pool.release(item);

        expect(item.setActive).toHaveBeenCalledWith(false);
        expect(item.setVisible).toHaveBeenCalledWith(false);
        expect(item.setPosition).toHaveBeenCalledWith(-9999, -9999);
        expect(item.setVelocity).toHaveBeenCalledWith(0, 0);
        expect(item.setAngularVelocity).toHaveBeenCalledWith(0);
        expect(item.setRotation).toHaveBeenCalledWith(0);
        expect(item.setCollidesWith).toHaveBeenCalledWith(0);
    });

    it('getActiveCount should return 0', () => {
        const pool = new ObjectPool(createMockItem, 0);
        expect(pool.getActiveCount()).toBe(0);
    });
});
