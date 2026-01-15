import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModuleType } from '../../../src/ships/modules/module-types';
import { ModuleManager } from '../../../src/ships/module-manager';

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Physics: {
                Matter: {
                    Image: class {
                        x = 100;
                        y = 100;
                        width = 64;
                        height = 64;
                        rotation = 0;
                        depth = 0;
                        active = true;
                        visible = true;
                        body = { velocity: { x: 0, y: 0 } };
                        thrustBack = vi.fn();
                    }
                }
            }
        }
    };
});

describe('ModuleManager', () => {
    let mockScene: any;
    let mockSprite: any;
    let mockLaserClass: any;
    let mockCollisionConfig: any;

    beforeEach(() => {
        // Define a class that behaves like a weapon with ammo
        mockLaserClass = class {
            type = ModuleType.LASER;
            TEXTURE_KEY = 'laser';
            visibleOnMount = false;
            currentAmmo?: number;
            maxAmmo = 10;
            reloadTime = 0;
            recoil = 5;

            constructor() {
                // Default empty
            }

            createTexture = vi.fn();

            // Use bound function or arrow function to ensure this context if needed, 
            // but for simple class usage 'this' refers to instance.
            fire = vi.fn().mockImplementation(function (this: any) {
                if (this.currentAmmo !== undefined) {
                    if (this.currentAmmo > 0) {
                        this.currentAmmo--;
                        return { isRocket: true };
                    }
                    return undefined;
                }
                return { isRocket: true };
            });
        };

        mockSprite = {
            x: 100,
            y: 100,
            width: 64,
            height: 64,
            rotation: 0,
            depth: 0,
            active: true,
            visible: true,
            body: { velocity: { x: 0, y: 0 } },
            thrustBack: vi.fn()
        };

        mockScene = {
            add: {
                image: vi.fn().mockReturnValue({
                    setRotation: vi.fn(),
                    setDepth: vi.fn(),
                    setScale: vi.fn(),
                    setVisible: vi.fn(),
                    setPosition: vi.fn(),
                    destroy: vi.fn()
                })
            },
            time: {
                now: 1000,
                delayedCall: vi.fn()
            },
            events: {
                on: vi.fn(),
                off: vi.fn()
            },
            // Mock textures.exists to always return true so createTexture doesn't run complex logic
            textures: {
                exists: vi.fn().mockReturnValue(true),
                get: vi.fn()
            },
            make: {
                graphics: vi.fn().mockReturnValue({
                    fillStyle: vi.fn(),
                    fillRect: vi.fn(),
                    generateTexture: vi.fn(),
                    destroy: vi.fn()
                })
            }
        };

        mockCollisionConfig = {
            category: 1,
            collidesWith: 2,
            laserCategory: 4,
            laserCollidesWith: 8,
            isEnemy: false,
            hasUnlimitedAmmo: false
        };
    });

    it('should initialize without modules', () => {
        const manager = new ModuleManager(
            mockScene,
            mockSprite,
            undefined,
            mockCollisionConfig
        );

        expect(manager.getActiveModules()).toHaveLength(0);
    });

    it('should initialize with modules', () => {
        const modules = [
            { marker: { x: 10, y: 0, angle: 0, type: 'laser' }, module: mockLaserClass }
        ];

        const manager = new ModuleManager(
            mockScene,
            mockSprite,
            modules,
            mockCollisionConfig
        );

        expect(manager.getActiveModules()).toHaveLength(1);
    });

    it('should fire lasers from active modules', () => {
        const modules = [
            { marker: { x: 10, y: 0, angle: 0, type: 'laser' }, module: mockLaserClass }
        ];

        const manager = new ModuleManager(
            mockScene,
            mockSprite,
            modules,
            mockCollisionConfig
        );

        manager.fireLasers();

        const weapon = manager.getActiveModules()[0].module as any;
        expect(weapon.fire).toHaveBeenCalled();
        expect(mockSprite.thrustBack).toHaveBeenCalled();
    });

    it('should not fire when sprite is inactive', () => {
        const modules = [
            { marker: { x: 10, y: 0, angle: 0, type: 'laser' }, module: mockLaserClass }
        ];

        const manager = new ModuleManager(
            mockScene,
            mockSprite,
            modules,
            mockCollisionConfig
        );

        mockSprite.active = false;
        manager.fireLasers();

        const weapon = manager.getActiveModules()[0].module as any;
        expect(weapon.fire).not.toHaveBeenCalled();
    });

    it('should cleanup on destroy', () => {
        // Define a class that has visibleOnMount TRUE by default
        class VisibleLaser extends mockLaserClass {
            visibleOnMount = true;
        }

        const manager = new ModuleManager(
            mockScene,
            mockSprite,
            [{ marker: { x: 10, y: 0, angle: 0, type: 'laser' }, module: VisibleLaser as any }],
            mockCollisionConfig
        );

        manager.destroy();

        expect(mockScene.events.off).toHaveBeenCalledWith('postupdate', expect.any(Function));
    });

    it('should respect unlimited ammo flag', () => {
        // Setup manager WITH unlimited ammo flag
        mockCollisionConfig.hasUnlimitedAmmo = true;

        const AmmoWeapon = class extends mockLaserClass {
            currentAmmo = 1;
            maxAmmo = 10;
        };

        const modules = [
            { marker: { x: 0, y: 0, angle: 0, type: 'rocket' }, module: AmmoWeapon as any }
        ];

        const manager = new ModuleManager(
            mockScene,
            mockSprite,
            modules,
            mockCollisionConfig
        );

        const weapon = manager.getActiveModules()[0].module as any;

        // 1. Initial State
        expect(weapon.currentAmmo).toBe(1);

        // 2. Fire - Should decrease ammo to 0 inside fire(), but Manager should refill it to maxAmmo
        manager.fireLasers();

        expect(weapon.fire).toHaveBeenCalledTimes(1);
        expect(weapon.currentAmmo).toBe(10);

        // 3. Fire again - Should verify it stays full or refills
        manager.fireLasers();
        expect(weapon.currentAmmo).toBe(10);
    });

    it('should depletion ammo if not unlimited', () => {
        mockCollisionConfig.hasUnlimitedAmmo = false;

        const AmmoWeapon = class extends mockLaserClass {
            currentAmmo = 1;
            maxAmmo = 10;
        };

        const manager = new ModuleManager(
            mockScene,
            mockSprite,
            [{ marker: { x: 0, y: 0, type: 'rocket', angle: 0 }, module: AmmoWeapon as any }],
            mockCollisionConfig
        );

        const weapon = manager.getActiveModules()[0].module as any;

        // Fire 1: 1 -> 0. No refill.
        manager.fireLasers();
        expect(weapon.currentAmmo).toBe(0);

        // Fire 2: 0 -> undefined (should not fire)
        manager.fireLasers();
        expect(weapon.fire).toHaveBeenCalledTimes(1); // Still 1 call because subsequent loop check skips call
        expect(weapon.currentAmmo).toBe(0);
    });

    it('should respect reloadTime in fireLasers', () => {
        const ReloadWeapon = class extends mockLaserClass {
            reloadTime = 500;
        };
        const manager = new ModuleManager(
            mockScene,
            mockSprite,
            [{ marker: { x: 0, y: 0, angle: 0, type: 'laser' }, module: ReloadWeapon as any }],
            mockCollisionConfig
        );

        const weapon = manager.getActiveModules()[0].module as any;

        // First fire: success
        manager.fireLasers();
        expect(weapon.fire).toHaveBeenCalledTimes(1);

        // Second fire immediately: should be blocked by reload
        manager.fireLasers();
        expect(weapon.fire).toHaveBeenCalledTimes(1);

        // Advance time
        mockScene.time.now += 600;
        manager.fireLasers();
        expect(weapon.fire).toHaveBeenCalledTimes(2);
    });

    it('should sync module sprite positions in update', () => {
        class VisibleWeapon extends mockLaserClass {
            visibleOnMount = true;
        }
        const manager = new ModuleManager(
            mockScene,
            mockSprite,
            [{ marker: { x: 10, y: 0, angle: 0, type: 'laser' }, module: VisibleWeapon as any }],
            mockCollisionConfig
        );

        const moduleSprite = vi.mocked(mockScene.add.image).mock.results[0].value;

        mockSprite.x = 200;
        mockSprite.y = 300;
        mockSprite.rotation = Math.PI / 2;

        manager.update();

        expect(moduleSprite.setPosition).toHaveBeenCalled();
        expect(moduleSprite.setRotation).toHaveBeenCalled();
    });

    it('should hide module sprites if ship is inactive or invisible', () => {
        class VisibleWeapon extends mockLaserClass {
            visibleOnMount = true;
        }
        const manager = new ModuleManager(
            mockScene,
            mockSprite,
            [{ marker: { x: 10, y: 0, angle: 0, type: 'laser' }, module: VisibleWeapon as any }],
            mockCollisionConfig
        );

        const moduleSprite = vi.mocked(mockScene.add.image).mock.results[0].value;

        mockSprite.active = false;
        manager.update();
        expect(moduleSprite.setVisible).toHaveBeenCalledWith(false);

        mockSprite.active = true;
        mockSprite.visible = false;
        manager.update();
        expect(moduleSprite.setVisible).toHaveBeenCalledWith(false);
    });

    it('should hide weapon sprite if out of ammo or reloading', () => {
        class AmmoWeapon extends mockLaserClass {
            visibleOnMount = true;
            currentAmmo = 0;
            reloadTime = 500;
        }
        const manager = new ModuleManager(
            mockScene,
            mockSprite,
            [{ marker: { x: 10, y: 0, angle: 0, type: 'laser' }, module: AmmoWeapon as any }],
            mockCollisionConfig
        );

        const moduleSprite = vi.mocked(mockScene.add.image).mock.results[0].value;
        const module = manager.getActiveModules()[0];

        // 1. Out of ammo
        manager.update();
        expect(moduleSprite.setVisible).toHaveBeenCalledWith(false);

        // 2. Has ammo but reloading
        (module.module as any).currentAmmo = 10;
        module.lastFired = mockScene.time.now - 100;
        manager.update();
        expect(moduleSprite.setVisible).toHaveBeenCalledWith(false);

        // 3. Ready to show
        module.lastFired = mockScene.time.now - 1000;
        manager.update();
        expect(moduleSprite.setVisible).toHaveBeenCalledWith(true);
    });

    it('should apply scale and mount effect', () => {
        const mountEffectMock = vi.fn();
        class EffectWeapon extends mockLaserClass {
            visibleOnMount = true;
            scale = 2;
            addMountEffect = mountEffectMock;
        }
        new ModuleManager(
            mockScene,
            mockSprite,
            [{ marker: { x: 0, y: 0, angle: 0, type: 'laser' }, module: EffectWeapon as any }],
            mockCollisionConfig
        );

        const moduleSprite = vi.mocked(mockScene.add.image).mock.results[0].value;
        expect(moduleSprite.setScale).toHaveBeenCalledWith(2);
        expect(mountEffectMock).toHaveBeenCalledWith(mockScene, moduleSprite);
    });

    it('should warn and skip if visible module has no texture key', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        class NoTextureWeapon extends mockLaserClass {
            visibleOnMount = true;
            TEXTURE_KEY = '';
        }
        new ModuleManager(
            mockScene,
            mockSprite,
            [{ marker: { x: 0, y: 0, angle: 0, type: 'laser' }, module: NoTextureWeapon as any }],
            mockCollisionConfig
        );

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No texture key'));
        consoleSpy.mockRestore();
    });
});
