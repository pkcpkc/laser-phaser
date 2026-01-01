
import { describe, it, expect, vi } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            GameObjects: {
                Image: class { }
            },
            Physics: {
                Matter: {
                    Image: class { }
                }
            }
        }
    };
});
import { isWeapon, isDrive, type ShipModule, type WeaponModule } from '../../../../src/ships/modules/module-types';
import type { Drive } from '../../../../src/ships/modules/drives/types';

describe('Module Type Guards', () => {
    describe('isWeapon', () => {
        it('should return true if module has a fire method', () => {
            const mockWeapon: Abstract<WeaponModule> = {
                fire: vi.fn(),
                createTexture: vi.fn()
            };
            expect(isWeapon(mockWeapon as unknown as ShipModule)).toBe(true);
        });

        it('should return false if module does not have a fire method', () => {
            const mockModule: ShipModule = {
                createTexture: vi.fn()
            };
            expect(isWeapon(mockModule)).toBe(false);
        });
    });

    describe('isDrive', () => {
        it('should return true if module has a thrust property', () => {
            const mockDrive: Abstract<Drive> = {
                thrust: 100,
                createTexture: vi.fn()
            };
            expect(isDrive(mockDrive as unknown as ShipModule)).toBe(true);
        });

        it('should return false if module does not have a thrust property', () => {
            const mockModule: ShipModule = {
                createTexture: vi.fn()
            };
            expect(isDrive(mockModule)).toBe(false);
        });
    });
});

// Helper type for partial implementation in tests
type Abstract<T> = Partial<T>;
