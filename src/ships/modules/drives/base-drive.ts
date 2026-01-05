import Phaser from 'phaser';
import type { Drive } from './types';
import { ModuleType } from '../module-types';

export abstract class BaseDrive implements Drive {
    readonly type = ModuleType.DRIVE;
    abstract readonly thrust: number;
    abstract readonly name: string;
    abstract readonly description: string;
    abstract TEXTURE_KEY: string;

    // Default implementations for Drive interface to be compatible with Module system
    visibleOnMount: boolean = true;
    mountTextureKey?: string;
    scale?: number;

    createTexture(scene: Phaser.Scene): void {
        // Default check if texture exists
        if (!scene.textures.exists(this.TEXTURE_KEY)) {
            // Placeholder texture generation if needed, or expected to be loaded assets
            const graphics = scene.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0x00ffff, 1);
            graphics.fillRect(0, 0, 10, 20); // Simple engine block
            graphics.generateTexture(this.TEXTURE_KEY, 10, 20);
        }
    }

    addMountEffect(_scene: Phaser.Scene, _sprite: Phaser.GameObjects.Image): void {
        // Optional: Add engine glow or particles to the mount point
    }
}
