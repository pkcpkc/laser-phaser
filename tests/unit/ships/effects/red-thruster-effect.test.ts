import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => ({
    default: {
        Scene: class { },
        Math: {
            RadToDeg: vi.fn(),
            DegToRad: vi.fn(),
            Between: vi.fn(() => 0),
        }
    }
}));

import { RedThrusterEffect } from '../../../../src/ships/effects/red-thruster-effect';

describe('RedThrusterEffect', () => {
    let mockScene: any;
    let mockModule: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockScene = {
            add: {
                particles: vi.fn().mockReturnValue({
                    setDepth: vi.fn(),
                    destroy: vi.fn()
                })
            },
            events: {
                on: vi.fn(),
                off: vi.fn()
            }
        };
        mockModule = {
            on: vi.fn(),
            active: true
        };
    });

    it('should create emitters with correct red config', () => {
        new RedThrusterEffect(mockScene, mockModule);

        expect(mockScene.add.particles).toHaveBeenCalledTimes(4);

        // Inspect config
        const firstCallConfig = mockScene.add.particles.mock.calls[0][3];
        // Red colors: outer: [0xff2200, 0xaa0000]
        expect(firstCallConfig.color).toEqual([0xff2200, 0xaa0000]);
        expect(firstCallConfig.lifespan.min).toBeDefined(); // lengthScale check
    });
});
