import { inject } from 'inversify';
import { SceneScoped } from '../../../di/decorators';
import Phaser from 'phaser';
import { type PlanetData } from './planet-data';
import { type IPlanetEffect } from './planet-effect';

@SceneScoped()
export class PlanetStoryline {
    private container: Phaser.GameObjects.Container;
    private background: Phaser.GameObjects.Rectangle;
    private planetContainer: Phaser.GameObjects.Container;

    // Scrolling Components
    private scrollWindow!: Phaser.GameObjects.Container;
    private scrollContent!: Phaser.GameObjects.Container;
    private scrollMaskGraphics!: Phaser.GameObjects.Graphics;
    private scrollMask!: Phaser.Display.Masks.GeometryMask;
    private topFade!: Phaser.GameObjects.Graphics;

    private textContainer: Phaser.GameObjects.Text;
    private promptText: Phaser.GameObjects.Text;

    private currentText: string = "";
    private fullText: string = "";
    private charIndex: number = 0;
    private timerEvent?: Phaser.Time.TimerEvent;
    private onComplete?: () => void;
    private isTyping: boolean = false;

    // Scroll State
    private isDragging: boolean = false;
    private lastPointerY: number = 0;
    private dragThreshold: number = 5; // Minimum movement to be considered a drag
    private startPointerPos: { x: number, y: number } | null = null;

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

    constructor(@inject('Scene') private scene: Phaser.Scene) {
        this.container = scene.add.container(0, 0);

        const { width, height } = scene.scale;

        // 1. Background Overlay (Opaque Black)
        this.background = scene.add.rectangle(0, 0, width, height, 0x000000, 1.0)
            .setOrigin(0)
            .setInteractive();
        this.container.add(this.background);

        // 2. Planet Container (Holds Text, Planet, Effects)
        this.planetContainer = scene.add.container(0, 0);
        this.planetContainer.setDepth(20); // High depth to stay above fade and text
        this.container.add(this.planetContainer);

        // 3. Scroll Content Container
        this.scrollWindow = scene.add.container(0, 0);
        this.scrollWindow.setDepth(10); // Below fade
        this.container.add(this.scrollWindow);

        this.scrollContent = scene.add.container(0, 0);
        this.scrollWindow.add(this.scrollContent);

        // Mask Setup
        this.scrollMaskGraphics = scene.make.graphics({});
        this.scrollMask = this.scrollMaskGraphics.createGeometryMask();
        this.scrollWindow.setMask(this.scrollMask);

        // 4. Typewriter Text
        const padding = 5;
        const presetWidth = width - (padding * 2);
        this.textContainer = scene.add.text(0, 0, '', { // Position relative to scrollContent
            fontFamily: 'Oswald, sans-serif',
            fontSize: '22px',
            color: '#ffffff',
            align: 'left',
            lineSpacing: 8,
            wordWrap: { width: presetWidth },
            fixedWidth: presetWidth,
            padding: { top: 0, bottom: 0, left: 0, right: 0 }
        }).setOrigin(0.5, 0); // Center origin X

        this.scrollContent.add(this.textContainer);

        // 5. Prompt Text
        this.promptText = scene.add.text(0, 0, 'Press FIRE', {
            fontFamily: 'Oswald, sans-serif',
            fontSize: '22px',
            color: '#aaaaaa'
        }).setOrigin(0.5, 0);
        this.promptText.setVisible(false);
        this.scrollContent.add(this.promptText);

        // 6. Top Fade
        this.topFade = scene.add.graphics();
        this.topFade.setScrollFactor(0);
        this.topFade.setDepth(15); // Above text (in window), below planet
        this.container.add(this.topFade); // FIX: Add to main container to be visible above window

        // Ensure Z-Order by manipulation (containers render based on child list order)
        // Order Bottom-up: Background -> ScrollWindow -> TopFade -> PlanetContainer
        this.container.bringToTop(this.scrollWindow);
        this.container.bringToTop(this.topFade);
        this.container.bringToTop(this.planetContainer);

        // Initially hidden, High Depth
        this.setVisible(false);
        this.setDepth(2000);
        this.setScrollFactor(0); // FIX: Lock container to camera

        // Resize handler
        scene.scale.on('resize', this.handleResize, this);

        // Input Handling for Scroll
        scene.input.on('pointerdown', this.handlePointerDown, this);
        scene.input.on('pointermove', this.handlePointerMove, this);
        scene.input.on('pointerup', this.handlePointerUp, this);

        // Keyboard handling for skip/dismiss
        scene.input.keyboard?.on('keydown-SPACE', this.handleSpaceKey, this);
        // Note: We use scene input to capture drags even if started on background

        // Update loop for kinetic scroll or bounds check could go here if needed, 
        // but simple drag is enough for now.

        // Critical: Hook into scene postupdate to sort visuals in planetContainer
        this.scene.events.on('postupdate', this.updateSorting, this);
    }

    public destroy() {
        this.scene.events.off('postupdate', this.updateSorting, this);
        this.scene.scale.off('resize', this.handleResize, this);
        this.scene.input.off('pointerdown', this.handlePointerDown, this);
        this.scene.input.off('pointermove', this.handlePointerMove, this);
        this.scene.input.off('pointerup', this.handlePointerUp, this);
        this.scene.input.keyboard?.off('keydown-SPACE', this.handleSpaceKey, this);

        if (this.timerEvent) this.timerEvent.remove();
        this.scrollMaskGraphics.destroy();
        this.container.destroy();
    }

    private updateSorting() {
        // planetContainer contents might change depth dynamically
        if (this.visible && this.borrowedPlanet) {
            this.planetContainer.sort('depth');
        }
    }

    public setVisible(visible: boolean) {
        this.container.setVisible(visible);
        // Ensure mask visibility matches (though mask is not 'visible' in that sense)
    }

    public get visible(): boolean {
        return this.container.visible;
    }

    public get alpha(): number {
        return this.container.alpha;
    }

    public setAlpha(alpha: number) {
        this.container.setAlpha(alpha);
    }

    public setDepth(depth: number) {
        this.container.setDepth(depth);
    }

    public setScrollFactor(scrollFactor: number) {
        this.container.setScrollFactor(scrollFactor);
    }

    public show(planet: PlanetData, text: string, onComplete: () => void) {
        // Reset state
        this.fullText = "";
        this.currentText = "";
        this.charIndex = 0;
        this.isTyping = true;
        this.onComplete = onComplete; // Callback when user dismisses

        // Reset scroll
        this.scrollContent.y = 0;

        // Kill tweens
        this.scene.tweens.killTweensOf(this.textContainer);
        this.scene.tweens.killTweensOf(this.promptText);
        this.scene.tweens.killTweensOf(this.background);
        if (this.borrowedPlanet) {
            this.scene.tweens.killTweensOf(this.borrowedPlanet);
        }

        // Recreate text to ensure clean slate (sometimes required for texture issues)
        // For efficiency, we could just setText, but let's stick to update params
        const { width, height } = this.scene.scale;
        const padding = 5;
        const presetWidth = width - (padding * 2);

        this.textContainer.setStyle({
            wordWrap: { width: presetWidth },
            fixedWidth: presetWidth,
            padding: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        // Layout Text
        this.fullText = text;
        this.textContainer.setText("");
        this.textContainer.setVisible(true); // Always visible container, text grows
        this.textContainer.setAlpha(1);

        this.promptText.setVisible(false);
        this.promptText.setAlpha(0);

        // Setup Scroll Viewport
        this.updateLayout(width, height);

        // Keep overlay invisible initially
        this.setVisible(false);
        this.background.setAlpha(0);

        // Setup visuals
        this.borrowPlanetVisuals(planet);

        // Show
        this.setVisible(true);
        this.setAlpha(1);

        // Input
        // Note: Global input listeners are already set in constructor
    }

    private borrowPlanetVisuals(planet: PlanetData) {
        this.borrowedPlanet = planet;
        this.borrowedPlanet.isHijacked = true;
        this.activeVisuals = [];

        // Save Original Data
        this.originalState.x = planet.x;
        this.originalState.y = planet.y;
        this.originalState.hidden = planet.hidden ?? true;
        this.originalState.parents.clear();
        this.originalState.transforms.clear();

        const { width, height } = this.scene.scale;
        const camera = this.scene.cameras.main;

        // Target Positions
        const targetX = width / 2;
        // Updating layout ensures planetTargetY is fresh
        this.updateLayout(width, height);
        const targetY = this.planetTargetY;

        const startX = planet.x - camera.scrollX;
        const startY = planet.y - camera.scrollY;

        planet.x = startX;
        planet.y = startY;
        planet.hidden = false;

        // Hijack Logic (same as before)
        if (planet.gameObject) {
            this.hijackObject(planet.gameObject, startX, startY, 1, false, this.planetContainer);
            this.activeVisuals.push(planet.gameObject as any);
        }
        if (planet.overlayGameObject) {
            this.hijackObject(planet.overlayGameObject, startX, startY, 1.1, false, this.planetContainer);
            this.activeVisuals.push(planet.overlayGameObject as any);
        }

        if (planet.effects) {
            planet.effects.forEach(effect => {
                const e = effect as any;
                if (e.getVisualElements) {
                    const elements = e.getVisualElements();
                    elements.forEach((obj: Phaser.GameObjects.GameObject) => {
                        this.hijackObject(obj, startX, startY, undefined, true, this.planetContainer);
                    });
                } else if (e.graphics) {
                    this.hijackObject(e.graphics, startX, startY, undefined, true, this.planetContainer);
                }

                if (e.setDepth) {
                    if (e.getDepth) {
                        this.originalEffectDepths.set(e, e.getDepth());
                    }
                    e.setDepth(0);
                    this.borrowedEffects.push(e);
                }
            });
        }

        if (planet.emitter) {
            this.borrowedEmitter = planet.emitter;
            this.originalEmitterDepth = planet.emitter.depth;
            this.hijackObject(planet.emitter as any, startX, startY, 11, false, this.planetContainer);
            this.activeVisuals.push(planet.emitter as any);
            planet.emitter.setVisible(true);
        }

        const lockIcon = (planet as any).lockIcon as Phaser.GameObjects.Text;
        if (lockIcon) {
            this.hijackObject(lockIcon, startX, startY, 12, false, this.planetContainer);
            this.activeVisuals.push(lockIcon as any);
        }

        // Name Label
        const nameContainer = this.scene.add.container(startX, startY);
        nameContainer.setDepth(10);
        this.planetContainer.add(nameContainer);
        this.activeVisuals.push(nameContainer);
        this.createStartNamev2(planet, nameContainer);

        // ANIMATION
        const duration = 1000;
        const ease = 'Power2';

        this.scene.tweens.add({
            targets: this.background,
            alpha: 0.8,
            duration: duration,
            ease: ease
        });

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
                if (this.isTyping) {
                    this.startTyping();
                }
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






    // ... (rest of methods)

    private updateLayout(width: number, height: number) {
        // Layout Config
        const margin = 5;

        // Dynamic Sizing based on Planet Visuals
        let planetRadius = 30; // Default fallback (approx 60px height)
        if (this.borrowedPlanet && this.borrowedPlanet.gameObject) {
            const go = this.borrowedPlanet.gameObject as any;
            if (go.displayHeight) {
                planetRadius = go.displayHeight / 2;
            } else if (go.height) {
                planetRadius = (go.height * (go.scaleY || 1)) / 2;
            }
        }

        // Calculate Title Extent (curved text on top)
        let titleTopExtension = 0;
        if (this.borrowedPlanet) {
            const name = this.borrowedPlanet.name.toUpperCase();
            const scale = this.borrowedPlanet.visualScale || 1.0;
            let lines = 1;
            if (scale <= 0.9 && name.includes(' ')) {
                lines = name.split(' ').length;
            }

            // Logic mirroring createStartNamev2 for curved text radius
            const basePlanetRadius = 30;
            const planetVisualRadius = basePlanetRadius * scale;
            const baseRadius = planetVisualRadius + 23;
            // Outermost line radius (lines stack outwards)
            const heightLevel = lines - 1;
            const outerRadius = baseRadius + (heightLevel * 18);

            titleTopExtension = outerRadius + 10; // +10 safety buffer for text height
        }

        // 10px margin from top of Reference (Planet or Title)
        const topElementRadius = Math.max(planetRadius, titleTopExtension);
        const planetY = 10 + topElementRadius;
        this.planetTargetY = planetY;

        // 20px gap between planet bottom and text
        // Planet Bottom is at planetY + planetRadius (ignoring title for bottom gap)
        const textStartY = planetY + planetRadius + 20;

        // Scroll Window / Mask Start
        // We allow text to scroll UP into the planet area to fade out "under" it.
        // Let's start the mask at the planet center (or slightly below header).
        const maskY = planetY;

        const viewportHeight = height - maskY;

        // Position Scroll Container
        // We position the Container at the Mask Start
        this.scrollWindow.setPosition(width / 2, maskY);

        // Update Mask
        this.scrollMaskGraphics.clear();
        this.scrollMaskGraphics.fillStyle(0xffffff, 1);
        // Mask Rect is local to Graphics? No, createGeometryMask uses World Coords usually,
        // but here masking logic can be tricky.
        // Ideally mask covers screen from maskY to height.
        this.scrollMaskGraphics.fillRect(0, maskY, width, viewportHeight);

        // Update Text Width & Margins
        const presetWidth = width - (margin * 2);

        this.textContainer.setFixedSize(presetWidth, 0);
        this.textContainer.setWordWrapWidth(presetWidth);
        this.textContainer.setPadding(0, 0, 0, 0);

        // Recalculate prompt position
        if (!this.isTyping && this.fullText) {
            const textHeight = this.textContainer.height;
            const textY = this.textContainer.y;
            this.promptText.setPosition(0, textY + textHeight + 30);
        }

        // Update Fade
        // Fade covers the area from MaskStart (planetY) to TextStart.
        // This effectively dims text as it moves from "Fully Visible Start" up towards "Behind Planet".
        this.topFade.clear();
        const fadeHeight = textStartY - maskY; // 150 - 75 = 75px
        this.topFade.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 1, 1, 0, 0);
        // Fade is in World Coords (scrollFactor 0)
        this.topFade.fillRect(0, maskY, width, fadeHeight);

        // Ensure Text starts visually at textStartY.
        // Since scrollWindow is at maskY (75), and we want text at 150:
        // Text Local Y = 150 - 75 = 75.
        // We set the textContainer basic position (offset).
        // OR we use padding? No, just set Y.
        this.textContainer.setY(fadeHeight);

        this.clampScroll();
    }

    private planetTargetY: number = 0; // Store for animation usage

    private startTyping() {
        if (this.timerEvent) this.timerEvent.remove();

        this.textContainer.setText("");
        this.scrollContent.y = 0;

        this.timerEvent = this.scene.time.addEvent({
            delay: 50, loop: true,
            callback: () => {
                if (!this.scene || !this.textContainer || !this.textContainer.scene) {
                    if (this.timerEvent) this.timerEvent.remove();
                    return;
                }

                if (this.charIndex < this.fullText.length) {
                    this.currentText += this.fullText[this.charIndex];
                    this.textContainer.setText(this.currentText);
                    this.charIndex++;

                    // Auto-Scroll Logic
                    this.updateAutoScroll();

                } else {
                    this.finishTyping();
                }
            }
        });
    }

    private updateAutoScroll() {
        // Calculate bounds
        const { height } = this.scene.scale;

        // Viewport starts at scrollWindow.y (maskY)
        const maskY = this.scrollWindow.y;
        const viewportHeight = height - maskY;

        // Content Position
        const currentY = this.scrollContent.y; // usually <= 0

        // Bottom of text relative to scrollContent origin
        // textContainer has Y offset (fadeHeight)
        const textBottomLocal = this.textContainer.y + this.textContainer.height;

        // Visible bottom in scrollContent local space is:
        // (viewportHeight - currentY)  <-- maps viewport bottom to local Y
        const visibleBottomLocal = -currentY + viewportHeight;

        // Buffer for comfort
        const buffer = 30;

        // If bottom of text is below visible area, scroll up
        if (textBottomLocal > visibleBottomLocal - buffer) {
            // Target: map textBottomLocal to visibleBottomLocal - buffer
            // textBottomLocal = -targetScroll + viewportHeight - buffer
            // targetScroll = -(textBottomLocal - viewportHeight + buffer)

            const targetScroll = -(textBottomLocal - viewportHeight + buffer);

            // Gentle lerp
            const newY = Phaser.Math.Linear(currentY, targetScroll, 0.1);
            this.scrollContent.y = newY;
        }
    }

    private forceFinishTyping() {
        if (this.timerEvent) this.timerEvent.remove();
        this.textContainer.setText(this.fullText);
        console.log(`Intro Text displayed for planet: ${this.borrowedPlanet?.id}`);
        this.finishTyping();
    }

    private finishTyping() {
        this.isTyping = false;
        if (this.timerEvent) this.timerEvent.remove();

        // Position Prompt Logic
        // The text prompt moves to end of text
        this.promptText.setVisible(true);
        this.promptText.setAlpha(0);

        // Re-layout scrolling content to check bounds
        const textHeight = this.textContainer.height;
        const textY = this.textContainer.y;
        this.promptText.setPosition(0, textY + textHeight + 30); // 30px gap

        this.scene.tweens.add({ targets: this.promptText, alpha: { from: 0, to: 1 }, duration: 500, yoyo: true, repeat: -1 });

        // Auto-scroll to bottom if needed? Or just let user scroll?
        // User requested: "move the Press FIRE at the end of the text and scroll together"
    }

    // --- Input & Scrolling ---

    private handlePointerDown(pointer: Phaser.Input.Pointer) {
        if (!this.visible || this.borrowedPlanet === undefined) return;

        this.isDragging = true;
        this.startPointerPos = { x: pointer.x, y: pointer.y };
        this.lastPointerY = pointer.y;
    }

    private handlePointerMove(pointer: Phaser.Input.Pointer) {
        if (!this.visible || !this.isDragging) return;

        const deltaY = pointer.y - this.lastPointerY;
        this.lastPointerY = pointer.y;

        // Apply drag
        this.scrollContent.y += deltaY;
        this.clampScroll();
    }

    private handlePointerUp(pointer: Phaser.Input.Pointer) {
        if (!this.visible) return;

        // Check if tap (for skip/proceed)
        if (this.isDragging && this.startPointerPos) {
            const dist = Phaser.Math.Distance.Between(this.startPointerPos.x, this.startPointerPos.y, pointer.x, pointer.y);
            if (dist < this.dragThreshold) {
                // Treated as a click/tap
                this.handleTap();
            }
        }

        this.isDragging = false;
        this.startPointerPos = null;
    }

    private handleTap() {
        if (this.isTyping) {
            this.forceFinishTyping();
        } else {
            // Only dismiss if we are done typing
            this.hide();
        }
    }

    private handleSpaceKey() {
        if (!this.visible || this.borrowedPlanet === undefined) return;
        this.handleTap();
    }

    private clampScroll() {
        const { height } = this.scene.scale;
        const maskY = this.scrollWindow.y;

        // Calculate internal offset due to Fade Zone
        const startOffset = this.textContainer.y; // e.g. 75px

        // Content Height: Text + Gap + Prompt + Padding + StartOffset
        const contentHeight = startOffset + this.textContainer.height + 30 + this.promptText.height + 50;

        // Viewport Height
        const viewportHeight = height - maskY;

        if (contentHeight <= viewportHeight) {
            this.scrollContent.y = 0; // No scrolling needed
        } else {
            // Min Scroll needs to allow reaching the bottom.
            // If content is huge, we scroll UP (negative y).
            // Bottom of content at (contentHeight + Y) should be >= ViewportHeight?
            // No, we want to scroll until bottom of content aligns with bottom of viewport.
            // contentHeight + y = viewportHeight
            // y = viewportHeight - contentHeight
            const minScroll = viewportHeight - contentHeight;
            const maxScroll = 0;
            this.scrollContent.y = Phaser.Math.Clamp(this.scrollContent.y, minScroll, maxScroll);
        }
    }

    // --- ---

    private hide() {
        if (!this.borrowedPlanet) return;

        const duration = 800;
        const ease = 'Power2';

        // Fade Out Text Components
        this.scene.tweens.add({
            targets: [this.textContainer, this.promptText, this.background],
            alpha: 0,
            duration: 500,
            ease: ease
        });

        this.scene.tweens.add({
            targets: this.borrowedPlanet,
            x: this.originalState.x,
            y: this.originalState.y,
            duration: duration,
            ease: ease,
            onUpdate: () => {
                if (this.borrowedPlanet) {
                    this.activeVisuals.forEach(obj => {
                        obj.setPosition(this.borrowedPlanet!.x, this.borrowedPlanet!.y);
                    });
                }
            },
            onComplete: () => {
                this.textContainer.setText("");
                this.textContainer.setVisible(false);
                this.setVisible(false);
                this.restorePlanetVisuals();
                this.planetContainer.removeAll(true);
                if (this.onComplete) { this.onComplete(); }
            }
        });
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        if (!this.background || !this.background.scene) return;
        const { width, height } = gameSize;

        if (this.background.setSize) {
            this.background.setSize(width, height);
        }
    }
}
