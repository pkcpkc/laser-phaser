import Phaser from 'phaser';

export class GameManager {
    private scene: Phaser.Scene;
    private isGameOver: boolean = false;
    private gameOverText: Phaser.GameObjects.Text;
    private restartText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        const { width, height } = this.scene.scale;

        this.gameOverText = this.scene.add.text(width * 0.5, height * 0.4, 'GAME OVER', {
            fontSize: '64px',
            color: '#00dd00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setVisible(false).setDepth(100);

        this.restartText = this.scene.add.text(width * 0.5, height * 0.6, 'Press FIRE', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5).setVisible(false).setDepth(100);
    }

    public handleGameOver() {
        this.isGameOver = true;
        this.gameOverText.setVisible(true);
        this.restartText.setVisible(true);
    }

    public isGameActive(): boolean {
        return !this.isGameOver;
    }

    public reset() {
        this.isGameOver = false;
        this.gameOverText.setVisible(false);
        this.restartText.setVisible(false);
    }

    public handleResize(width: number, height: number) {
        this.gameOverText.setPosition(width * 0.5, height * 0.4);
        this.restartText.setPosition(width * 0.5, height * 0.6);
    }
}
