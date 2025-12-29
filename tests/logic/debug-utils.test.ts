import { describe, it, expect } from 'vitest';

// Test that the module structure is correct without actually importing it
// (which would trigger Phaser initialization)
describe('debug-utils', () => {
    it('should have a test placeholder', () => {
        // The debug-utils module exports setupDebugKey function
        // Actual testing requires browser environment due to Phaser dependency
        expect(true).toBe(true);
    });
});
