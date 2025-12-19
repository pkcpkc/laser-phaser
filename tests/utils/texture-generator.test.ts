import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Phaser globally
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { }
        }
    };
});

import { createFlareTexture } from '../../src/utils/texture-generator';

describe('TextureGenerator', () => {
    let mockScene: any;
    let mockTextures: any;
    let mockContext: any;
    let mockCanvas: any;

    beforeEach(() => {
        // Mock Scene and Texture Manager
        mockTextures = {
            exists: vi.fn(),
            addCanvas: vi.fn(),
        };
        mockScene = {
            textures: mockTextures,
        };

        // Mock Generic Canvas and Context
        mockContext = {
            createRadialGradient: vi.fn().mockReturnValue({
                addColorStop: vi.fn(),
            }),
            fillStyle: null,
            fillRect: vi.fn(),
        };

        mockCanvas = {
            width: 0,
            height: 0,
            getContext: vi.fn().mockReturnValue(mockContext),
        };

        // Spy on document.createElement
        vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should not create texture if it already exists', () => {
        mockTextures.exists.mockReturnValue(true);
        createFlareTexture(mockScene, 'existing-key', 0xffffff);
        expect(mockTextures.addCanvas).not.toHaveBeenCalled();
    });

    it('should create a new texture if it does not exist', () => {
        mockTextures.exists.mockReturnValue(false);
        createFlareTexture(mockScene, 'new-key', 0xff0000);

        expect(document.createElement).toHaveBeenCalledWith('canvas');
        expect(mockCanvas.width).toBe(128);
        expect(mockCanvas.height).toBe(128);
        expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
        expect(mockContext.createRadialGradient).toHaveBeenCalled();
        expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 128, 128);
        expect(mockTextures.addCanvas).toHaveBeenCalledWith('new-key', mockCanvas);
    });

    it('should handle context creation failure', () => {
        mockTextures.exists.mockReturnValue(false);
        mockCanvas.getContext.mockReturnValue(null);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        createFlareTexture(mockScene, 'fail-key', 0xffffff);

        expect(mockTextures.addCanvas).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Failed to create context for fail-key');
    });

    it('should handle errors during generation', () => {
        mockTextures.exists.mockReturnValue(false);
        // Force an error
        mockCanvas.getContext.mockImplementation(() => { throw new Error('Canvas error'); });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        createFlareTexture(mockScene, 'error-key', 0xffffff);

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error generating texture error-key'), expect.any(Error));
    });
});
