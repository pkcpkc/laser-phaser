import { describe, it, expect } from 'vitest';
import { BloodHunterDefinition } from '../../../../src/ships/definitions/blood-hunter';

describe('BloodHunterDefinition', () => {
    it('should have correct id and asset details', () => {
        expect(BloodHunterDefinition.id).toBe('blood-hunter');
        expect(BloodHunterDefinition.assetKey).toBe('ships');
        expect(BloodHunterDefinition.frame).toBe('blood-hunter');
    });

    it('should have valid physics configuration', () => {
        expect(BloodHunterDefinition.physics.mass).toBeGreaterThan(0);
        expect(BloodHunterDefinition.physics.frictionAir).toBeDefined();
    });

    it('should have valid gameplay stats', () => {
        expect(BloodHunterDefinition.gameplay.health).toBeGreaterThan(0);
        expect(BloodHunterDefinition.gameplay.rotationSpeed).toBeGreaterThan(0);
    });
});
