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

vi.mock('../../../../../src/ships/effects/ion-effect', () => ({
    IonEffect: vi.fn()
}));

import { IonDrive } from '../../../../../src/ships/modules/drives/ion-drive';
import { IonEffect } from '../../../../../src/ships/effects/ion-effect';
import { ModuleType } from '../../../../../src/ships/modules/module-types';

describe('IonDrive', () => {
    let ionDrive: IonDrive;
    let mockScene: any;
    let mockSprite: any;
    let mockGraphics: any;

    beforeEach(() => {
        vi.clearAllMocks();
        ionDrive = new IonDrive();

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
        expect(ionDrive.thrust).toBe(2);
        expect(ionDrive.name).toBe('Ion Drive');
        expect(ionDrive.description).toBe('Standard Ion Drive. Reliable and efficient.');
        expect(ionDrive.TEXTURE_KEY).toBe('ion-drive-v10');
        expect(ionDrive.type).toBe(ModuleType.DRIVE);
        expect(ionDrive.visibleOnMount).toBe(true);
    });

    it('should create texture when it does not exist', () => {
        ionDrive.createTexture(mockScene);

        expect(mockScene.textures.exists).toHaveBeenCalledWith('ion-drive-v10');
        expect(mockScene.make.graphics).toHaveBeenCalledWith({ x: 0, y: 0 });
        expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0x000000, 0);
        expect(mockGraphics.fillRect).toHaveBeenCalledWith(0, 0, 8, 12);
        expect(mockGraphics.generateTexture).toHaveBeenCalledWith('ion-drive-v10', 8, 12);
        expect(mockGraphics.destroy).toHaveBeenCalled();
    });

    it('should not create texture when it already exists', () => {
        mockScene.textures.exists.mockReturnValue(true);

        ionDrive.createTexture(mockScene);

        expect(mockScene.make.graphics).not.toHaveBeenCalled();
    });

    it('should add IonEffect on mount', () => {
        ionDrive.addMountEffect(mockScene, mockSprite);

        expect(IonEffect).toHaveBeenCalledWith(mockScene, mockSprite);
    });
});
