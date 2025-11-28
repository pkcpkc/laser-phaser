import { describe, it, expect } from 'vitest';

describe('Game Setup', () => {
    it('should pass a basic truthy test', () => {
        expect(true).toBe(true);
    });

    it('should have a window object in jsdom', () => {
        expect(typeof window).toBe('object');
    });
});
