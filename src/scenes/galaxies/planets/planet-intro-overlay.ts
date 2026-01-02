import Phaser from 'phaser';
import { type PlanetData } from './planet-data';
import { type IPlanetEffect } from './planet-effect';

export class PlanetIntroOverlay extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Rectangle;
    private planetContainer: Phaser.GameObjects.Container;
    private textContainer: Phaser.GameObjects.Text;
    private promptText: Phaser.GameObjects.Text;

    private currentText: string = "";
    private fullText: string = "";
    private charIndex: number = 0;
    private timerEvent?: Phaser.Time.TimerEvent;
    private onComplete?: () => void;
    private isTyping: boolean = false;

    // Track synced visuals for reverse animation
    private activeVisuals: (Phaser.GameObjects.Image | Phaser.GameObjects.Container)[] = [];

    // State for restoration
    private borrowedPlanet?: PlanetData;
    private originalState: {
        x: number;
        y: number;
        hidden: boolean;
        parents: Map<Phaser.GameObjects.GameObject, Phaser.GameObjects.Container | Phaser.Scene>;
        transforms: Map<Phaser.GameObjects.GameObject, { x: number, y: number, scale: number, depth: number, alpha: number, visible: boolean }>;
    } = { x: 0, y: 0, hidden: false, parents: new Map(), transforms: new Map() };

    private borrowedEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
    private originalEmitterDepth?: number;
    private originalEffectDepths: Map<IPlanetEffect, number> = new Map();

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);

        const { width, height } = scene.scale;

        // 1. Background Overlay (Opaque Black)
        this.background = scene.add.rectangle(0, 0, width, height, 0x000000, 1.0)
            .setOrigin(0)
            .setInteractive();
        this.add(this.background);

        // 2. Planet Container (Holds Text, Planet, Effects)
        this.planetContainer = scene.add.container(0, 0);
        this.add(this.planetContainer);

        // 3. Typewriter Text
        const presetWidth = Math.min(600, width * 0.8);
        this.textContainer = scene.add.text(width / 2, 0, '', {
            fontFamily: 'Oswald, sans-serif',
            fontSize: '22px',
            color: '#ffffff',
            align: 'left',
            lineSpacing: 8,
            wordWrap: { width: presetWidth },
            fixedWidth: presetWidth // Predefined centered box width
        }).setOrigin(0.5, 0).setScrollFactor(0); // FIX: Lock to camera

        // Add text to the common container for sorting!
        this.planetContainer.add(this.textContainer);

        // 4. Prompt Text
        this.promptText = scene.add.text(width / 2, height - 80, 'Press FIRE', {
            fontFamily: 'Oswald, sans-serif',
            fontSize: '22px', // Matches textContainer
            color: '#aaaaaa'
        }).setOrigin(0.5);
        this.promptText.setVisible(false);
        this.add(this.promptText);

        // Initially hidden, High Depth
        this.setVisible(false);
        this.setDepth(2000);
        this.setScrollFactor(0); // FIX: Lock container to camera
        scene.add.existing(this);

        // Resize handler
        scene.scale.on('resize', this.handleResize, this);

        // Critical: Hook into scene postupdate to force sort AFTER effects have updated their properties
        // This is the clean, non-hacky way to ensure container respects dynamic depth changes
        this.scene.events.on('postupdate', this.updateSorting, this);
        this.on('destroy', () => {
            this.scene.events.off('postupdate', this.updateSorting, this);
            this.scene.scale.off('resize', this.handleResize, this);
            if (this.timerEvent) this.timerEvent.remove();
        });
    }



    private updateSorting() {
        if (this.visible && this.borrowedPlanet) {
            this.planetContainer.sort('depth');
        }
    }

    public show(planet: PlanetData, text: string, onComplete: () => void) {

        // Reset state first
        this.fullText = "";  // Clear first to ensure no old content
        this.currentText = "";
        this.charIndex = 0;
        this.isTyping = true;
        this.onComplete = onComplete;

        // Kill any existing tweens that might interfere
        this.scene.tweens.killTweensOf(this.textContainer);
        this.scene.tweens.killTweensOf(this.promptText);
        this.scene.tweens.killTweensOf(this.background);
        if (this.borrowedPlanet) {
            this.scene.tweens.killTweensOf(this.borrowedPlanet);
        }

        // DESTROY and RECREATE textContainer to clear any cached Phaser canvas texture
        const { width } = this.scene.scale;
        const presetWidth = Math.min(600, width * 0.8);
        this.textContainer.destroy();
        this.textContainer = this.scene.add.text(width / 2, 0, '', {
            fontFamily: 'Oswald, sans-serif',
            fontSize: '22px',
            color: '#ffffff',
            align: 'left',
            lineSpacing: 8,
            wordWrap: { width: presetWidth },
            fixedWidth: presetWidth
        }).setOrigin(0.5, 0).setScrollFactor(0);
        this.textContainer.setVisible(false);
        this.textContainer.setAlpha(0);

        // Add to planetContainer for sorting
        this.planetContainer.add(this.textContainer);

        // Ensure prompt is top level (in Overlay)
        this.promptText.setVisible(false);
        this.promptText.setAlpha(0);

        // NOW set the actual text we want to type
        this.fullText = text;

        // Keep overlay invisible initially
        this.setVisible(false);
        this.background.setAlpha(0);
        this.background.setInteractive(); // Re-enable interaction

        // Setup borrowPlanetVisuals BEFORE showing overlay
        this.borrowPlanetVisuals(planet);

        // Show immediately
        this.setVisible(true);
        this.setAlpha(1);
        // Input
        this.scene.input.keyboard?.on('keydown-SPACE', this.handleInput, this);
        this.scene.input.on('pointerdown', this.handleInput, this);
    }

    private borrowPlanetVisuals(planet: PlanetData) {
        this.borrowedPlanet = planet;
        this.borrowedPlanet.isHijacked = true;
        this.activeVisuals = []; // Reset active visuals

        // Save Original Data
        this.originalState.x = planet.x;
        this.originalState.y = planet.y;
        this.originalState.hidden = planet.hidden ?? true;
        this.originalState.parents.clear();
        this.originalState.transforms.clear();

        const { width, height } = this.scene.scale;
        const camera = this.scene.cameras.main;

        // Target Positions (Screen Space)
        const targetX = width / 2;
        const targetY = (height * 0.25) - 110;

        // Start Positions (Screen Space)
        const startX = planet.x - camera.scrollX;
        const startY = planet.y - camera.scrollY;

        // 1. Setup Data for dynamic effects (Convert to Screen Space)
        // This ensures effects that read planet.x/y (like Asteroids) render relative to the container (0,0) correctly
        planet.x = startX;
        planet.y = startY;
        planet.hidden = false;

        // 2. Identify Visuals to Move
        if (planet.gameObject) {
            this.hijackObject(planet.gameObject, startX, startY, 1, false, this.planetContainer);
            this.activeVisuals.push(planet.gameObject as any);
        }
        if (planet.overlayGameObject) {
            this.hijackObject(planet.overlayGameObject, startX, startY, 1.1, false, this.planetContainer);
            this.activeVisuals.push(planet.overlayGameObject as any);
        }

        // 3. Handle Effects
        if (planet.effects) {
            planet.effects.forEach(effect => {
                const e = effect as any;

                // Hijack underlying elements first to save their original world depths
                if (e.getVisualElements) {
                    const elements = e.getVisualElements();
                    elements.forEach((obj: Phaser.GameObjects.GameObject) => {
                        // Hijack into container.
                        // Do NOT add to activeVisuals because they update themselves via effect.update()
                        this.hijackObject(obj, startX, startY, undefined, true, this.planetContainer);
                    });
                } else if (e.graphics) {
                    this.hijackObject(e.graphics, startX, startY, undefined, true, this.planetContainer);
                }

                // Standardize depth base (Back=0, Planet=1, Front=2+) after hijacking
                if (e.setDepth) {
                    if (e.getDepth) {
                        this.originalEffectDepths.set(e, e.getDepth());
                    }
                    e.setDepth(0); // Base depth 0 relative to container (Planet is 1, Front effects 2+)
                    this.borrowedEffects.push(e);
                }
            });
        }

        // Handle Emitter (Cloud animation for hidden planets)
        if (planet.emitter) {
            this.borrowedEmitter = planet.emitter;
            this.originalEmitterDepth = planet.emitter.depth;

            // Hijack the emitter into the container
            this.hijackObject(planet.emitter as any, startX, startY, 11, false, this.planetContainer);
            this.activeVisuals.push(planet.emitter as any);

            planet.emitter.setVisible(true);
        }

        // Handle Lock Icon
        const lockIcon = (planet as any).lockIcon as Phaser.GameObjects.Text;
        if (lockIcon) {
            // Hijack the lock icon into the container
            this.hijackObject(lockIcon, startX, startY, 12, false, this.planetContainer);
            this.activeVisuals.push(lockIcon as any);
        }

        // Start Text Layout
        const effectiveRadius = 30 * (planet.visualScale || 1.0);
        const textStartY = targetY + effectiveRadius + 30;

        this.textContainer.setPosition(width / 2, textStartY);
        this.textContainer.setText("");
        this.textContainer.setVisible(false);

        // Create Name Label
        const nameContainer = this.scene.add.container(startX, startY);
        nameContainer.setDepth(10);
        this.planetContainer.add(nameContainer);
        this.activeVisuals.push(nameContainer);

        this.createStartNamev2(planet, nameContainer);

        // ANIMATION SEQUENCE
        const duration = 1000;
        const ease = 'Power2';

        // 1. Fade in Background
        this.scene.tweens.add({
            targets: this.background,
            alpha: 0.8,
            duration: duration,
            ease: ease
        });

        // 2. Move Planet Data AND Sync Visuals
        this.scene.tweens.add({
            targets: planet,
            x: targetX,
            y: targetY,
            duration: duration,
            ease: ease,
            onUpdate: () => {
                // Sync manually tracked visuals (Planet Sprite, Name Label)
                this.activeVisuals.forEach(obj => {
                    obj.setPosition(planet.x, planet.y);
                });
                // Note: Asteroids/Rings update themselves in their own update() loop reading planet.x/y
            },
            onComplete: () => {
                this.startTyping();
            }
        });
    }

    private hijackObject(obj: Phaser.GameObjects.GameObject, x: number, y: number, depth?: number, keepPositionLogic?: boolean, targetContainer?: Phaser.GameObjects.Container) {
        if (obj.parentContainer) {
            this.originalState.parents.set(obj, obj.parentContainer);
        } else {
            this.originalState.parents.set(obj, this.scene);
        }

        const sprite = obj as any;
        this.originalState.transforms.set(obj, {
            x: sprite.x,
            y: sprite.y,
            scale: sprite.scale || 1,
            depth: sprite.depth || 0,
            alpha: sprite.alpha ?? 1,
            visible: sprite.visible ?? true
        });

        if (targetContainer) {
            targetContainer.add(obj);
        } else {
            this.planetContainer.add(obj);
        }

        if (!keepPositionLogic) {
            sprite.setPosition(x, y);
        }

        if (depth !== undefined) {
            sprite.setDepth(depth);
        }

        (obj as any).setVisible(true);
        (obj as any).setAlpha(1);
    }

    private borrowedEffects: IPlanetEffect[] = [];

    private restorePlanetVisuals() {
        if (!this.borrowedPlanet) return;

        this.borrowedPlanet.x = this.originalState.x;
        this.borrowedPlanet.y = this.originalState.y;
        this.borrowedPlanet.hidden = this.originalState.hidden;

        if (this.borrowedEmitter && this.originalEmitterDepth !== undefined) {
            this.borrowedEmitter.setDepth(this.originalEmitterDepth);
        }

        // Restore Effects Depth
        if (this.borrowedEffects.length > 0) {
            this.borrowedEffects.forEach(effect => {
                if (effect.setDepth) {
                    const originalDepth = this.originalEffectDepths.get(effect) ?? 2;
                    effect.setDepth(originalDepth);
                }
            });
            this.borrowedEffects = [];
            this.originalEffectDepths.clear();
        }

        this.originalState.parents.forEach((parent, obj) => {
            const saved = this.originalState.transforms.get(obj);
            if (saved) {
                const sprite = obj as any;
                sprite.setPosition(saved.x, saved.y);
                sprite.setScale(saved.scale);
                sprite.setDepth(saved.depth);
                sprite.setAlpha(saved.alpha);
                sprite.setVisible(saved.visible);
            }

            if (parent instanceof Phaser.GameObjects.Container) {
                parent.add(obj);
            } else {
                this.scene.add.existing(obj);
            }
        });

        this.originalState.parents.clear();
        this.originalState.transforms.clear();
        if (this.borrowedPlanet) this.borrowedPlanet.isHijacked = false;
        this.borrowedPlanet = undefined;
        this.borrowedEmitter = undefined;
    }

    private createStartNamev2(planet: PlanetData, container: Phaser.GameObjects.Container) {
        // Generates name text relative to (0,0) and adds to the passed container
        const fullText = planet.name.toUpperCase();
        let lines: string[] = [fullText];
        const planetScale = planet.visualScale || 1.0;

        const isSmall = (planetScale <= 0.9);
        if (isSmall && fullText.includes(' ')) {
            lines = fullText.split(' ');
        }

        const fontSizeStr = '18px';
        const lineHeight = 18;
        const spacing = 4;
        const basePlanetRadius = 30;
        const planetRadius = basePlanetRadius * planetScale;
        const baseRadius = planetRadius + 23;
        const startAngle = -Math.PI / 2;

        let labelOffsetX = 0;
        let labelOffsetY = 0;

        if (planet.gameObject) {
            const go = planet.gameObject as Phaser.GameObjects.Image | Phaser.GameObjects.Container;
            if ('width' in go && 'displayOriginX' in go) {
                const img = go as Phaser.GameObjects.Image;
                const dx = (img.width * 0.60) - img.displayOriginX;
                const dy = (img.height / 2) - img.displayOriginY;

                const rot = img.rotation;
                const c = Math.cos(rot);
                const s = Math.sin(rot);

                labelOffsetX = dx * c - dy * s;
                labelOffsetY = dx * s + dy * c;
            }
        }

        const measureText = this.scene.add.text(0, 0, '', {
            fontFamily: 'Oswald, sans-serif',
            fontSize: fontSizeStr,
        }).setVisible(false);

        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            const lineText = lines[lineIdx];
            const heightLevel = (lines.length - 1) - lineIdx;
            const radius = baseRadius + (heightLevel * lineHeight);

            const charWidths: number[] = [];
            let totalArcLength = 0;
            for (const char of lineText) {
                measureText.setText(char);
                const w = measureText.width;
                charWidths.push(w);
                totalArcLength += w;
            }
            if (charWidths.length > 1) {
                totalArcLength += (charWidths.length - 1) * spacing;
            }

            const totalAngleSpan = totalArcLength / radius;
            let currentAngle = startAngle - (totalAngleSpan / 2);

            for (let i = 0; i < lineText.length; i++) {
                const char = lineText[i];
                const w = charWidths[i];
                const charAngleSpan = w / radius;
                const charCenterAngle = currentAngle + (charAngleSpan / 2);

                const tx = labelOffsetX + Math.cos(charCenterAngle) * radius;
                const ty = labelOffsetY + Math.sin(charCenterAngle) * radius;

                const letter = this.scene.add.text(tx, ty, char, {
                    fontFamily: 'Oswald, sans-serif',
                    fontSize: fontSizeStr,
                    color: '#ffffff',
                    shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, stroke: true, fill: true }
                });
                letter.setOrigin(0.5);
                letter.setRotation(charCenterAngle + Math.PI / 2);

                container.add(letter);

                const advance = w + spacing;
                currentAngle += advance / radius;
            }
        }
        measureText.destroy();
    }

    private handleInput() {
        if (!this.visible) return;
        if (this.isTyping) { this.forceFinishTyping(); } else { this.hide(); }
    }

    private startTyping() {
        if (this.timerEvent) this.timerEvent.remove();

        // Show text container now that typing is starting (was hidden to prevent flash)
        this.textContainer.setVisible(true);
        this.textContainer.setAlpha(1);

        this.timerEvent = this.scene.time.addEvent({
            delay: 50, loop: true,
            callback: () => {
                // Safety check: Ensure scene and textContainer still exist
                if (!this.scene || !this.textContainer || !this.textContainer.scene) {
                    if (this.timerEvent) this.timerEvent.remove();
                    return;
                }

                if (this.charIndex < this.fullText.length) {
                    this.currentText += this.fullText[this.charIndex];
                    this.textContainer.setText(this.currentText);
                    this.charIndex++;
                } else { this.finishTyping(); }
            }
        });

        // Ensure timer is cleaned up on destroy
        this.once('destroy', () => {
            if (this.timerEvent) this.timerEvent.remove();
        });
    }

    private forceFinishTyping() {
        if (this.timerEvent) this.timerEvent.remove();
        this.textContainer.setVisible(true); // Ensure visible when skipping
        this.textContainer.setAlpha(1);
        this.textContainer.setText(this.fullText);
        console.log(`Intro Text displayed for planet: ${this.borrowedPlanet?.id}`);
        this.finishTyping();
    }

    private finishTyping() {
        this.isTyping = false;
        if (this.timerEvent) this.timerEvent.remove();
        this.promptText.setVisible(true);
        this.scene.tweens.add({ targets: this.promptText, alpha: { from: 0, to: 1 }, duration: 500, yoyo: true, repeat: -1 });
    }

    private hide() {
        if (!this.borrowedPlanet) return;

        // 1. Disable Input
        this.scene.input.keyboard?.off('keydown-SPACE', this.handleInput, this);
        this.scene.input.off('pointerdown', this.handleInput, this);

        const duration = 800;
        const ease = 'Power2';

        // 2. Fade Out Text & Background ONLY (Keep container visible)
        this.scene.tweens.add({
            targets: [this.textContainer, this.promptText, this.background],
            alpha: 0,
            duration: 500,
            ease: ease
        });

        // 3. Move Planet Data back to Original Start
        this.scene.tweens.add({
            targets: this.borrowedPlanet,
            x: this.originalState.x,
            y: this.originalState.y,
            duration: duration,
            ease: ease,
            onUpdate: () => {
                // Keep visuals synced while moving back
                if (this.borrowedPlanet) {
                    this.activeVisuals.forEach(obj => {
                        obj.setPosition(this.borrowedPlanet!.x, this.borrowedPlanet!.y);
                    });
                }
            },
            onComplete: () => {
                // 4. Final Cleanup - Only now hide the container and restore
                this.textContainer.setText(""); // Clear text for next show
                this.textContainer.setVisible(false);
                this.setVisible(false);
                this.restorePlanetVisuals();
                this.planetContainer.removeAll(true);
                if (this.onComplete) { this.onComplete(); }
            }
        });
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        if (!this.background) return; // Guard against resize during destruction
        const { width, height } = gameSize;
        this.background.setSize(width, height);
        this.textContainer.setX(width / 2);
        this.promptText.setPosition(width / 2, height - 80);
    }
}
