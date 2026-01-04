import { describe, it, expect } from 'vitest';
import { TYPES } from '../../../src/di/types';

describe('DI Types', () => {
    it('should have all required types defined as symbols', () => {
        expect(typeof TYPES.Scene).toBe('symbol');
        expect(typeof TYPES.GameManager).toBe('symbol');
        expect(typeof TYPES.PlanetVisuals).toBe('symbol');
    });
});
