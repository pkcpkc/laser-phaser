import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WarpStarfield } from '../../../src/backgrounds/warp-starfield';

vi.mock('phaser', () => ({
    default: {
        Scene: class { },
        GameObjects: {
            Particles: {
                ParticleEmitter: class { }
            }
        }
    }
}));

describe('WarpStarfield', () => {
    let mockScene: any;
    let mockEmitter: any;
    let mockGraphics: any;

    beforeEach(() => {
        mockEmitter = {
            setPosition: vi.fn(),
            destroy: vi.fn(),
            timeScale: 1,
            setDepth: vi.fn(),
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
                particles: vi.fn().mockReturnValue(mockEmitter),
            },
        };
    });

    it('should create texture if it does not exist', () => {
        new WarpStarfield(mockScene);
        expect(mockScene.textures.exists).toHaveBeenCalledWith('star');
        expect(mockScene.make.graphics).toHaveBeenCalled();
        expect(mockGraphics.generateTexture).toHaveBeenCalledWith('star', 2, 2);
        expect(mockGraphics.destroy).toHaveBeenCalled();
    });

    it('should not create texture if it already exists', () => {
        mockScene.textures.exists.mockReturnValue(true);
        new WarpStarfield(mockScene);
        expect(mockScene.make.graphics).not.toHaveBeenCalled();
    });

    it('should create particle emitter with correct properties', () => {
        new WarpStarfield(mockScene);
        expect(mockScene.add.particles).toHaveBeenCalledWith(400, 300, 'star', expect.objectContaining({
            lifespan: 3000,
            blendMode: 'ADD',
        }));
        expect(mockEmitter.setDepth).toHaveBeenCalledWith(-90);
    });

    it('should resize correctly', () => {
        const starfield = new WarpStarfield(mockScene);
        starfield.resize(1000, 800);
        expect(mockEmitter.setPosition).toHaveBeenCalledWith(500, 400);
    });

    it('should set speed correctly', () => {
        const starfield = new WarpStarfield(mockScene);
        starfield.setSpeed(2); // Factor 2
        // timeScale = 1 + (2 * 2) = 5
        expect(mockEmitter.timeScale).toBe(5);
    });

    it('should destroy emitter correctly', () => {
        const starfield = new WarpStarfield(mockScene);
        starfield.destroy();
        expect(mockEmitter.destroy).toHaveBeenCalled();
    });
});
