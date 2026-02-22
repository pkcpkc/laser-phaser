import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MerchantAnimator } from '../../../../src/scenes/shipyards/merchant-animator';

// Minimal Phaser mock
vi.mock('phaser', () => ({
    default: {
        Scene: class { },
        Math: {
            Between: vi.fn((min: number) => min),
        },
    },
}));

function makeScene(hasEyes: boolean, hasMouth: boolean) {
    const mockTween = {
        stop: vi.fn(),
    };
    const mockTimer = {
        remove: vi.fn(),
    };

    const mockImage = {
        setOrigin: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
        active: true,
    };

    const scene: any = {
        textures: {
            get: vi.fn().mockReturnValue({
                has: vi.fn((frame: string) => {
                    if (frame.endsWith('-eyes')) return hasEyes;
                    if (frame.endsWith('-mouth')) return hasMouth;
                    return true;
                }),
            }),
        },
        add: {
            image: vi.fn().mockReturnValue(mockImage),
        },
        time: {
            delayedCall: vi.fn().mockReturnValue(mockTimer),
        },
        tweens: {
            add: vi.fn().mockReturnValue(mockTween),
        },
        _mockTween: mockTween,
        _mockTimer: mockTimer,
        _mockImage: mockImage,
    };

    return scene;
}

describe('MerchantAnimator', () => {
    let container: any;

    beforeEach(() => {
        container = {
            add: vi.fn(),
        };
    });

    it('does not create overlays when overlay frames are missing', () => {
        const scene = makeScene(false, false);
        new MerchantAnimator(scene, 'green-alien', 0, 0, container);

        expect(scene.add.image).not.toHaveBeenCalled();
        expect(container.add).not.toHaveBeenCalled();
    });

    it('does not create overlays when only one overlay frame is present', () => {
        const scene = makeScene(true, false);
        new MerchantAnimator(scene, 'green-alien', 0, 0, container);

        expect(scene.add.image).not.toHaveBeenCalled();
    });

    it('creates two overlay images when both frames exist', () => {
        const scene = makeScene(true, true);
        new MerchantAnimator(scene, 'green-alien', 0, 0, container);

        expect(scene.add.image).toHaveBeenCalledTimes(2);
        expect(scene.add.image).toHaveBeenCalledWith(0, 0, 'merchants', 'green-alien-eyes');
        expect(scene.add.image).toHaveBeenCalledWith(0, 0, 'merchants', 'green-alien-mouth');
        expect(container.add).toHaveBeenCalled();
    });

    it('schedules a blink timer on construction', () => {
        const scene = makeScene(true, true);
        new MerchantAnimator(scene, 'green-alien', 0, 0, container);

        expect(scene.time.delayedCall).toHaveBeenCalledWith(
            expect.any(Number),
            expect.any(Function)
        );
    });

    it('speak() is a no-op when overlays are missing', () => {
        const scene = makeScene(false, false);
        const animator = new MerchantAnimator(scene, 'green-alien', 0, 0, container);

        // Should not throw
        expect(() => animator.speak()).not.toThrow();
        expect(scene.tweens.add).not.toHaveBeenCalled();
    });

    it('speak() starts a tween and schedules hide timer when overlays exist', () => {
        const scene = makeScene(true, true);
        const animator = new MerchantAnimator(scene, 'green-alien', 0, 0, container);

        // Reset call counts from construction
        vi.clearAllMocks();
        // Re-attach mocks after clearAllMocks
        const mockTween = { stop: vi.fn() };
        const mockTimer = { remove: vi.fn() };
        scene.tweens.add = vi.fn().mockReturnValue(mockTween);
        scene.time.delayedCall = vi.fn().mockReturnValue(mockTimer);

        animator.speak();

        expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({ repeat: -1 }));
        expect(scene.time.delayedCall).toHaveBeenCalledWith(
            expect.any(Number),
            expect.any(Function)
        );
    });

    it('destroy() is safe to call without overlays', () => {
        const scene = makeScene(false, false);
        const animator = new MerchantAnimator(scene, 'green-alien', 0, 0, container);

        expect(() => animator.destroy()).not.toThrow();
    });

    it('destroy() cleans up overlays and stops timers', () => {
        const scene = makeScene(true, true);
        const animator = new MerchantAnimator(scene, 'green-alien', 0, 0, container);

        const mockTween = { stop: vi.fn() };
        const mockTimer = { remove: vi.fn() };
        scene.tweens.add = vi.fn().mockReturnValue(mockTween);
        scene.time.delayedCall = vi.fn().mockReturnValue(mockTimer);

        animator.speak();
        animator.destroy();

        // Image destroy gets called
        expect(scene._mockImage.destroy).toHaveBeenCalled();
        // Tween and timer stops
        expect(mockTween.stop).toHaveBeenCalled();
        expect(mockTimer.remove).toHaveBeenCalled();
    });
});
