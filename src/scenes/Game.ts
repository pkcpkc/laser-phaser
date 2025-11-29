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

        // Add t-ship at bottom center
        const ship = this.add.image(width * 0.5, height + 50, 't-ship');
        ship.setOrigin(0.5, 0.5);

        // Create endless bottom-to-top animation
        this.tweens.add({
            targets: ship,
            y: -50, // Move to above the top of the screen
            duration: 3000, // 3 seconds to traverse the screen
            ease: 'Linear',
            repeat: -1, // Repeat infinitely
            onRepeat: () => {
                // Reset position to bottom when animation repeats
                ship.y = height + 50;
            }
        });
    }

    update() {
        // Game loop
    }
}
