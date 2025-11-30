import Phaser from 'phaser';

export interface Laser {
    createTexture(scene: Phaser.Scene): void;
    fire(
        scene: Phaser.Scene,
        x: number,
        y: number,
        category: number,
        collidesWith: number
    ): Phaser.Physics.Matter.Image;
}
