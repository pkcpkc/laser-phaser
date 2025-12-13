import Phaser from 'phaser';

export default class TowerDefenseScene extends Phaser.Scene {
    constructor() {
        super('TowerDefenseScene');
    }

    create() {
        const { width, height } = this.scale;

        this.add.text(width / 2, height / 2, '🛡️ TOWER DEFENSE SCENE 🛡️', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const backButton = this.add.text(width / 2, height / 2 + 50, 'Back to Map', {
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
