import Phaser from 'phaser';

export default class TraderScene extends Phaser.Scene {
    constructor() {
        super('TraderScene');
    }

    create() {
        const { width, height } = this.scale;

        this.add.text(width / 2, height / 2, '💰 TRADER SCENE 💰', {
            fontFamily: 'Oswald, Impact, sans-serif',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const backButton = this.add.text(width / 2, height / 2 + 50, 'Back to Map', {
            fontFamily: 'Oswald, Impact, sans-serif',
            fontSize: '24px',
            color: '#00ff00',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();

        backButton.on('pointerdown', () => {
            this.scene.start('PlanetMapScene');
        });
    }
}
