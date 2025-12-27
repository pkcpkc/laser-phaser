import { BaseDrive } from './base-drive';
import { BunsenBurnerEffect } from '../../effects/bunsen-burner-effect';

export class IonDrive extends BaseDrive {
    readonly thrust = 10;
    readonly name = 'Ion Drive';
    readonly description = 'Standard Ion Drive. Reliable and efficient.';
    readonly TEXTURE_KEY = 'ion-drive-v10'; // Bump version

    // Override defaults if necessary
    visibleOnMount = true;

    addMountEffect(scene: Phaser.Scene, sprite: Phaser.GameObjects.Image) {
        new BunsenBurnerEffect(scene, sprite);
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
