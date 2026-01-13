
import { describe, it, expect } from 'vitest';
import { markers } from '../../../../../src/generated/ships/markers/blood-boss.markers';

describe('Blood Boss Markers', () => {
    it('should export markers array', () => {
        expect(Array.isArray(markers)).toBe(true);
    });

    it('should have markers with required properties', () => {
        if (markers.length > 0) {
            const marker = markers[0];
            // console.log('DEBUG MARKER:', marker); 
            expect(marker).toHaveProperty('type');
            expect(marker).toHaveProperty('x');
            expect(marker).toHaveProperty('y');
        }
    });
});
