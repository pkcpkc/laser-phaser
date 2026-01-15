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

vi.mock('../../../../../src/ships/effects/red-thruster-effect', () => ({
    RedThrusterEffect: vi.fn()
}));

import { RedThrusterDrive } from '../../../../../src/ships/modules/drives/red-thruster-drive';
import { RedThrusterEffect } from '../../../../../src/ships/effects/red-thruster-effect';
import { ModuleType } from '../../../../../src/ships/modules/module-types';

describe('RedThrusterDrive', () => {
    let drive: RedThrusterDrive;
    let mockScene: any;
    let mockSprite: any;
    let mockGraphics: any;

    beforeEach(() => {
        vi.clearAllMocks();
        drive = new RedThrusterDrive();

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

    it('should have correct static properties', () => {
        expect(drive.thrust).toBe(1.5);
        expect(drive.name).toBe('Red Thruster Drive');
        expect(drive.description).toBe('A powerful thruster with a fiery red flame.');
        expect(drive.TEXTURE_KEY).toBe('red-thruster-drive-v1');
        expect(drive.type).toBe(ModuleType.DRIVE);
        expect(drive.visibleOnMount).toBe(true);
    });

    it('should create texture when it does not exist', () => {
        drive.createTexture(mockScene);

        expect(mockScene.textures.exists).toHaveBeenCalledWith('red-thruster-drive-v1');
        expect(mockScene.make.graphics).toHaveBeenCalledWith({ x: 0, y: 0 });
        expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0x000000, 0);
        expect(mockGraphics.fillRect).toHaveBeenCalledWith(0, 0, 8, 12);
        expect(mockGraphics.generateTexture).toHaveBeenCalledWith('red-thruster-drive-v1', 8, 12);
        expect(mockGraphics.destroy).toHaveBeenCalled();
    });

    it('should not create texture when it already exists', () => {
        mockScene.textures.exists.mockReturnValue(true);

        drive.createTexture(mockScene);

        expect(mockScene.make.graphics).not.toHaveBeenCalled();
    });

    it('should add RedThrusterEffect on mount', () => {
        drive.addMountEffect(mockScene, mockSprite);

        expect(RedThrusterEffect).toHaveBeenCalledWith(mockScene, mockSprite);
    });
});
