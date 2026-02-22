import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => ({
    default: {
        Physics: {
            Matter: {
                Image: class { }
            }
        }
    }
}));

import { ShipCombat } from '../../../src/ships/ship-combat';
import { LootType } from '../../../src/ships/types';

// Mock dependencies
vi.mock('../../../src/ships/effects/explosion', () => ({
    Explosion: vi.fn()
}));

vi.mock('../../../src/ships/effects/dust-explosion', () => ({
    DustExplosion: vi.fn()
}));

vi.mock('../../../src/ships/loot', () => ({
    Loot: {
        getFromPool: vi.fn().mockReturnValue({
            setCollisionCategory: vi.fn(),
            setCollidesWith: vi.fn()
        })
    }
}));

import { Explosion } from '../../../src/ships/effects/explosion';
import { DustExplosion } from '../../../src/ships/effects/dust-explosion';
import { Loot } from '../../../src/ships/loot';

describe('ShipCombat', () => {
    let mockSprite: any;
    let mockDefinition: any;
    let mockCollisionConfig: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockSprite = {
            x: 100,
            y: 100,
            displayWidth: 64,
            active: true,
            setTint: vi.fn(),
            clearTint: vi.fn(),
            scene: {
                time: {
                    delayedCall: vi.fn((_delay, callback) => callback())
                }
            }
        };

        mockDefinition = {
            id: 'test-ship',
            gameplay: { health: 100 },
            explosion: { type: 'normal', lifespan: 500 }
        };

        mockCollisionConfig = {
            category: 1,
            collidesWith: 2,
            laserCategory: 4,
            laserCollidesWith: 8,
            lootCategory: 16,
            lootCollidesWith: 32
        };
    });

    it('should initialize with correct health', () => {
        const combat = new ShipCombat(mockSprite, mockDefinition, mockCollisionConfig);

        expect(combat.currentHealth).toBe(100);
        expect(combat.isAlive).toBe(true);
    });

    it('should reduce health on damage', () => {
        const combat = new ShipCombat(mockSprite, mockDefinition, mockCollisionConfig);

        combat.takeDamage(30);

        expect(combat.currentHealth).toBe(70);
        expect(combat.isAlive).toBe(true);
        expect(mockSprite.setTint).toHaveBeenCalledWith(0xff0000);
    });

    it('should trigger explosion when health reaches zero', () => {
        const onDeath = vi.fn();
        const combat = new ShipCombat(mockSprite, mockDefinition, mockCollisionConfig, undefined, onDeath);

        combat.takeDamage(100);

        expect(combat.isAlive).toBe(false);
        expect(Explosion).toHaveBeenCalled();
        expect(onDeath).toHaveBeenCalled();
    });

    it('should use DustExplosion for dust type', () => {
        const dustDefinition = {
            ...mockDefinition,
            explosion: { type: 'dust', lifespan: 500, speed: 100, scale: 1, color: 0xffffff, particleCount: 10 }
        };

        const combat = new ShipCombat(mockSprite, dustDefinition, mockCollisionConfig);
        combat.takeDamage(100);

        expect(DustExplosion).toHaveBeenCalled();
        expect(Explosion).not.toHaveBeenCalled();
    });

    it('should spawn loot when configured', () => {
        // Mock random to ensure loot drops
        vi.spyOn(Math, 'random').mockReturnValue(0.5);

        const lootConfig = [
            { type: LootType.SILVER, dropChance: 1 }
        ];

        const combat = new ShipCombat(mockSprite, mockDefinition, mockCollisionConfig, lootConfig);
        combat.takeDamage(100);

        expect(Loot.getFromPool).toHaveBeenCalled();

        vi.restoreAllMocks();
    });

    it('should not spawn loot when chance fails', () => {
        // Mock random to fail drop chance
        vi.spyOn(Math, 'random').mockReturnValue(0.9);

        const lootConfig = [
            { type: LootType.SILVER, dropChance: 0.5 }
        ];

        const combat = new ShipCombat(mockSprite, mockDefinition, mockCollisionConfig, lootConfig);
        combat.takeDamage(100);

        expect(Loot.getFromPool).not.toHaveBeenCalled();

        vi.restoreAllMocks();
    });

    it('should not take damage when already destroyed', () => {
        const combat = new ShipCombat(mockSprite, mockDefinition, mockCollisionConfig);

        combat.takeDamage(100); // First hit kills
        combat.takeDamage(50);  // Second hit should be ignored

        // Explosion should only be called once
        expect(Explosion).toHaveBeenCalledTimes(1);
    });

    it('should not take damage when sprite is inactive', () => {
        const combat = new ShipCombat(mockSprite, mockDefinition, mockCollisionConfig);
        mockSprite.active = false;

        combat.takeDamage(30);

        expect(combat.currentHealth).toBe(100);
    });
});
