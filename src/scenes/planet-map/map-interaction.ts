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
        if (planet.id === 'earth') {
            this.interactionContainer.setVisible(false);
            return;
        }

        // Position - 5px from the planet edge, accounting for planet's visual scale
        const basePlanetRadius = 30; // Base visual radius
        const planetRadius = basePlanetRadius * (planet.visualScale ?? 1.0);
        const gap = 15;
        this.interactionContainer.setPosition(planet.x + planetRadius + gap, planet.y);

        // Start invisible for smooth fade-in
        this.interactionContainer.setAlpha(0);
        this.interactionContainer.setVisible(true);

        const icons: Phaser.GameObjects.Text[] = [];

        if (planet.interaction?.levelId) {
            const levelId = planet.interaction.levelId;
            const playBtn = this.scene.add.text(0, 0, '🔫', { fontSize: '24px', padding: { x: 5, y: 5 } })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.launchLevel(levelId));
            icons.push(playBtn);
        }

        if (planet.interaction?.hasTrader) {
            const traderBtn = this.scene.add.text(0, 0, '💰', { fontSize: '24px', padding: { x: 5, y: 5 } })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.scene.scene.start('TraderScene'));
            icons.push(traderBtn);
        }

        if (planet.interaction?.hasShipyard) {
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
            this.applyIconStyle(icon);
            this.interactionContainer.add(icon);
        });

        // Smooth fade-in animation
        this.scene.tweens.add({
            targets: this.interactionContainer,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
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
        if (planet.interaction?.levelId) {
            this.launchLevel(planet.interaction.levelId);
        }
    }

    private applyIconStyle(icon: Phaser.GameObjects.Text) {
        if (icon.postFX) {
            icon.postFX.clear();
        }

        const colorMatrix = icon.postFX.addColorMatrix();
        colorMatrix.saturate(-1);

        const tintColor = 0xFFFFFF; // Light Gray
        const r = ((tintColor >> 16) & 0xFF) / 255;
        const g = ((tintColor >> 8) & 0xFF) / 255;
        const b = (tintColor & 0xFF) / 255;

        const tintMatrix = icon.postFX.addColorMatrix();
        tintMatrix.multiply([
            r, 0, 0, 0, 0,
            0, g, 0, 0, 0,
            0, 0, b, 0, 0,
            0, 0, 0, 1, 0
        ]);
    }
}
