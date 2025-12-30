import Phaser from 'phaser';
import { setupDebugKey } from '../../logic/debug-utils';

export default class ShipyardScene extends Phaser.Scene {
    constructor() {
        super('ShipyardScene');
    }

    create() {
        const { width, height } = this.scale;

        this.add.text(width / 2, height / 2, '🛠️ SHIPYARD SCENE 🛠️', {
            fontFamily: 'Oswald, sans-serif',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const backButton = this.add.text(width / 2, height / 2 + 50, 'Back to Map', {
            fontFamily: 'Oswald, sans-serif',
            fontSize: '24px',
            color: '#00ff00',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();

        backButton.on('pointerdown', () => {
            this.scene.start('PlanetMapScene');
        });

        // Debug Mode
        setupDebugKey(this);
    }
}
