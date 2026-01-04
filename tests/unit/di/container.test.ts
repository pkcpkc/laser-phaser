import { describe, it, expect, vi } from 'vitest';

vi.mock('phaser', () => ({
    default: {
        Scene: class { },
        Physics: { Matter: { Image: class { } } },
        GameObjects: { Image: class { }, Container: class { } }
    }
}));

import { container } from '../../../src/di/container';

describe('DI Container', () => {
    it('should be initialized', () => {
        expect(container).toBeDefined();
    });
});
