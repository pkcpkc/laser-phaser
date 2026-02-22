import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SingleShipFormation } from '../../../../../src/scenes/shoot-em-ups/formations/single-ship-formation';
import type { ShipConfig } from '../../../../../src/ships/types';
import type { ShipCollisionConfig } from '../../../../../src/ships/ship';

vi.mock('phaser', () => ({
    default: {
        Scene: class { },
        Physics: { Matter: { Image: class { }, Sprite: class { } } },
        GameObjects: { Image: class { }, Text: class { }, Sprite: class { } },
        Math: { Between: vi.fn(), Vector2: class { } },
        Structs: { Size: class { } }
    }
}));


describe('SingleShipFormation', () => {
    let mockScene: any;
    let mockShipClass: any;
    let mockShipInstance: any;
    let mockShipConstructor: any;

    beforeEach(() => {
        mockScene = {
            cameras: { main: { width: 800 } },
            time: { now: 1000 }
        };

        mockShipInstance = {
            sprite: { active: true },
            destroy: vi.fn()
        };

        mockShipConstructor = vi.fn().mockReturnValue(mockShipInstance);
        mockShipClass = class {
            constructor(...args: any[]) {
                return mockShipConstructor(...args);
            }
        };
    });

    it('should spawn a ship at the top center with default config', () => {
        const collisionConfig = {} as ShipCollisionConfig;
        const formation = new SingleShipFormation(mockScene, mockShipClass, collisionConfig, {});

        formation.spawn();

        expect(mockShipConstructor).toHaveBeenCalledWith(mockScene, 400, -100, {}, collisionConfig);
    });

    it('should spawn a ship with provided config', () => {
        const shipConfig = { damage: 10 } as unknown as ShipConfig;
        const formation = new SingleShipFormation(mockScene, mockShipClass, {} as ShipCollisionConfig, {}, [shipConfig]);

        formation.spawn();

        expect(mockShipConstructor).toHaveBeenCalledWith(mockScene, 400, -100, shipConfig, {});
    });

    it('should return spawned ships', () => {
        const formation = new SingleShipFormation(mockScene, mockShipClass, {} as ShipCollisionConfig, {});

        expect(formation.getShips()).toEqual([]);

        formation.spawn();

        const ships = formation.getShips();
        expect(ships.length).toBe(1);
        expect(ships[0].ship).toBe(mockShipInstance);
        expect(ships[0].spawnTime).toBe(1000);
    });

    it('isComplete should return true if no ship or ship is inactive', () => {
        const formation = new SingleShipFormation(mockScene, mockShipClass, {} as ShipCollisionConfig, {});
        expect(formation.isComplete()).toBe(true);

        formation.spawn();
        expect(formation.isComplete()).toBe(false);

        mockShipInstance.sprite.active = false;
        expect(formation.isComplete()).toBe(true);
    });

    it('should destroy the ship', () => {
        const formation = new SingleShipFormation(mockScene, mockShipClass, {} as ShipCollisionConfig, {});
        formation.spawn();
        formation.destroy();

        expect(mockShipInstance.destroy).toHaveBeenCalled();
        expect(formation.getShips()).toEqual([]);
    });

    it('update should not throw', () => {
        const formation = new SingleShipFormation(mockScene, mockShipClass, {} as ShipCollisionConfig, {});
        expect(() => formation.update(0, 0)).not.toThrow();
    });
});
