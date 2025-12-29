import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load the logo for the preload scene
        this.load.image('logo', 'assets/images/laser-phaser-logo.png');
    }

    create() {
        console.log('BootScene: starting PreloadScene');
        this.scene.start('PreloadScene');
    }
}
