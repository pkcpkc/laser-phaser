import Phaser from 'phaser';

export class GameManager {
    private scene: Phaser.Scene;
    private isGameOver: boolean = false;
    private isVictory: boolean = false;
    private statusText: Phaser.GameObjects.Text;
    private restartText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        const { width, height } = this.scene.scale;

        this.statusText = this.scene.add.text(width * 0.5, height * 0.4, '', {
            fontFamily: 'Oswald, sans-serif',
            fontSize: '64px',
            color: '#00dd00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setVisible(false).setDepth(100);

        this.restartText = this.scene.add.text(width * 0.5, height * 0.4 + 60, 'Press FIRE', {
            fontFamily: 'Oswald, sans-serif',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5).setVisible(false).setDepth(100);
    }

    public handleGameOver() {
        this.isGameOver = true;
        this.showStatus('GAME OVER', '#00dd00');
    }

    public handleVictory(color: string) {
        this.isVictory = true;
        this.showStatus('VICTORY', color, true);
    }

    private showStatus(text: string, color: string, pulsate: boolean = false) {
        this.statusText.setText(text);
        this.statusText.setColor(color);
        this.statusText.setVisible(true);
        this.restartText.setVisible(true);

        if (pulsate) {
            this.scene.tweens.add({
                targets: this.statusText,
                scale: 1.2,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
    }

    public isGameActive(): boolean {
        // Game allows movement/updates during victory until user input
        return !this.isGameOver;
    }

    public reset() {
        this.isGameOver = false;
        this.isVictory = false;
        this.statusText.setVisible(false);
        this.restartText.setVisible(false);
        this.scene.tweens.killTweensOf(this.statusText);
        this.statusText.setScale(1);
    }

    public isVictoryState(): boolean {
        return this.isVictory;
    }

    public handleResize(width: number, height: number) {
        this.statusText.setPosition(width * 0.5, height * 0.4);
        this.restartText.setPosition(width * 0.5, height * 0.4 + 60);
    }
}
