import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load the logo for the preload scene
        this.load.image('logo', 'assets/loading/laser-phaser.png');
        this.load.image('background', 'assets/loading/background.png');
        this.load.image('android-head', 'assets/loading/android-head.png');
    }

    create() {
        console.log('BootScene: starting PreloadScene');
        this.scene.start('PreloadScene');
    }
}
