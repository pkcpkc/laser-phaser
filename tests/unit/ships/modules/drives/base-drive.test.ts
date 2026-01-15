import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => ({
    default: {
        Scene: class { },
        GameObjects: {
            Image: class { }
        }
    }
}));

import { BaseDrive } from '../../../../../src/ships/modules/drives/base-drive';
import { ModuleType } from '../../../../../src/ships/modules/module-types';

// Create a concrete implementation for testing the abstract class
class TestDrive extends BaseDrive {
    readonly thrust = 3;
    readonly name = 'Test Drive';
    readonly description = 'A test drive for testing purposes.';
    readonly TEXTURE_KEY = 'test-drive-v1';
}

describe('BaseDrive', () => {
    let drive: TestDrive;
    let mockScene: any;
    let mockSprite: any;
    let mockGraphics: any;

    beforeEach(() => {
        vi.clearAllMocks();
        drive = new TestDrive();

        mockGraphics = {
            fillStyle: vi.fn(),
            fillRect: vi.fn(),
            generateTexture: vi.fn()
        };

        mockScene = {
            textures: {
                exists: vi.fn().mockReturnValue(false)
            },
            make: {
                graphics: vi.fn().mockReturnValue(mockGraphics)
            }
        };

        mockSprite = {};
    });

    it('should have ModuleType.DRIVE as type', () => {
        expect(drive.type).toBe(ModuleType.DRIVE);
    });

    it('should have default visibleOnMount as true', () => {
        expect(drive.visibleOnMount).toBe(true);
    });

    it('should have undefined mountTextureKey and scale by default', () => {
        expect(drive.mountTextureKey).toBeUndefined();
        expect(drive.scale).toBeUndefined();
    });

    it('should create placeholder texture when texture does not exist', () => {
        drive.createTexture(mockScene);

        expect(mockScene.textures.exists).toHaveBeenCalledWith('test-drive-v1');
        expect(mockScene.make.graphics).toHaveBeenCalledWith({ x: 0, y: 0 });
        expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0x00ffff, 1);
        expect(mockGraphics.fillRect).toHaveBeenCalledWith(0, 0, 10, 20);
        expect(mockGraphics.generateTexture).toHaveBeenCalledWith('test-drive-v1', 10, 20);
    });

    it('should not create texture when it already exists', () => {
        mockScene.textures.exists.mockReturnValue(true);

        drive.createTexture(mockScene);

        expect(mockScene.make.graphics).not.toHaveBeenCalled();
    });

    it('should have empty addMountEffect implementation by default', () => {
        // Should not throw
        expect(() => drive.addMountEffect(mockScene, mockSprite)).not.toThrow();
    });
});
