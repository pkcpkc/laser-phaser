import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser globally
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            GameObjects: {
                Text: class { },
                Image: class { }
            }
        }
    };
});

const mockSpeak = vi.fn();
vi.mock('../../../../../src/scenes/shipyards/merchant-animator', () => {
    return {
        MerchantAnimator: vi.fn().mockImplementation(function () {
            return { speak: mockSpeak };
        })
    };
});

import { MerchantPortraitUI } from '../../../../../src/scenes/shipyards/ui/merchant-portrait-ui';
import { MerchantAnimator } from '../../../../../src/scenes/shipyards/merchant-animator';

describe('MerchantPortraitUI', () => {
    let scene: any;
    let mockGameObject: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockGameObject = {
            setOrigin: vi.fn().mockReturnThis()
        };

        scene = {
            add: {
                image: vi.fn().mockReturnValue(mockGameObject),
                text: vi.fn().mockReturnValue(mockGameObject)
            },
            textures: {
                get: vi.fn().mockReturnValue({ has: vi.fn().mockReturnValue(false) })
            }
        };
    });

    it('should create text portrait when atlas texture does not exist', () => {
        const ui = new MerchantPortraitUI(scene, 150, 150);

        ui.create();

        expect(scene.add.text).toHaveBeenCalledWith(150, 150, '👨‍💼', expect.any(Object));
        expect(scene.add.image).not.toHaveBeenCalled();
        expect(MerchantAnimator).not.toHaveBeenCalled();
    });

    it('should create image and animator when atlas texture exists', () => {
        const mockHas = vi.fn().mockReturnValue(true);
        scene.textures.get.mockReturnValue({ has: mockHas });

        const ui = new MerchantPortraitUI(scene, 150, 150, { image: '👩‍🔧', goods: {} });

        ui.create();

        expect(scene.textures.get).toHaveBeenCalledWith('merchants');
        expect(mockHas).toHaveBeenCalledWith('👩‍🔧');
        expect(scene.add.image).toHaveBeenCalledWith(150, 150, 'merchants', '👩‍🔧');
        expect(MerchantAnimator).toHaveBeenCalledWith(scene, '👩‍🔧', 150, 150);
        expect(scene.add.text).not.toHaveBeenCalled();
    });

    it('should delegate speak to animator if created', () => {
        const mockHas = vi.fn().mockReturnValue(true);
        scene.textures.get.mockReturnValue({ has: mockHas });

        const ui = new MerchantPortraitUI(scene, 150, 150, { image: '🧔', goods: {} });
        ui.create();

        const animator = ui.getAnimator();
        expect(animator).toBeDefined();

        // Spy on animator's speak
        const speakSpy = vi.spyOn(animator as any, 'speak');
        animator?.speak();

        expect(speakSpy).toHaveBeenCalled();
    });

    it('should not throw on speak if animator is not created', () => {
        const ui = new MerchantPortraitUI(scene, 150, 150, undefined);
        ui.create();

        // Since no image, animator shouldn't be created
        expect(ui.getAnimator()).toBeNull();

        // This shouldn't throw
        expect(() => {
            ui.getAnimator()?.speak();
        }).not.toThrow();
    });
});
