import Phaser from 'phaser';
import type { PlanetData } from './planet-registry';

export class MapInteractionManager {
    private scene: Phaser.Scene;
    private interactionContainer!: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createInteractionUI();
    }

    private createInteractionUI() {
        this.interactionContainer = this.scene.add.container(0, 0);
        this.interactionContainer.setVisible(false);
        this.interactionContainer.setDepth(100);
    }

    public showInteractionUI(planet: PlanetData) {
        this.interactionContainer.removeAll(true);

        // No icons for main planet (Earth)
        if (planet.type === 'main') {
            this.interactionContainer.setVisible(false);
            return;
        }

        // Position - to the right of the planet
        this.interactionContainer.setPosition(planet.x + 60, planet.y);
        this.interactionContainer.setVisible(true);

        const icons: Phaser.GameObjects.Text[] = [];

        if (planet.levelId) {
            const playBtn = this.scene.add.text(0, 0, '🔫', { fontSize: '24px', padding: { x: 5, y: 5 } })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.launchLevel(planet.levelId!));
            icons.push(playBtn);
        }

        if (planet.hasTrader) {
            const traderBtn = this.scene.add.text(0, 0, '💰', { fontSize: '24px', padding: { x: 5, y: 5 } })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.scene.scene.start('TraderScene'));
            icons.push(traderBtn);
        }

        if (planet.hasShipyard) {
            const shipyardBtn = this.scene.add.text(0, 0, '🛠️', { fontSize: '24px', padding: { x: 5, y: 5 } })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.scene.scene.start('ShipyardScene'));
            icons.push(shipyardBtn);
        }

        // Vertical Stack Layout
        const spacing = 35;
        const totalHeight = (icons.length - 1) * spacing;
        const startY = -totalHeight / 2;

        icons.forEach((icon, index) => {
            icon.setPosition(0, startY + (index * spacing));
            this.interactionContainer.add(icon);
        });
    }

    public hide() {
        this.interactionContainer.setVisible(false);
    }

    private launchLevel(levelId: string) {
        if (levelId === 'blood-hunters') {
            this.scene.scene.start('BloodHunters');
        } else {
            console.warn('Level not implemented:', levelId);
        }
    }

    public launchLevelIfAvailable(planet: PlanetData) {
        if (planet.levelId) {
            this.launchLevel(planet.levelId);
        }
    }
}
