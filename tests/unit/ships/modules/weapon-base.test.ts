import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeaponBase } from '../../../../src/ships/modules/weapon-base';


// Mock Phaser
vi.mock('phaser', () => ({
    default: {
        Scene: class { },
        Physics: {
            Matter: {
                Image: class {
                    setRotation = vi.fn();
                    setVelocity = vi.fn();
                    setScale = vi.fn();
                    hitColor = 0;
                    constructor() { }
                }
            }
        },
        GameObjects: {
            Image: class { }
        }
    }
}));

// Mock Projectile
vi.mock('../../../../src/ships/modules/lasers/projectile', () => ({
    Projectile: class {
        setRotation = vi.fn();
        setVelocity = vi.fn();
        setScale = vi.fn();
        hitColor = 0;
        constructor() { }
    }
}));

// Concrete implementation directly in test file for testing abstract base
class TestWeapon extends WeaponBase {
    readonly TEXTURE_KEY = 'test-weapon';
    readonly COLOR = 0xff0000;
    readonly SPEED = 10;
    readonly damage = 5;
    readonly width = 5;
    readonly height = 5;

    // Optional overrides for testing
    constructor(overrides?: Partial<WeaponBase>) {
        super();
        if (overrides) {
            Object.assign(this, overrides);
        }
    }
}

describe('WeaponBase', () => {
    let weapon: TestWeapon;
    let mockScene: any;
    let mockGraphics: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockGraphics = {
            fillStyle: vi.fn(),
            fillRect: vi.fn(),
            generateTexture: vi.fn(),
            destroy: vi.fn()
        };

        mockScene = {
            make: {
                graphics: vi.fn().mockReturnValue(mockGraphics)
            },
            textures: {
                exists: vi.fn().mockReturnValue(false) // Default to not existing
            }
        };

        weapon = new TestWeapon();
    });

    it('should create texture if it does not exist', () => {
        weapon.createTexture(mockScene);

        expect(mockScene.textures.exists).toHaveBeenCalledWith('test-weapon');
        expect(mockScene.make.graphics).toHaveBeenCalled();
        expect(mockGraphics.generateTexture).toHaveBeenCalledWith('test-weapon', 5, 5);
        expect(mockGraphics.destroy).toHaveBeenCalled();
    });

    it('should NOT create texture if it exists', () => {
        mockScene.textures.exists.mockReturnValue(true);
        weapon.createTexture(mockScene);
        expect(mockScene.make.graphics).not.toHaveBeenCalled();
    });

    it('should fire and configure projectile correctly', () => {
        const result = weapon.fire(mockScene, 100, 100, Math.PI, 1, 2);

        expect(result).toBeDefined();
        // Check standard config
        expect(result?.setRotation).toHaveBeenCalledWith(Math.PI);
        // Velocity: cos(PI)*10 = -10, sin(PI)*10 = 0
        // Expect strict equality might be tricky with floats but here ints are fine
        expect(result?.setVelocity).toHaveBeenCalledWith(-10, expect.closeTo(0, 5));
        expect((result as any).hitColor).toBe(0xff0000);
    });

    it('should apply ship velocity to projectile', () => {
        // Weapon has SHIP_VELOCITY_FACTOR = 0.4
        // Ship moving at 100, 0
        // Projectile fired at 0 angle (speed 10)
        // Result vx = 10 + (100 * 0.4) = 50

        const shipVelocity = { x: 100, y: 50 };
        const result = weapon.fire(mockScene, 0, 0, 0, 1, 2, shipVelocity);

        expect(result?.setVelocity).toHaveBeenCalledWith(
            10 + (100 * 0.4),
            0 + (50 * 0.4)
        );
    });

    it('should apply scale if defined', () => {
        const scaledWeapon = new TestWeapon({ scale: 2.5 });
        const result = scaledWeapon.fire(mockScene, 0, 0, 0, 1, 2);

        expect(result?.setScale).toHaveBeenCalledWith(2.5);
    });
});
