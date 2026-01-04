import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    let mockLaserInstance: any;
    let mockCollisionConfig: any;

    beforeEach(() => {
        mockLaserInstance = {
            fire: vi.fn().mockReturnValue({}),
            recoil: 5,
            createTexture: vi.fn(),
            visibleOnMount: false,
            TEXTURE_KEY: 'laser'
        };
        mockLaserClass = class {
            fire = mockLaserInstance.fire;
            recoil = mockLaserInstance.recoil;
            createTexture = mockLaserInstance.createTexture;
            visibleOnMount = mockLaserInstance.visibleOnMount;
            TEXTURE_KEY = mockLaserInstance.TEXTURE_KEY;
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
            }
        };

        mockCollisionConfig = {
            category: 1,
            collidesWith: 2,
            laserCategory: 4,
            laserCollidesWith: 8
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
        expect(mockLaserInstance.createTexture).toHaveBeenCalledWith(mockScene);
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

        expect(mockLaserInstance.fire).toHaveBeenCalled();
        expect(mockSprite.thrustBack).toHaveBeenCalled(); // recoil applied
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

        expect(mockLaserInstance.fire).not.toHaveBeenCalled();
    });

    it('should cleanup on destroy', () => {
        // Make module visible for sprite creation
        mockLaserInstance.visibleOnMount = true;
        const visibleLaserClass = class {
            fire = mockLaserInstance.fire;
            recoil = mockLaserInstance.recoil;
            createTexture = mockLaserInstance.createTexture;
            visibleOnMount = true;
            TEXTURE_KEY = 'laser';
        };

        const manager = new ModuleManager(
            mockScene,
            mockSprite,
            [{ marker: { x: 10, y: 0, angle: 0, type: 'laser' }, module: visibleLaserClass }],
            mockCollisionConfig
        );

        manager.destroy();

        expect(mockScene.events.off).toHaveBeenCalledWith('postupdate', expect.any(Function));
    });
});
