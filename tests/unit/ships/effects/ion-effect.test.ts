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

import { IonEffect } from '../../../../src/ships/effects/ion-effect';

describe('IonEffect', () => {
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

    it('should create emitters with correct config', () => {
        new IonEffect(mockScene, mockModule);

        expect(mockScene.add.particles).toHaveBeenCalledTimes(4);

        // Optionally inspect config
        const firstCallConfig = mockScene.add.particles.mock.calls[0][3];
        // Ion colors: outer: [0x0044aa, 0x002255]
        expect(firstCallConfig.color).toEqual([0x0044aa, 0x002255]);
    });
});
