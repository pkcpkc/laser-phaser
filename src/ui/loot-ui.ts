import { inject } from 'inversify';
import { SceneScoped } from '../di/decorators';
import type { ILootUI } from '../di/interfaces/ui-effects';
import { GameStatus } from '../logic/game-status';
import { LootType } from '../ships/types';

@SceneScoped()
export class LootUI implements ILootUI {
    private silverIcon?: Phaser.GameObjects.Text;
    private goldIcon?: Phaser.GameObjects.Text;
    private gemIcon?: Phaser.GameObjects.Text;
    private mountIcon?: Phaser.GameObjects.Text;

    private silverText?: Phaser.GameObjects.Text;
    private goldText?: Phaser.GameObjects.Text;
    private gemText?: Phaser.GameObjects.Text;
    private mountText?: Phaser.GameObjects.Text;

    constructor(@inject('Scene') private readonly scene: Phaser.Scene) { }

    public create(depth: number = 0): void {
        const { width } = this.scene.scale;
        const gameStatus = GameStatus.getInstance();
        const loot = gameStatus.getLoot();

        // Styling
        const xPos = width - 35;
        const iconStyle = { fontFamily: 'Oswald, sans-serif', fontSize: '32px' };
        const countStyle = { fontFamily: 'Oswald, sans-serif', fontSize: '20px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 };

        const startY = 30;
        const spacing = 45;
        const countOffset = +2;

        // Silver
        this.silverIcon = this.scene.add.text(xPos, startY, '🪙', iconStyle).setOrigin(0.5).setDepth(depth);
        this.silverText = this.scene.add.text(xPos, startY + countOffset, loot[LootType.SILVER].toString(), countStyle).setOrigin(0.5).setDepth(depth);

        // Gold
        this.goldIcon = this.scene.add.text(xPos, startY + spacing, '🌕', iconStyle).setOrigin(0.5).setDepth(depth);
        this.goldText = this.scene.add.text(xPos, startY + spacing + countOffset, loot[LootType.GOLD].toString(), countStyle).setOrigin(0.5).setDepth(depth);

        // Gem
        this.gemIcon = this.scene.add.text(xPos, startY + spacing * 2, '💎', iconStyle).setOrigin(0.5).setDepth(depth);
        this.gemText = this.scene.add.text(xPos, startY + spacing * 2 + countOffset, loot[LootType.GEM].toString(), countStyle).setOrigin(0.5).setDepth(depth);

        // Module
        this.mountIcon = this.scene.add.text(xPos, startY + spacing * 3, '📦', iconStyle).setOrigin(0.5).setDepth(depth);
        this.mountText = this.scene.add.text(xPos, startY + spacing * 3 + countOffset, loot[LootType.MODULE].toString(), countStyle).setOrigin(0.5).setDepth(depth);
    }

    public updateCounts(type: LootType, count: number): void {
        switch (type) {
            case LootType.SILVER:
                if (this.silverText) this.silverText.setText(count.toString());
                break;
            case LootType.GOLD:
                if (this.goldText) this.goldText.setText(count.toString());
                break;
            case LootType.GEM:
                if (this.gemText) this.gemText.setText(count.toString());
                break;
            case LootType.MODULE:
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

    public setVisible(visible: boolean): void {
        this.silverIcon?.setVisible(visible);
        this.goldIcon?.setVisible(visible);
        this.gemIcon?.setVisible(visible);
        this.mountIcon?.setVisible(visible);

        this.silverText?.setVisible(visible);
        this.goldText?.setVisible(visible);
        this.gemText?.setVisible(visible);
        this.mountText?.setVisible(visible);
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
