import Phaser from 'phaser';

export interface CollisionHandler {
    handle(
        scene: Phaser.Scene,
        categoryA: number,
        categoryB: number,
        gameObjectA: Phaser.GameObjects.GameObject | null,
        gameObjectB: Phaser.GameObjects.GameObject | null
    ): boolean; // Returns true if handled
}
