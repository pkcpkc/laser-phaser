import { BaseDrive } from './base-drive';
import { RedThrusterEffect } from '../../effects/red-thruster-effect';

export class RedThrusterDrive extends BaseDrive {
    readonly thrust = 12;
    readonly name = 'Red Thruster Drive';
    readonly description = 'A powerful thruster with a fiery red flame.';
    readonly TEXTURE_KEY = 'red-thruster-drive-v1';

    // Override defaults if necessary
    visibleOnMount = true;

    addMountEffect(scene: Phaser.Scene, sprite: Phaser.GameObjects.Image) {
        new RedThrusterEffect(scene, sprite);
    }

    createTexture(scene: Phaser.Scene) {
        if (!scene.textures.exists(this.TEXTURE_KEY)) {
            const graphics = scene.make.graphics({ x: 0, y: 0 });

            // Invisible Engine Block 8x12
            graphics.fillStyle(0x000000, 0); // Alpha 0
            graphics.fillRect(0, 0, 8, 12);

            graphics.generateTexture(this.TEXTURE_KEY, 8, 12);
            graphics.destroy();
        }
    }
}
