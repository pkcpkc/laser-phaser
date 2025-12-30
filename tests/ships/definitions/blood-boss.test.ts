
import { describe, it, expect } from 'vitest';
import { BloodBossDefinition } from '../../../src/ships/definitions/blood-boss';

describe('Blood Boss Definition', () => {
    it('should have correct id', () => {
        expect(BloodBossDefinition.id).toBe('blood-boss');
    });

    it('should have correct gameplay config', () => {
        expect(BloodBossDefinition.gameplay.health).toBe(100);
        expect(BloodBossDefinition.gameplay.rotationSpeed).toBe(0.03);
    });

    it('should have heavy mass', () => {
        expect(BloodBossDefinition.physics.mass).toBe(23);
    });
});
