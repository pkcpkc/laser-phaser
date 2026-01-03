import Phaser from 'phaser';

export interface Laser {
    createTexture(scene: Phaser.Scene): void;
    recoil?: number;
    scale?: number;
    visibleOnMount?: boolean;
    mountTextureKey?: string;
    reloadTime?: number;
    currentAmmo?: number;
    firingDelay?: { min: number; max: number }; // Weapon-specific firing rate
    fixedFireDirection?: boolean;
    addMountEffect?(scene: Phaser.Scene, mountSprite: Phaser.GameObjects.Image): void;
    fire(
        scene: Phaser.Scene,
        x: number,
        y: number,
        angle: number,
        category: number,
        collidesWith: number,
        shipVelocity?: { x: number; y: number }
    ): Phaser.Physics.Matter.Image | undefined;
}
