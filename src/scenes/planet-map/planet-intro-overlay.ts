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

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);

        const { width, height } = scene.scale;

        // 1. Background Overlay (Opaque Black)
        this.background = scene.add.rectangle(0, 0, width, height, 0x000000, 1.0)
            .setOrigin(0)
            .setInteractive();
        this.add(this.background);

        // 2. Planet Container
        this.planetContainer = scene.add.container(0, 0);
        // Note: Manual sorting handled in updateSorting
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
        this.add(this.textContainer);

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
        });
    }

    private updateSorting() {
        if (this.visible && this.borrowedPlanet) {
            this.planetContainer.sort('depth');
        }
    }

    public show(planet: PlanetData, onComplete: () => void) {
        this.onComplete = onComplete;
        this.fullText = planet.introText || "";
        this.currentText = "";
        this.charIndex = 0;
        this.isTyping = true;

        this.setVisible(true);
        this.setAlpha(1); // Keep container fully visible
        this.setVisible(true);
        this.setAlpha(1); // Keep container fully visible
        this.background.setAlpha(0); // Only background fades in
        this.textContainer.setAlpha(1); // FIX: Reset alpha after hide() faded it out

        this.borrowPlanetVisuals(planet);

        this.textContainer.setText("");
        this.promptText.setVisible(false);
        this.promptText.setAlpha(0);

        // Input
        this.scene.input.keyboard?.on('keydown-SPACE', this.handleInput, this);
        this.scene.input.on('pointerdown', this.handleInput, this);
    }

    private borrowPlanetVisuals(planet: PlanetData) {
        this.borrowedPlanet = planet;
        this.activeVisuals = []; // Reset active visuals

        // Save Original Data
        this.originalState.x = planet.x;
        this.originalState.y = planet.y;
        this.originalState.hidden = planet.hidden ?? true;
        this.originalState.parents.clear();
        this.originalState.transforms.clear();

        const { width, height } = this.scene.scale;

        // Target Positions
        const targetX = width / 2;
        const targetY = (height * 0.25) - 115;

        // Start Positions (Current Map Position)
        const startX = planet.x;
        const startY = planet.y;

        // 1. Setup Data for dynamic effects (Start at Original)
        planet.x = startX;
        planet.y = startY;
        planet.hidden = false;

        // 2. Identify Visuals to Move (Planet, Overlay, etc.)
        if (planet.gameObject) {
            this.hijackObject(planet.gameObject, startX, startY, 1);
            this.activeVisuals.push(planet.gameObject as any);
        }
        if (planet.overlayGameObject) {
            this.hijackObject(planet.overlayGameObject, startX, startY, 1);
            this.activeVisuals.push(planet.overlayGameObject as any);
        }

        // 3. Handle Effects
        if (planet.effects) {
            planet.effects.forEach(effect => {
                // If it's a GameObject (e.g. some effects extending Container/Image), hijack it
                if (effect instanceof Phaser.GameObjects.GameObject) {
                    this.hijackObject(effect, startX, startY);
                    this.activeVisuals.push(effect as any);
                } else {
                    // It is a Managed Effect (IPlanetEffect, e.g. Hurricane)
                    const e = effect as any;

                    // 1. Elevate Depth (so it shows above black overlay)
                    if (e.setDepth) {
                        e.setDepth(3000);
                        this.borrowedEffects.push(e);
                    }

                    // 3. Handle Asteroids (Special case: they are GameObjects but managed by effect)
                    if (e.asteroids && Array.isArray(e.asteroids)) {
                        e.asteroids.forEach((a: any) => {
                            if (a.sprite) {
                                // Asteroids update themselves based on planet.x/y, so we don't sync them manually
                                this.hijackObject(a.sprite, 0, 0, undefined, true);
                            }
                        });
                    }
                }
            });
        }

        // Handle Emitter
        if (planet.emitter) {
            this.borrowedEmitter = planet.emitter;
            this.originalEmitterDepth = planet.emitter.depth;
            planet.emitter.setDepth(2001);
            planet.emitter.setVisible(true);
        }

        // Start Text Layout (TextBox)
        const planetScale = planet.visualScale || 1.0;
        const effectiveRadius = 30 * planetScale;
        const textStartY = targetY + effectiveRadius + 15;

        this.textContainer.setPosition(targetX, textStartY);
        this.textContainer.setText("");

        // Create Name Label (in a container)
        const nameContainer = this.scene.add.container(startX, startY);
        nameContainer.setDepth(10); // Above planet
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
        // Single source of truth: We tween 'planet' (Data).
        // 'onUpdate' forces all visuals to look at 'planet.x/y'.
        // Effects (Asteroids) also look at 'planet.x/y' in their loops.
        this.scene.tweens.add({
            targets: planet,
            x: targetX,
            y: targetY,
            duration: duration,
            ease: ease,
            onUpdate: () => {
                this.activeVisuals.forEach(obj => {
                    obj.setPosition(planet.x, planet.y);
                });
            },
            onComplete: () => {
                this.startTyping();
            }
        });
    }

    private hijackObject(obj: Phaser.GameObjects.GameObject, x: number, y: number, depth?: number, keepPositionLogic?: boolean) {
        if (obj.parentContainer) {
            this.originalState.parents.set(obj, obj.parentContainer);
        } else {
            this.originalState.parents.set(obj, this.scene);
        }

        const sprite = obj as Phaser.GameObjects.Image | Phaser.GameObjects.Container;
        this.originalState.transforms.set(obj, {
            x: sprite.x,
            y: sprite.y,
            scale: sprite.scale,
            depth: sprite.depth,

            alpha: sprite.alpha,
            visible: sprite.visible
        });

        this.planetContainer.add(obj);

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
                    effect.setDepth(2); // Restore to standard map layer depth
                }
            });
            this.borrowedEffects = [];
        }

        this.originalState.parents.forEach((parent, obj) => {
            const saved = this.originalState.transforms.get(obj);
            if (saved) {
                const sprite = obj as Phaser.GameObjects.Image;
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
        this.timerEvent = this.scene.time.addEvent({
            delay: 50, loop: true,
            callback: () => {
                if (this.charIndex < this.fullText.length) {
                    this.currentText += this.fullText[this.charIndex];
                    this.textContainer.setText(this.currentText);
                    this.charIndex++;
                } else { this.finishTyping(); }
            }
        });
    }

    private forceFinishTyping() {
        if (this.timerEvent) this.timerEvent.remove();
        this.textContainer.setText(this.fullText);
        console.log('Intro Text Finished:', {
            text: this.fullText,
            x: this.textContainer.x,
            y: this.textContainer.y,
            visible: this.textContainer.visible,
            alpha: this.textContainer.alpha,
            scrollFactorX: this.textContainer.scrollFactorX,
            depth: this.textContainer.depth,
            overlayVisible: this.visible
        });
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
                this.setVisible(false);
                this.restorePlanetVisuals();
                this.planetContainer.removeAll(true);
                if (this.onComplete) { this.onComplete(); }
            }
        });
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        const { width, height } = gameSize;
        this.background.setSize(width, height);
        this.textContainer.setX(width / 2);
        this.promptText.setPosition(width / 2, height - 80);
    }
}
