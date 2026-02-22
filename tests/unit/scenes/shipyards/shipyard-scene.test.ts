import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser globally
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            GameObjects: {
                Text: class { },
                Image: class { },
                Sprite: class { },
                Particles: {
                    ParticleEmitter: class { },
                    Particle: class { }
                },
                Container: class {
                    add = vi.fn();
                    removeAll = vi.fn();
                }
            },
            Physics: {
                Matter: {
                    Image: class { },
                    Sprite: class { }
                }
            },
            Math: {
                DegToRad: vi.fn((deg: number) => deg * Math.PI / 180),
                Between: vi.fn().mockReturnValue(0)
            }
        }
    };
});

// Mock GameStatus
vi.mock('../../../../src/logic/game-status', () => ({
    GameStatus: {
        getInstance: vi.fn().mockReturnValue({
            getLoot: vi.fn().mockReturnValue({ '🌕': 100, '🪙': 50, '💎': 10, '📦': 0 }),
            updateLoot: vi.fn(),
            getModuleInventory: vi.fn().mockReturnValue({}),
            getShipLoadout: vi.fn().mockReturnValue({}),
            setShipLoadout: vi.fn(),
            getMerchantInventory: vi.fn().mockReturnValue({}),
            isMerchantInitialized: vi.fn().mockReturnValue(true),
            setMerchantStock: vi.fn(),
            addModule: vi.fn(),
            removeModule: vi.fn(),
            addMerchantStock: vi.fn(),
            removeMerchantStock: vi.fn(),
            reset: vi.fn(),
        })
    }
}));

// Mock debug utils
vi.mock('../../../../src/logic/debug-utils', () => ({
    setupDebugKey: vi.fn()
}));

// Mock module registry
vi.mock('../../../../src/ships/modules/module-registry', () => ({
    ModuleRegistry: {},
    calculateSellPrice: vi.fn()
}));

// Mock ship definition
vi.mock('../../../../src/ships/definitions/big-cruiser', () => ({
    BigCruiserDefinition: {
        markers: []
    }
}));

import ShipyardScene from '../../../../src/scenes/shipyards/shipyard-scene';

describe('ShipyardScene', () => {
    let scene: ShipyardScene;
    let mockGameObject: any;
    let mockScenePlugin: any;

    beforeEach(() => {
        scene = new ShipyardScene();

        mockGameObject = {
            setOrigin: vi.fn().mockReturnThis(),
            setInteractive: vi.fn().mockReturnThis(),
            setAngle: vi.fn().mockReturnThis(),
            setScale: vi.fn().mockReturnThis(),
            setStrokeStyle: vi.fn().mockReturnThis(),
            setFillStyle: vi.fn().mockReturnThis(),
            setTint: vi.fn().mockReturnThis(),
            on: vi.fn().mockReturnThis(),
            setText: vi.fn(),
            setPosition: vi.fn(),
            width: 100,
            height: 100,
            active: true,
        };

        const mockContainer = {
            add: vi.fn(),
            removeAll: vi.fn(),
            setVisible: vi.fn().mockReturnThis(),
        };

        scene.add = {
            text: vi.fn().mockReturnValue(mockGameObject),
            rectangle: vi.fn().mockReturnValue(mockGameObject),
            image: vi.fn().mockReturnValue(mockGameObject),
            container: vi.fn().mockReturnValue(mockContainer),
            particles: vi.fn().mockReturnValue({ emitParticle: vi.fn(), active: true }),
            tileSprite: vi.fn().mockReturnValue(mockGameObject),
            nineslice: vi.fn().mockReturnValue(mockGameObject),
        } as any;

        scene.tweens = {
            add: vi.fn().mockReturnValue({ stop: vi.fn() }),
        } as any;

        scene.scale = {
            width: 800,
            height: 600,
        } as any;

        scene.make = {
            graphics: vi.fn().mockReturnValue({
                fillStyle: vi.fn(),
                fillRect: vi.fn(),
                generateTexture: vi.fn(),
                destroy: vi.fn()
            })
        } as any;

        scene.textures = {
            exists: vi.fn().mockReturnValue(false),
            get: vi.fn().mockReturnValue({ has: vi.fn().mockReturnValue(false) })
        } as any;

        scene.time = {
            delayedCall: vi.fn()
        } as any;

        scene.input = {
            keyboard: {
                on: vi.fn()
            }
        } as any;

        mockScenePlugin = {
            start: vi.fn(),
        };
        scene.scene = mockScenePlugin;
    });

    it('should create back button', () => {
        scene.create();

        // Verify background tileSprite
        expect(scene.add.tileSprite).toHaveBeenCalledWith(0, 0, 800, 600, 'metal-bg');

        // Verify back button
        expect(scene.add.text).toHaveBeenCalledWith(10, 30, '◀ Back', expect.any(Object));

        // Verify back button interaction
        expect(mockGameObject.setInteractive).toHaveBeenCalled();
        expect(mockGameObject.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    });

    it('should navigate back to map', () => {
        scene.create();
        const pointerdownCalls = mockGameObject.on.mock.calls.filter((call: any[]) => call[0] === 'pointerdown');
        // The first pointerdown callback on the back button triggers navigation
        const callback = pointerdownCalls[0][1];
        callback();
        expect(mockScenePlugin.start).toHaveBeenCalledWith('GalaxyScene', expect.any(Object));
    });
});
