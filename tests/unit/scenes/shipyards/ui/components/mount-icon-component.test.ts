import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            GameObjects: {}
        }
    };
});

import { MountIconComponent } from '../../../../../../src/scenes/shipyards/ui/components/mount-icon-component';

describe('MountIconComponent', () => {
    let scene: any;
    let mockContainer: any;
    let mockGraphics: any;

    beforeEach(() => {
        mockContainer = {
            add: vi.fn(),
            setSize: vi.fn().mockReturnThis(),
            setInteractive: vi.fn().mockReturnThis(),
            on: vi.fn().mockReturnThis()
        };

        mockGraphics = {
            clear: vi.fn().mockReturnThis(),
            fillStyle: vi.fn().mockReturnThis(),
            fillCircle: vi.fn().mockReturnThis(),
            lineStyle: vi.fn().mockReturnThis(),
            strokeCircle: vi.fn().mockReturnThis(),
            lineBetween: vi.fn().mockReturnThis(),
        };

        scene = {
            add: {
                container: vi.fn().mockReturnValue(mockContainer),
                graphics: vi.fn().mockReturnValue(mockGraphics)
            },
            tweens: {
                add: vi.fn()
            }
        };
    });

    it('should create plus reticle properly', () => {
        new MountIconComponent({
            scene,
            x: 50,
            y: 50,
            type: 'plus',
            interactive: true,
            blink: true
        });

        expect(scene.add.graphics).toHaveBeenCalled();
        expect(scene.add.container).toHaveBeenCalledWith(50, 50, [mockGraphics]);
        expect(mockContainer.setSize).toHaveBeenCalledWith(30, 30);
        expect(mockContainer.setInteractive).toHaveBeenCalled();
        expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('should create minus reticle properly', () => {
        new MountIconComponent({
            scene,
            x: 100,
            y: 100,
            type: 'minus',
            interactive: false,
            blink: false
        });

        expect(scene.add.graphics).toHaveBeenCalled();
        expect(scene.add.container).toHaveBeenCalledWith(100, 100, [mockGraphics]);
        expect(mockContainer.setInteractive).not.toHaveBeenCalled();
        expect(scene.tweens.add).not.toHaveBeenCalled();
    });
});
