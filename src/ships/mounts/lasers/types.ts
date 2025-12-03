import Phaser from 'phaser';

export interface Laser {
    createTexture(scene: Phaser.Scene): void;
    recoil?: number;
    fire(
        scene: Phaser.Scene,
        x: number,
        y: number,
        angle: number,
        category: number,
        collidesWith: number
    ): Phaser.Physics.Matter.Image;
}
