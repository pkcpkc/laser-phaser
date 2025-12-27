import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseRocket } from '../../../../src/ships/modules/rockets/base-rocket';
import Phaser from 'phaser';

class TestRocket extends BaseRocket {
    readonly maxAmmo = 5;
    readonly TEXTURE_KEY = 'test-rocket';
    readonly COLOR = 0x00ff00;
    readonly SPEED = 5;
    readonly width = 10;
    readonly height = 20;

    // Helper to inspect protected state if needed, or we just rely on public behavior
    getAmmo() {
        return this.currentAmmo;
    }
}

// Mock Phaser (Reuse mock from BaseLaser or similar minimal mock)
// We rely on super.fire calling scene.matter.add.image, so we need to mock that chain
vi.mock('phaser', () => {
    return {
        default: {
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
                        destroy = vi.fn();
                        once = vi.fn();
                        active = true;
                    }
                }
            },
            Scene: class { }
        }
    };
});

describe('BaseRocket', () => {
    let rocket: TestRocket;
    let mockScene: any;

    beforeEach(() => {
        mockScene = {
            make: {
                graphics: vi.fn().mockReturnValue({
                    fillStyle: vi.fn(),
                    fillRect: vi.fn(),
                    fillCircle: vi.fn(),
                    generateTexture: vi.fn(),
                    destroy: vi.fn()
                })
            },
            textures: { exists: vi.fn().mockReturnValue(true) },
            matter: {
                add: { image: vi.fn().mockReturnValue(new Phaser.Physics.Matter.Image({} as any, 0, 0, '')) },
                world: { scene: null as any }
            },
            time: {
                addEvent: vi.fn(),
                now: 1000,
                delayedCall: vi.fn()
            },
            scale: {
                width: 800,
                height: 600
            },
            add: {
                existing: vi.fn(),
                particles: vi.fn().mockReturnValue({
                    emitParticleAt: vi.fn(),
                    destroy: vi.fn()
                })
            },
            events: {
                on: vi.fn(),
                off: vi.fn()
            },
            cameras: {
                main: {
                    scrollX: 0,
                    scrollY: 0,
                    width: 800,
                    height: 600
                }
            }
        };
        mockScene.matter.world.scene = mockScene;
        rocket = new TestRocket();
    });

    it('should initialize ammo on first fire', () => {
        // First fire should init ammo to maxAmmo (5)
        rocket.fire(mockScene, 0, 0, 0, 1, 1);
        expect(rocket.getAmmo()).toBe(4); // 5 - 1
    });

    it('should deplete ammo', () => {
        // Fire 5 times
        for (let i = 0; i < 5; i++) {
            const result = rocket.fire(mockScene, 0, 0, 0, 1, 1);
            expect(result).toBeDefined();
        }

        expect(rocket.getAmmo()).toBe(0);

        // 6th time
        const result = rocket.fire(mockScene, 0, 0, 0, 1, 1);
        expect(result).toBeUndefined();
        expect(rocket.getAmmo()).toBe(0);
    });

    it('should reload', () => {
        rocket.fire(mockScene, 0, 0, 0, 1, 1);
        expect(rocket.getAmmo()).toBe(4);

        rocket.reload();
        // Since we can't easily access currentAmmo if it was initialized unless we fired, 
        // reload sets it to maxAmmo. 
        expect(rocket.getAmmo()).toBe(5);
    });
});
