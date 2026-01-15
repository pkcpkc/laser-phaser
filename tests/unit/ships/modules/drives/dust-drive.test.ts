import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser and dependencies
vi.mock('phaser', () => ({
    default: {
        Scene: class { },
        GameObjects: {
            Image: class { }
        }
    }
}));

vi.mock('../../../../../src/ships/effects/dust-trail-effect', () => ({
    DustTrailEffect: vi.fn()
}));

import { DustDrive } from '../../../../../src/ships/modules/drives/dust-drive';
import { DustTrailEffect } from '../../../../../src/ships/effects/dust-trail-effect';
import { ModuleType } from '../../../../../src/ships/modules/module-types';

describe('DustDrive', () => {
    let mockScene: any;
    let mockSprite: any;
    let mockGraphics: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockGraphics = {
            fillStyle: vi.fn(),
            fillRect: vi.fn(),
            generateTexture: vi.fn(),
            destroy: vi.fn()
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

    it('should have correct default properties', () => {
        const drive = new DustDrive();

        expect(drive.thrust).toBe(1);
        expect(drive.name).toBe('Dust Trail');
        expect(drive.description).toBe('Produces a trail of dust particles.');
        expect(drive.TEXTURE_KEY).toBe('dust-drive-v1');
        expect(drive.type).toBe(ModuleType.DRIVE);
        expect(drive.visibleOnMount).toBe(true);
    });

    it('should accept custom color and scale parameters', () => {
        const customColor = 0xff0000;
        const customScale = 2.5;
        const drive = new DustDrive(customColor, customScale);

        expect(drive.thrust).toBe(1);
        expect(drive.visibleOnMount).toBe(true);
    });

    it('should create fully transparent texture when texture does not exist', () => {
        const drive = new DustDrive();
        drive.createTexture(mockScene);

        expect(mockScene.textures.exists).toHaveBeenCalledWith('dust-drive-v1');
        expect(mockScene.make.graphics).toHaveBeenCalledWith({ x: 0, y: 0 });
        expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0x000000, 0);
        expect(mockGraphics.fillRect).toHaveBeenCalledWith(0, 0, 1, 1);
        expect(mockGraphics.generateTexture).toHaveBeenCalledWith('dust-drive-v1', 1, 1);
        expect(mockGraphics.destroy).toHaveBeenCalled();
    });

    it('should not create texture when it already exists', () => {
        mockScene.textures.exists.mockReturnValue(true);
        const drive = new DustDrive();
        drive.createTexture(mockScene);

        expect(mockScene.make.graphics).not.toHaveBeenCalled();
    });

    it('should add DustTrailEffect with default options on mount', () => {
        const drive = new DustDrive();
        drive.addMountEffect(mockScene, mockSprite);

        expect(DustTrailEffect).toHaveBeenCalledWith(mockScene, mockSprite, {
            color: 0x8B7355,
            scale: 1,
            frequency: 50
        });
    });

    it('should add DustTrailEffect with custom options on mount', () => {
        const customColor = 0xaabbcc;
        const customScale = 1.5;
        const drive = new DustDrive(customColor, customScale);
        drive.addMountEffect(mockScene, mockSprite);

        expect(DustTrailEffect).toHaveBeenCalledWith(mockScene, mockSprite, {
            color: customColor,
            scale: customScale,
            frequency: 50
        });
    });
});
