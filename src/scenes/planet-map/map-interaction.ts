import Phaser from 'phaser';
import type { PlanetData } from './planet-data';

export class MapInteractionManager {
    private scene: Phaser.Scene;
    private interactionContainer!: Phaser.GameObjects.Container;
    private planetNameContainer!: Phaser.GameObjects.Container;
    private universeId?: string;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createInteractionUI();
    }

    public setUniverseId(id: string) {
        this.universeId = id;
    }

    private createInteractionUI() {
        this.interactionContainer = this.scene.add.container(0, 0);
        this.interactionContainer.setVisible(false);
        this.interactionContainer.setDepth(100);

        this.planetNameContainer = this.scene.add.container(0, 0);
        this.planetNameContainer.setDepth(100);
        this.planetNameContainer.setVisible(false);
    }

    public showInteractionUI(planet: PlanetData) {
        this.interactionContainer.removeAll(true);
        this.planetNameContainer.removeAll(true);

        // Calculate text positioning to place icons
        const basePlanetRadius = 30; // Base visual radius
        const planetRadius = basePlanetRadius * (planet.visualScale ?? 1.0);

        let textOuterRadius = planetRadius + 10; // Base text radius

        // Check for multi-line
        const isSmall = (planet.visualScale ?? 1.0) <= 0.8;
        const nameUpper = planet.name.toUpperCase();
        if (isSmall && nameUpper.includes(' ')) {
            const lines = nameUpper.split(' ');
            const lineHeight = 14;
            // Max radius is base + (numLines - 1) * lineHeight
            textOuterRadius += (lines.length - 1) * lineHeight;
        }

        // Position icons: Planet X + Text Radius + 10px (padding for letters) + 3px (margin)
        // New: Center below planet
        const iconY = planet.y + planetRadius + 17; // 5px padding + 12px half-height

        this.interactionContainer.setPosition(planet.x, iconY);

        // Show Planet Name (Curved)
        this.updatePlanetName(planet, planetRadius);

        // Start invisible for smooth fade-in
        this.interactionContainer.setAlpha(0);
        this.interactionContainer.setVisible(true);

        this.planetNameContainer.setAlpha(0);
        this.planetNameContainer.setVisible(true);

        const icons: Phaser.GameObjects.Text[] = [];

        if (planet.interaction?.levelId) {
            const levelId = planet.interaction.levelId;
            const playBtn = this.scene.add.text(0, 0, '🔫', {
                fontSize: '24px',
                padding: { x: 5, y: 5 },
                shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, stroke: true, fill: true }
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.launchLevel(levelId, planet));
            icons.push(playBtn);
        }

        if (planet.interaction?.hasShipyard) {
            const shipyardBtn = this.scene.add.text(0, 0, '🛠️', {
                fontSize: '24px',
                padding: { x: 5, y: 5 },
                shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, stroke: true, fill: true }
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.scene.scene.start('ShipyardScene'));
            icons.push(shipyardBtn);
        }

        if (planet.interaction?.warpUniverseId) {
            const warpBtn = this.scene.add.text(0, 0, '🌀', {
                fontSize: '24px',
                padding: { x: 5, y: 5 },
                shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, stroke: true, fill: true }
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.scene.scene.start('PlanetMapScene', { universeId: planet.interaction?.warpUniverseId }));
            icons.push(warpBtn);
        }

        // Horizontal Layout
        const spacing = 40;
        const totalWidth = (icons.length - 1) * spacing;
        const startX = -totalWidth / 2;

        icons.forEach((icon, index) => {
            icon.setPosition(startX + (index * spacing), 0);
            this.applyIconStyle(icon);
            this.interactionContainer.add(icon);
        });

        // Smooth fade-in animation
        this.scene.tweens.add({
            targets: [this.interactionContainer, this.planetNameContainer],
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
    }

    private updatePlanetName(planet: PlanetData, planetRadius: number) {
        const fullText = planet.name.toUpperCase();
        let lines: string[] = [fullText];

        // Check if "small" planet (scale <= 0.9) and has spaces
        const isSmall = (planet.visualScale ?? 1.0) <= 0.9;
        if (isSmall && fullText.includes(' ')) {
            lines = fullText.split(' ');
        }

        // Base settings
        const startAngle = -Math.PI / 2;
        const fontSizeStr = '18px';
        const fontFamilyStr = 'Oswald, sans-serif';
        const lineHeight = 18;
        const spacing = 4; // Increased spacing slightly for better readability

        // Base radius is for the closest line to the planet
        // Increased from 15 to 23 based on feedback that text was too close (touching) on small planets
        const baseRadius = planetRadius + 23;

        // Calculate the true visual center (geometric center of the quad)
        // because setOrigin(0.52, 0.40) and rotation shifts the visual center relative to x,y
        let labelX = planet.x;
        let labelY = planet.y;

        if (planet.gameObject) {
            const go = planet.gameObject as Phaser.GameObjects.Image | Phaser.GameObjects.Text;

            // Local vector from Anchor (DisplayOrigin) to Visual Center
            // Analysis suggests the low OriginY (0.40) causes significant Left-Shift upon rotation (45deg).
            // To compensate and move center Right (closer to Anchor), we need a larger X factor.
            // 0.55 was too Left (C=94px, N=53px). 0.52 (Anchor) causes Total X shift of ~ -0.07w.
            // Trying 0.60 to bring Total X shift closer to -0.01w.
            const dx = (go.width * 0.60) - go.displayOriginX;
            const dy = (go.height / 2) - go.displayOriginY;

            // Rotate this vector by the object's rotation
            const rot = go.rotation;
            const c = Math.cos(rot);
            const s = Math.sin(rot);

            const rx = dx * c - dy * s;
            const ry = dx * s + dy * c;

            // World Center = Anchor + Rotated Vector
            labelX = go.x + rx;
            labelY = go.y + ry;
        }

        this.planetNameContainer.setPosition(labelX, labelY);

        // Helper text object for measuring
        // Added shadow to match the real text, ensuring width measurement is accurate
        const measureText = this.scene.add.text(0, 0, '', {
            fontFamily: fontFamilyStr,
            fontSize: fontSizeStr,
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, stroke: true, fill: true }
        }).setVisible(false);

        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            const lineText = lines[lineIdx];
            // Invert index for radius calculation so first word is highest
            const heightLevel = (lines.length - 1) - lineIdx;
            const radius = baseRadius + (heightLevel * lineHeight);

            // 1. Measure all characters
            const charWidths: number[] = [];
            let totalArcLength = 0;

            for (const char of lineText) {
                measureText.setText(char);
                const w = measureText.width;
                charWidths.push(w);
                totalArcLength += w;
            }

            // Add spacing to total length
            if (charWidths.length > 1) {
                totalArcLength += (charWidths.length - 1) * spacing;
            }

            // 2. Calculate Angular Span
            const totalAngleSpan = totalArcLength / radius;

            // 3. Start from the left-most edge angle
            // Center is startAngle. 
            // Left edge is startAngle - (totalAngleSpan / 2)
            let currentAngle = startAngle - (totalAngleSpan / 2);

            for (let i = 0; i < lineText.length; i++) {
                const char = lineText[i];
                const w = charWidths[i];

                // Calculate angle for the CENTER of this character
                // We are currently at the left edge of this char position
                // Center is currentAngle + (half_width_angle)
                const charAngleSpan = w / radius;
                const charCenterAngle = currentAngle + (charAngleSpan / 2);

                const x = Math.cos(charCenterAngle) * radius;
                const y = Math.sin(charCenterAngle) * radius;

                const letter = this.scene.add.text(x, y, char, {
                    fontFamily: fontFamilyStr,
                    fontSize: fontSizeStr,
                    color: '#ffffff',
                    shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, stroke: true, fill: true }
                });

                letter.setOrigin(0.5);
                letter.setRotation(charCenterAngle + Math.PI / 2);

                this.planetNameContainer.add(letter);

                // Advance angle to the start of the next character
                // Move past this char + spacing
                const advancePixels = w + spacing;
                const advanceAngle = advancePixels / radius;
                currentAngle += advanceAngle;
            }
        }

        measureText.destroy();
    }

    public hide() {
        this.interactionContainer.setVisible(false);
        this.planetNameContainer.setVisible(false);
    }

    private launchLevel(levelId: string, planet: PlanetData) {
        const planetColor = planet.tint ? `#${planet.tint.toString(16).padStart(6, '0')}` : '#ffff00';

        // Special case for ship-demo-level which uses its own scene
        if (levelId === 'ship-demo-level') {
            this.scene.scene.start('ShipDemoScene', {
                returnPlanetId: planet.id,
                warpUniverseId: planet.interaction?.warpUniverseId,
                planetColor: planetColor,
                universeId: this.universeId
            });
            return;
        }

        // All other levels use BloodHunters scene with levelId passed
        this.scene.scene.start('BloodHunters', {
            returnPlanetId: planet.id,
            warpUniverseId: planet.interaction?.warpUniverseId,
            planetColor: planetColor,
            levelId: levelId,
            universeId: this.universeId
        });
    }

    public launchLevelIfAvailable(planet: PlanetData) {
        if (planet.interaction?.levelId) {
            this.launchLevel(planet.interaction.levelId, planet);
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
