import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Loot } from '../../src/ships/loot';
import { LootType } from '../../src/ships/types';


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
    let mockType: LootType;

    beforeEach(() => {
        mockScene = {
            matter: {
                world: {}
            },
            add: {
                existing: vi.fn(),
                particles: vi.fn().mockReturnValue({ destroy: vi.fn() })
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
            }
        };

        mockType = LootType.GEM;

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

        loot = new Loot(mockScene, 100, 100, mockType);
        // Simulate scene compatibility
        (loot as any).scene = mockScene;
    });

    it('should initialize correctly', () => {
        expect(mockScene.add.existing).toHaveBeenCalledWith(loot);
        expect(loot.type).toBe(mockType);
        expect(loot.setFrictionAir).toHaveBeenCalledWith(0.05);
        expect(loot.setBounce).toHaveBeenCalledWith(0.5);
        expect(loot.setSensor).toHaveBeenCalledWith(true);
    });

    it('should generate texture if not exists', () => {
        expect(mockScene.textures.exists).toHaveBeenCalled();
        expect(mockScene.make.text).toHaveBeenCalled();
        expect(mockScene.textures.addCanvas).toHaveBeenCalled();
    });

    it('should use existing texture if available', () => {
        mockScene.textures.exists.mockReturnValue(true);
        // Clear previous calls
        mockScene.textures.addCanvas.mockClear();

        new Loot(mockScene, 100, 100, LootType.GEM);
        expect(mockScene.textures.addCanvas).not.toHaveBeenCalled();
    });

    it('should handle mount loot type specific logic', () => {
        const mountType = LootType.MODULE;
        loot = new Loot(mockScene, 100, 100, mountType);

        expect(mockScene.add.particles).toHaveBeenCalled();
        expect(loot.on).toHaveBeenCalledWith('destroy', expect.any(Function));
    });

    it('should cleanup on destroy', () => {
        loot.destroy();
        expect(mockScene.tweens.killTweensOf).toHaveBeenCalledWith(loot);
    });
});
