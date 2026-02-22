import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Loot } from '../../../src/ships/loot';
import { LootType } from '../../../src/ships/types';


// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Physics: {
                Matter: {
                    Image: class {
                        setFrictionAir = vi.fn();
                        setBounce = vi.fn();
                        setSensor = vi.fn();
                        setIgnoreGravity = vi.fn();
                        setActive = vi.fn();
                        setVisible = vi.fn();
                        setPosition = vi.fn();
                        setVelocity = vi.fn();
                        setAngularVelocity = vi.fn();
                        setRotation = vi.fn();
                        setCollidesWith = vi.fn();
                        setCollisionCategory = vi.fn();
                        setAlpha = vi.fn();
                        setScale = vi.fn();
                        setAwake = vi.fn();
                        destroy() { }
                        scene = {
                            tweens: {
                                killTweensOf: vi.fn(),
                                add: vi.fn(),
                                chain: vi.fn()
                            }
                        };
                        active = true;
                        on = vi.fn();
                        texture = { key: 'loot-test' };
                        lootType: any;
                    }
                }
            },
            Scene: class { },
            Math: {
                Between: vi.fn()
            }
        }
    };
});

describe('Loot', () => {
    let loot: Loot;
    let mockScene: any;

    beforeEach(() => {
        mockScene = {
            matter: {
                world: {}
            },
            add: {
                existing: vi.fn(),
                particles: vi.fn().mockReturnValue({ destroy: vi.fn(), stop: vi.fn(), start: vi.fn() })
            },
            make: {
                text: vi.fn().mockReturnValue({
                    width: 32,
                    height: 32,
                    destroy: vi.fn()
                })
            },
            textures: {
                exists: vi.fn().mockReturnValue(false),
                addCanvas: vi.fn()
            },
            tweens: {
                add: vi.fn(),
                chain: vi.fn(),
                killTweensOf: vi.fn()
            },
            events: {
                once: vi.fn()
            },
            time: {
                now: 1000
            }
        };

        // Mock canvas (JSDOM should handle this, but for explicit control)
        const mockContext = {
            font: '',
            fillStyle: '',
            textAlign: '',
            textBaseline: '',
            fillText: vi.fn()
        };
        const mockCanvas = {
            getContext: vi.fn().mockReturnValue(mockContext),
            width: 0,
            height: 0
        };
        vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

        loot = new Loot(mockScene, 'loot-test');
        // Simulate scene compatibility
        (loot as any).scene = mockScene;
    });

    it('should initialize correctly', () => {
        expect(mockScene.add.existing).toHaveBeenCalledWith(loot);
        expect(loot.setFrictionAir).toHaveBeenCalledWith(0.05);
        expect(loot.setBounce).toHaveBeenCalledWith(0.5);
        expect(loot.setSensor).toHaveBeenCalledWith(true);
    });

    it('should generate texture if not exists via getFromPool', () => {
        mockScene.textures.exists.mockReturnValue(false);
        Loot.getFromPool(mockScene, 100, 100, LootType.GEM);
        expect(mockScene.textures.exists).toHaveBeenCalled();
        expect(mockScene.make.text).toHaveBeenCalled();
        expect(mockScene.textures.addCanvas).toHaveBeenCalled();
    });

    it('should use existing texture if available via getFromPool', () => {
        mockScene.textures.exists.mockReturnValue(true);
        mockScene.textures.addCanvas.mockClear();

        Loot.getFromPool(mockScene, 100, 100, LootType.GEM);
        expect(mockScene.textures.addCanvas).not.toHaveBeenCalled();
    });

    it('should handle mount loot type specific logic via spawn', () => {
        loot.spawn(100, 100, LootType.MODULE);
        expect(mockScene.add.particles).toHaveBeenCalled();
    });

    it('should cleanup on destroy', () => {
        loot.destroy();
        expect(mockScene.tweens.killTweensOf).toHaveBeenCalledWith(loot);
    });
});
