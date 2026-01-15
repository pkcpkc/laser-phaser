import { describe, it, expect } from 'vitest';
import { BloodFighterDefinition } from '../../../../src/ships/definitions/blood-fighter';

describe('BloodFighterDefinition', () => {
    it('should have correct id and asset details', () => {
        expect(BloodFighterDefinition.id).toBe('blood-fighter');
        expect(BloodFighterDefinition.assetKey).toBe('ships');
        expect(BloodFighterDefinition.frame).toBe('blood-fighter');
    });

    it('should have valid physics configuration', () => {
        expect(BloodFighterDefinition.physics.mass).toBeGreaterThan(0);
        expect(BloodFighterDefinition.physics.frictionAir).toBeDefined();
    });

    it('should have valid gameplay stats', () => {
        expect(BloodFighterDefinition.gameplay.health).toBeGreaterThan(0);
        expect(BloodFighterDefinition.gameplay.rotationSpeed).toBeGreaterThan(0);
    });
});
