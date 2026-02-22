import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => ({
    default: {
        Scene: class { },
        Physics: {
            Matter: {
                Image: class {
                    setFrictionAir = vi.fn();
                    setFixedRotation = vi.fn();
                    setSleepThreshold = vi.fn();
                    setRotation = vi.fn();
                    setVelocity = vi.fn();
                    setCollisionCategory = vi.fn();
                    setCollidesWith = vi.fn();
                    setOnCollide = vi.fn();
                    setScale = vi.fn();
                    setDepth = vi.fn();
                    setActive = vi.fn();
                    setVisible = vi.fn();
                    setPosition = vi.fn();
                    setAngularVelocity = vi.fn();
                    setAwake = vi.fn();
                    destroy = vi.fn();
                    active = true;
                    body = { velocity: { x: 0, y: 0 } };
                    once = vi.fn();
                    on = vi.fn();
                    off = vi.fn();
                    scene: any;
                    x = 0;
                    y = 0;
                    isRocket = false;
                    hitColor = 0;
                    constructor(world: any, _x: number, _y: number, _texture: string) {
                        if (world?.scene) this.scene = world.scene;
                    }
                }
            }
        },
        Math: {
            Between: vi.fn(),
            Vector2: class { x = 0; y = 0; }
        }
    }
}));

import { GreenRocket } from '../../../../../src/ships/modules/rockets/green-rocket';
import { ModuleType } from '../../../../../src/ships/modules/module-types';

describe('GreenRocket', () => {
    let rocket: GreenRocket;
    let mockScene: any;
    let mockGraphics: any;
    let mockParticles: any;
    let mockEvents: any;
    let mockRect: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockEvents = {
            on: vi.fn(),
            off: vi.fn(),
            once: vi.fn()
        };

        mockParticles = {
            setTexture: vi.fn(),
            emitParticleAt: vi.fn(),
            destroy: vi.fn(),
            setDepth: vi.fn()
        };

        mockGraphics = {
            fillStyle: vi.fn(),
            fillRect: vi.fn(),
            fillCircle: vi.fn(),
            generateTexture: vi.fn(),
            destroy: vi.fn()
        };

        mockRect = {
            setPosition: vi.fn(),
            destroy: vi.fn()
        };

        const mockWorld = { scene: null };

        mockScene = {
            make: {
                graphics: vi.fn().mockReturnValue(mockGraphics)
            },
            textures: {
                exists: vi.fn().mockReturnValue(false)
            },
            matter: {
                world: mockWorld
            },
            time: {
                now: 1000,
                delayedCall: vi.fn((_delay, callback) => callback())
            },
            add: {
                existing: vi.fn(),
                particles: vi.fn().mockReturnValue(mockParticles),
                rectangle: vi.fn().mockImplementation(() => mockRect)
            },
            events: mockEvents,
            cameras: {
                main: {
                    scrollX: 0,
                    scrollY: 0,
                    width: 800,
                    height: 600
                }
            }
        };
        mockWorld.scene = mockScene;

        rocket = new GreenRocket();
    });

    it('should have correct static properties', () => {
        expect(rocket.TEXTURE_KEY).toBe('green-rocket');
        expect(rocket.mountTextureKey).toBe('green-rocket-mount');
        expect(rocket.COLOR).toBe(0x00ff00);
        expect(rocket.SPEED).toBe(4);
        expect(rocket.damage).toBe(20);
        expect(rocket.maxAmmo).toBe(20);
        expect(rocket.type).toBe(ModuleType.ROCKET);
    });

    it('should create textures if they do not exist', () => {
        rocket.createTexture(mockScene);

        // Should create base texture and mount texture
        // We expect graphics calls
        expect(mockScene.make.graphics).toHaveBeenCalled();

        // Specific checks for mount texture
        expect(mockScene.textures.exists).toHaveBeenCalledWith('green-rocket-mount');
        expect(mockGraphics.generateTexture).toHaveBeenCalledWith('green-rocket-mount', 20, 20);
    });

    it('should not create textures if they exist', () => {
        mockScene.textures.exists.mockReturnValue(true);
        rocket.createTexture(mockScene);
        expect(mockScene.make.graphics).not.toHaveBeenCalled();
    });

    it('should fire and add effects', () => {
        const result: any = rocket.fire(mockScene, 100, 100, 0, 1, 2);

        expect(result).toBeDefined();
        // Check standard rocket/projectile init
        expect(mockScene.add.existing).toHaveBeenCalledWith(result);

        // Check particle effect creation
        expect(mockScene.add.particles).toHaveBeenCalledWith(0, 0, 'green-rocket', expect.any(Object));

        // Check pixel orbiters
        expect(mockScene.add.rectangle).toHaveBeenCalledTimes(4);

        // Check update listener
        // Note: Multiple listeners might be added (BaseLaser + GreenRocket), so we check if at least one is added
        expect(mockEvents.on).toHaveBeenCalledWith('update', expect.any(Function));
    });

    it('should update effects during update loop', () => {
        const result: any = rocket.fire(mockScene, 100, 100, 0, 1, 2);

        // Find the update listener that is NOT the trail listener from BaseLaser
        // BaseLaser trail listener calls emitParticleAt
        // GreenRocket update listener calls emitParticleAt AND setPosition on rects
        // We can just invoke them all or find one.
        // Or simpler: verify we find an update listener that behaves like ours.
        const updateListeners = mockEvents.on.mock.calls
            .filter((call: any[]) => call[0] === 'update')
            .map((call: any[]) => call[1]);

        // Simulate update
        result.active = true;
        result.x = 200;
        result.y = 200;

        updateListeners.forEach((listener: any) => listener());

        // Particles should be emitted
        expect(mockParticles.emitParticleAt).toHaveBeenCalled();
    });

    it('should clean up effects on destroy', () => {
        const result: any = rocket.fire(mockScene, 100, 100, 0, 1, 2);

        const destroyListeners = result.once.mock.calls
            .filter((call: any[]) => call[0] === 'destroy')
            .map((call: any[]) => call[1]);

        // Execute all destroy listeners (BaseLaser's and GreenRocket's)
        destroyListeners.forEach((listener: any) => listener());

        // Should remove listeners and destroy particles/rects
        expect(mockEvents.off).toHaveBeenCalledWith('update', expect.any(Function));

        expect(mockRect.destroy).toHaveBeenCalledTimes(4);

        // Particles destroyed (via delayedCall)
        expect(mockParticles.destroy).toHaveBeenCalled();
    });

    it('should clean up effects if rocket becomes inactive during update', () => {
        const result: any = rocket.fire(mockScene, 100, 100, 0, 1, 2);

        const updateListeners = mockEvents.on.mock.calls
            .filter((call: any[]) => call[0] === 'update')
            .map((call: any[]) => call[1]);

        // Simulate inactive rocket
        result.active = false;

        updateListeners.forEach((listener: any) => listener());

        // Should trigger cleanup
        expect(mockRect.destroy).toHaveBeenCalledTimes(4);
        expect(mockEvents.off).toHaveBeenCalledWith('update', expect.any(Function));
        expect(mockParticles.destroy).toHaveBeenCalled();
    });
});
