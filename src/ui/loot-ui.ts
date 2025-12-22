import Phaser from 'phaser';
import { GameStatus } from '../logic/game-status';

export class LootUI {
    private scene: Phaser.Scene;

    private silverIcon?: Phaser.GameObjects.Text;
    private goldIcon?: Phaser.GameObjects.Text;
    private gemIcon?: Phaser.GameObjects.Text;
    private mountIcon?: Phaser.GameObjects.Text;

    private silverText?: Phaser.GameObjects.Text;
    private goldText?: Phaser.GameObjects.Text;
    private gemText?: Phaser.GameObjects.Text;
    private mountText?: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public create(depth: number = 0): void {
        const { width } = this.scene.scale;
        const gameStatus = GameStatus.getInstance();
        const loot = gameStatus.getLoot();

        // Styling
        const xPos = width - 35;
        const iconStyle = { fontFamily: 'Oswald, Impact, sans-serif', fontSize: '32px' };
        const countStyle = { fontFamily: 'Oswald, Impact, sans-serif', fontSize: '20px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 };

        const startY = 30;
        const spacing = 45;
        const countOffset = +2;

        // Silver
        this.silverIcon = this.scene.add.text(xPos, startY, '🪙', iconStyle).setOrigin(0.5).setDepth(depth);
        this.silverText = this.scene.add.text(xPos, startY + countOffset, loot.silver.toString(), countStyle).setOrigin(0.5).setDepth(depth);

        // Gold
        this.goldIcon = this.scene.add.text(xPos, startY + spacing, '🌕', iconStyle).setOrigin(0.5).setDepth(depth);
        this.goldText = this.scene.add.text(xPos, startY + spacing + countOffset, loot.gold.toString(), countStyle).setOrigin(0.5).setDepth(depth);

        // Gem
        this.gemIcon = this.scene.add.text(xPos, startY + spacing * 2, '💎', iconStyle).setOrigin(0.5).setDepth(depth);
        this.gemText = this.scene.add.text(xPos, startY + spacing * 2 + countOffset, loot.gems.toString(), countStyle).setOrigin(0.5).setDepth(depth);

        // Mount
        this.mountIcon = this.scene.add.text(xPos, startY + spacing * 3, '📦', iconStyle).setOrigin(0.5).setDepth(depth);
        this.mountText = this.scene.add.text(xPos, startY + spacing * 3 + countOffset, loot.mounts.toString(), countStyle).setOrigin(0.5).setDepth(depth);
    }

    public updateCounts(type: 'silver' | 'gold' | 'gem' | 'mount', count: number): void {
        switch (type) {
            case 'silver':
                if (this.silverText) this.silverText.setText(count.toString());
                break;
            case 'gold':
                if (this.goldText) this.goldText.setText(count.toString());
                break;
            case 'gem':
                if (this.gemText) this.gemText.setText(count.toString());
                break;
            case 'mount':
                if (this.mountText) this.mountText.setText(count.toString());
                break;
        }
    }

    public updatePositions(): void {
        const { width } = this.scene.scale;
        const xPos = width - 35;
        const startY = 30;
        const spacing = 45;
        const countOffset = +2;

        if (this.silverIcon) this.silverIcon.setPosition(xPos, startY);
        if (this.silverText) this.silverText.setPosition(xPos, startY + countOffset);

        if (this.goldIcon) this.goldIcon.setPosition(xPos, startY + spacing);
        if (this.goldText) this.goldText.setPosition(xPos, startY + spacing + countOffset);

        if (this.gemIcon) this.gemIcon.setPosition(xPos, startY + spacing * 2);
        if (this.gemText) this.gemText.setPosition(xPos, startY + spacing * 2 + countOffset);

        if (this.mountIcon) this.mountIcon.setPosition(xPos, startY + spacing * 3);
        if (this.mountText) this.mountText.setPosition(xPos, startY + spacing * 3 + countOffset);
    }

    public destroy(): void {
        this.silverIcon?.destroy();
        this.goldIcon?.destroy();
        this.gemIcon?.destroy();
        this.mountIcon?.destroy();

        this.silverText?.destroy();
        this.goldText?.destroy();
        this.gemText?.destroy();
        this.mountText?.destroy();
    }
}
