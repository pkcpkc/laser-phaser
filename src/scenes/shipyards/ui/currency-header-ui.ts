import Phaser from 'phaser';
import { GameStatus } from '../../../logic/game-status';
import { LootType } from '../../../ships/types';

export class CurrencyHeaderUI {
    private container!: Phaser.GameObjects.Container;
    private bgGraphics!: Phaser.GameObjects.Graphics;
    private silverText!: Phaser.GameObjects.Text;
    private goldText!: Phaser.GameObjects.Text;
    private gemText!: Phaser.GameObjects.Text;

    constructor(private scene: Phaser.Scene) { }

    public create() {
        const { width } = this.scene.scale;
        
        // Initial container position
        this.container = this.scene.add.container(width - 270, 18);
        
        this.bgGraphics = this.scene.add.graphics();
        this.container.add(this.bgGraphics);

        const pillH = 26;
        const pillW = 75;
        const fontStyle = { 
            fontFamily: 'Oswald, sans-serif', 
            fontSize: '13px', 
            color: '#ffffff', 
            fontStyle: 'bold' 
        };

        // Silver Capsule
        this.drawCapsule(this.bgGraphics, 0, 0, pillW, pillH, 0x9e9e9e);
        const silverIcon = this.scene.add.text(6, pillH / 2, LootType.SILVER, { fontSize: '13px' }).setOrigin(0, 0.5);
        this.silverText = this.scene.add.text(26, pillH / 2, '0', fontStyle).setOrigin(0, 0.5);
        this.container.add([silverIcon, this.silverText]);

        // Gold Capsule
        this.drawCapsule(this.bgGraphics, 85, 0, pillW, pillH, 0xffd700);
        const goldIcon = this.scene.add.text(91, pillH / 2, LootType.GOLD, { fontSize: '13px' }).setOrigin(0, 0.5);
        this.goldText = this.scene.add.text(111, pillH / 2, '0', fontStyle).setOrigin(0, 0.5);
        this.container.add([goldIcon, this.goldText]);

        // Gem Capsule
        this.drawCapsule(this.bgGraphics, 170, 0, pillW, pillH, 0x00ffff);
        const gemIcon = this.scene.add.text(176, pillH / 2, LootType.GEM, { fontSize: '13px' }).setOrigin(0, 0.5);
        this.gemText = this.scene.add.text(196, pillH / 2, '0', fontStyle).setOrigin(0, 0.5);
        this.container.add([gemIcon, this.gemText]);

        this.update();
    }

    public updatePosition(x: number) {
        if (this.container) {
            this.container.setX(x);
        }
    }

    public update() {
        const gameStatus = GameStatus.getInstance();
        const loot = gameStatus.getLoot();
        if (this.silverText) this.silverText.setText(loot[LootType.SILVER].toString());
        if (this.goldText) this.goldText.setText(loot[LootType.GOLD].toString());
        if (this.gemText) this.gemText.setText(loot[LootType.GEM].toString());
    }

    private drawCapsule(graphics: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, borderColor: number) {
        // Dark metallic backing
        graphics.fillStyle(0x0c121e, 0.85);
        graphics.fillRoundedRect(x, y, w, h, h / 2);
        
        // Glowing tech border
        graphics.lineStyle(1.5, borderColor, 0.9);
        graphics.strokeRoundedRect(x, y, w, h, h / 2);
    }
}
