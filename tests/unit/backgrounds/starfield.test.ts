import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Starfield } from '../../../src/backgrounds/starfield';
import Phaser from 'phaser';

vi.mock('phaser', () => ({
    default: {
        Math: {
            Between: vi.fn().mockReturnValue(10),
            FloatBetween: vi.fn().mockReturnValue(1.0),
        }
    }
}));

describe('Starfield', () => {
    let starfield: Starfield;
    let mockScene: any;
    let mockNebula: any;
    let mockGraphics: any;

    beforeEach(() => {
        mockNebula = {
            setOrigin: vi.fn(),
            setDepth: vi.fn(),
            setAlpha: vi.fn(),
            destroy: vi.fn(),
            tilePositionY: 0,
        };


        mockGraphics = {
            fillStyle: vi.fn().mockReturnThis(),
            fillRect: vi.fn().mockReturnThis(),
            generateTexture: vi.fn().mockReturnThis(),
            destroy: vi.fn(),
        };

        mockScene = {
            scale: { width: 800, height: 600 },
            textures: {
                exists: vi.fn().mockReturnValue(false),
            },
            make: {
                graphics: vi.fn().mockReturnValue(mockGraphics),
            },
            add: {
                tileSprite: vi.fn().mockReturnValue(mockNebula),
                image: vi.fn().mockImplementation(() => ({
                    setDepth: vi.fn(),
                    setScale: vi.fn(),
                    destroy: vi.fn(),
                    x: 0,
                    y: 0,
                })),
            },
        };

        starfield = new Starfield(mockScene);
    });

    it('should create texture if it does not exist', () => {
        expect(mockScene.textures.exists).toHaveBeenCalledWith('star');
        expect(mockScene.make.graphics).toHaveBeenCalled();
        expect(mockGraphics.generateTexture).toHaveBeenCalledWith('star', 2, 2);
    });

    it('should create nebula and stars when config is called', () => {
        starfield.config('nebula-test');
        expect(mockScene.add.tileSprite).toHaveBeenCalledWith(400, 300, 800, 600, 'nebula-test', undefined);
        expect(mockNebula.setDepth).toHaveBeenCalledWith(-2);
        expect(mockScene.add.image).toHaveBeenCalledTimes(100);
    });

    it('should update nebula and stars correctly', () => {
        starfield.config('nebula-test');
        // Results[0] is from config calls? No, config calls 100 times.
        // Wait, results are 0-indexed.
        // Let's just grab one from the first 100 calls.
        const star = mockScene.add.image.mock.results[0].value;
        star.y = 100;
        starfield.update();

        expect(mockNebula.tilePositionY).toBeLessThan(0);
        expect(star.y).toBeGreaterThan(100);
    });

    it('should recycle stars that go off screen', () => {
        starfield.config('nebula-test');
        const star = mockScene.add.image.mock.results[0].value;
        star.y = 700; // Off screen
        starfield.update();

        expect(star.y).toBe(0);
        expect(Phaser.Math.Between).toHaveBeenCalled();
    });

    it('should destroy resources correctly', () => {
        starfield.config('nebula-test');
        const star = mockScene.add.image.mock.results[0].value;
        starfield.destroy();

        expect(mockNebula.destroy).toHaveBeenCalled();
        expect(star.destroy).toHaveBeenCalled();
    });
});
