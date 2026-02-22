import Phaser from 'phaser';
import { GameStatus } from '../../../logic/game-status';
import { LootType } from '../../../ships/types';

export class CurrencyHeaderUI {
    private silverText!: Phaser.GameObjects.Text;
    private goldText!: Phaser.GameObjects.Text;
    private gemText!: Phaser.GameObjects.Text;

    constructor(private scene: Phaser.Scene) { }

    public create() {
        const { width } = this.scene.scale;
        const startX = width - 170;
        const fontStyle = { fontFamily: 'Oswald, sans-serif', fontSize: '18px', color: '#fff' };

        this.scene.add.text(startX, 30, LootType.SILVER, fontStyle).setOrigin(0, 0.5);
        this.silverText = this.scene.add.text(startX + 25, 30, '0', fontStyle).setOrigin(0, 0.5);

        this.scene.add.text(startX + 60, 30, LootType.GOLD, fontStyle).setOrigin(0, 0.5);
        this.goldText = this.scene.add.text(startX + 85, 30, '0', fontStyle).setOrigin(0, 0.5);

        this.scene.add.text(startX + 120, 30, LootType.GEM, fontStyle).setOrigin(0, 0.5);
        this.gemText = this.scene.add.text(startX + 145, 30, '0', fontStyle).setOrigin(0, 0.5);

        this.update();
    }

    public update() {
        const gameStatus = GameStatus.getInstance();
        const loot = gameStatus.getLoot();
        this.silverText.setText(loot[LootType.SILVER].toString());
        this.goldText.setText(loot[LootType.GOLD].toString());
        this.gemText.setText(loot[LootType.GEM].toString());
    }
}
