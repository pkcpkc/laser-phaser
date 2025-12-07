import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GreenRocketCarrier } from '../../src/ships/green-rocket-carrier';
import { GreenRocketCarrier2R } from '../../src/ships/configurations/green-rocket-carrier-2r';


// Mock Phaser to prevent Canvas initialization errors
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            Physics: {
                Matter: {
                    Image: class { }
                }
            }
        }
    };
});

// Mock Ship
const mockShipConstructor = vi.fn();
vi.mock('../../src/ships/ship', () => {
    return {
        Ship: class {
            constructor(...args: any[]) {
                mockShipConstructor(...args);
            }
        }
    };
});

describe('GreenRocketCarrier', () => {
    let mockScene: any;
    let mockCollisionConfig: any;

    beforeEach(() => {
        mockScene = {} as any;
        mockCollisionConfig = { category: 1 };
        mockShipConstructor.mockClear();
    });

    it('should extend Ship and use correct configuration', () => {
        new GreenRocketCarrier(mockScene, 100, 200, mockCollisionConfig);

        expect(mockShipConstructor).toHaveBeenCalledWith(
            mockScene,
            100,
            200,
            GreenRocketCarrier2R,
            mockCollisionConfig
        );
    });

    it('should have static properties defined', () => {
        expect(GreenRocketCarrier.assetKey).toBeDefined();
        expect(GreenRocketCarrier.assetPath).toBeDefined();
        expect(GreenRocketCarrier.gameplay).toBeDefined();
    });
});
