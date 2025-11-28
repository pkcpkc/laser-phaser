import Phaser from 'phaser';

export default class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    preload() {
        // Load assets here
        this.load.image('t-ship', 't-ship.png');
    }

    create() {
        const { width, height } = this.scale;

        this.add.text(width * 0.5, height * 0.5, 'Phaser + Vite + TS', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width * 0.5, height * 0.5 + 50, 'Arcade Game Setup', {
            fontSize: '24px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        // Add t-ship at bottom center
        const ship = this.add.image(width * 0.5, height - 50, 't-ship');
        ship.setOrigin(0.5, 1); // Center horizontally, bottom vertically
    }

    update() {
        // Game loop
    }
}
