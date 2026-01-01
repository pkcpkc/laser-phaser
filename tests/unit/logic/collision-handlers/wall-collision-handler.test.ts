import { describe, it, expect, vi } from 'vitest';
import { WallCollisionHandler } from '../../../../src/logic/collision-handlers/wall-collision-handler';
import Phaser from 'phaser';

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Physics: {
                Matter: {
                    Events: {},
                    Image: class { }
                }
            },
            GameObjects: {
                GameObject: class { }
            }
        }
    };
});

describe('WallCollisionHandler', () => {
    // Categories
    const LASER_CATEGORY = 4;
    const ENEMY_LASER_CATEGORY = 16;
    const SHIP_CATEGORY = 2;

    const handler = new WallCollisionHandler(LASER_CATEGORY, ENEMY_LASER_CATEGORY);
    const mockScene = {} as Phaser.Scene;

    it('should destroy laser when hitting world bounds (no gameObjectB)', () => {
        const mockLaser = { destroy: vi.fn() } as unknown as Phaser.GameObjects.GameObject;
        const result = handler.handle(mockScene, LASER_CATEGORY, 0, mockLaser, null);

        expect(result).toBe(true);
        expect(mockLaser.destroy).toHaveBeenCalled();
    });

    it('should destroy enemy laser when hitting world bounds (no gameObjectB)', () => {
        const mockLaser = { destroy: vi.fn() } as unknown as Phaser.GameObjects.GameObject;
        const result = handler.handle(mockScene, ENEMY_LASER_CATEGORY, 0, mockLaser, null);

        expect(result).toBe(true);
        expect(mockLaser.destroy).toHaveBeenCalled();
    });

    it('should destroy laser when hitting world bounds (laser is objectB)', () => {
        const mockLaser = { destroy: vi.fn() } as unknown as Phaser.GameObjects.GameObject;
        // categoryA is 0 (wall), categoryB is 4 (laser)
        const result = handler.handle(mockScene, 0, LASER_CATEGORY, null, mockLaser);

        expect(result).toBe(true);
        expect(mockLaser.destroy).toHaveBeenCalled();
    });

    it('should not handle non-laser collisions', () => {
        const mockShip = { destroy: vi.fn() } as unknown as Phaser.GameObjects.GameObject;
        const result = handler.handle(mockScene, SHIP_CATEGORY, 0, mockShip, null);

        expect(result).toBe(false);
        expect(mockShip.destroy).not.toHaveBeenCalled();
    });

    it('should not handle collision if both objects exist', () => {
        // e.g. laser hitting ship, not wall
        const mockLaser = { destroy: vi.fn() } as unknown as Phaser.GameObjects.GameObject;
        const mockShip = { destroy: vi.fn() } as unknown as Phaser.GameObjects.GameObject;

        const result = handler.handle(mockScene, LASER_CATEGORY, SHIP_CATEGORY, mockLaser, mockShip);

        expect(result).toBe(false);
        expect(mockLaser.destroy).not.toHaveBeenCalled();
    });
});
