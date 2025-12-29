import Phaser from 'phaser';
import type { ShipEffect } from './types';
import { generateAsteroidVertices } from '../definitions/asteroid-small';

export class AsteroidMorphEffect implements ShipEffect {
    private scene: Phaser.Scene;
    private sprite: Phaser.GameObjects.Image | Phaser.Physics.Matter.Image;
    private graphics: Phaser.GameObjects.Graphics;

    private surface: Phaser.GameObjects.Image; // Current visible surface
    private nextSurface: Phaser.GameObjects.Image; // Fading in surface

    private vertices: { x: number, y: number }[] = [];
    private targetVertices: { x: number, y: number }[] = [];
    private radius: number;

    private morphStartTime: number = 0;
    private morphDuration: number = 2000; // Slow shape morph

    private texturePrefix: string;
    private textureCount: number;
    private textureTimer?: Phaser.Time.TimerEvent;

    private rotationOffset: number; // Random initial rotation
    private rotationSpeed: number; // Continuous rotation speed
    private accumulatedRotation: number = 0;

    private updateListener: () => void;

    constructor(
        scene: Phaser.Scene,
        sprite: Phaser.GameObjects.Image | Phaser.Physics.Matter.Image,
        surfaceTexturePrefix: string,
        radius: number = 20,
        textureCount: number = 1
    ) {
        this.scene = scene;
        this.sprite = sprite;
        this.radius = radius;
        this.texturePrefix = surfaceTexturePrefix;
        this.textureCount = textureCount;

        // Random initial rotation for variety
        this.rotationOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
        // Random rotation speed (radians per frame) approx -0.02 to 0.02
        this.rotationSpeed = (Math.random() - 0.5) * 0.04;

        // Hide original sprite (used for physics/collider logic only now)
        // MUST use setAlpha(0) instead of setVisible(false) because Ship.ts stops updating modules (DustDrive) if visible is false.
        this.sprite.setAlpha(0);

        // 1. Create Surface Textures
        // Start with a random frame
        const startIdx = Phaser.Math.Between(0, textureCount - 1);
        const startKey = `${surfaceTexturePrefix}-${startIdx}`;

        this.surface = scene.add.image(sprite.x, sprite.y, startKey);
        this.surface.setDepth(sprite.depth);

        this.nextSurface = scene.add.image(sprite.x, sprite.y, startKey);
        this.nextSurface.setDepth(sprite.depth + 1); // On top
        this.nextSurface.setAlpha(0); // Invisible initially

        // 2. Create Graphics for Mask
        // MUST add to scene to ensure transforms (rotation) are updated correctly by the engine
        this.graphics = scene.add.graphics({ x: 0, y: 0 });
        this.graphics.setVisible(false);

        // 3. Create Mask (Applied to BOTH surfaces)
        const mask = new Phaser.Display.Masks.GeometryMask(scene, this.graphics);
        this.surface.setMask(mask);
        this.nextSurface.setMask(mask);

        // 4. Initial Vertices
        this.vertices = generateAsteroidVertices(radius, 12);
        this.targetVertices = generateAsteroidVertices(radius, 12);
        this.morphStartTime = scene.time.now;

        this.updateListener = () => this.update();
        this.scene.events.on('update', this.updateListener);

        this.sprite.once('destroy', () => this.destroy());

        // Start Texture Morph Loop
        if (textureCount > 1) {
            this.scheduleNextTextureMorph();
        }
    }

    private scheduleNextTextureMorph() {
        if (!this.sprite.active) return;
        this.textureTimer = this.scene.time.addEvent({
            delay: Phaser.Math.Between(200, 500), // Random delay 0.2-0.5s
            callback: () => this.morphTexture()
        });
    }

    private morphTexture() {
        if (!this.sprite.active) return;

        // Pick new texture
        const idx = Phaser.Math.Between(0, this.textureCount - 1);
        const nextKey = `${this.texturePrefix}-${idx}`;

        // Prepare next surface
        this.nextSurface.setTexture(nextKey);
        this.nextSurface.setAlpha(0);

        // Cross-fade
        this.scene.tweens.add({
            targets: this.nextSurface,
            alpha: 1,
            duration: 800, // Faster Fade
            onComplete: () => {
                if (!this.sprite.active) return;
                // Swap: current surface takes the new texture
                this.surface.setTexture(nextKey);
                // Next surface resets to invisible
                this.nextSurface.setAlpha(0);

                this.scheduleNextTextureMorph();
            }
        });
    }

    update() {
        if (!this.sprite.active || !this.surface.active) return;

        const now = this.scene.time.now;

        // Accumulate rotation independent of physics
        this.accumulatedRotation += this.rotationSpeed;

        // Sync Surfaces to Sprite - ALWAYS run this so visual follows physics
        // Apply rotation offset for visual variety
        const effectiveRotation = this.sprite.rotation + this.rotationOffset + this.accumulatedRotation;

        this.surface.setPosition(this.sprite.x, this.sprite.y);
        this.surface.setRotation(effectiveRotation);

        this.nextSurface.setPosition(this.sprite.x, this.sprite.y);
        this.nextSurface.setRotation(effectiveRotation);

        // Sync Graphics (Mask) to Sprite
        // Manual vertex rotation requires graphics rotation to be 0 (relative to parent)
        // or we can just rely on the graphics container being at the right position
        this.graphics.setPosition(this.sprite.x, this.sprite.y);
        // NO: If we manually rotate vertices by 'effectiveRotation', we are rotating by (sprite.rot + offset).
        // So graphics container should have 0 rotation relative to world, or we should subtract sprite.rotation?
        // SAFEST: Set graphics rotation to 0 and manually rotate vertices by effectiveRotation.
        this.graphics.setRotation(0);

        // Calculate Morph Progress (Shape)
        let progress = (now - this.morphStartTime) / this.morphDuration;

        if (progress >= 1) {
            // New Target
            this.vertices = this.targetVertices; // Snap to target
            this.targetVertices = generateAsteroidVertices(this.radius, 12);
            this.morphStartTime = now;
            progress = 0;
        }

        // Draw Mask Shape
        this.graphics.clear();
        this.graphics.beginPath();

        const cos = Math.cos(effectiveRotation);
        const sin = Math.sin(effectiveRotation);

        for (let i = 0; i < this.vertices.length; i++) {
            const start = this.vertices[i];
            const end = this.targetVertices[i];

            // Lerp Radius/Position (Local 0,0 base)
            const lx = start.x + (end.x - start.x) * progress;
            const ly = start.y + (end.y - start.y) * progress;

            // Manual Rotation to match effectiveRotation
            const rx = lx * cos - ly * sin;
            const ry = lx * sin + ly * cos;

            if (i === 0) {
                this.graphics.moveTo(rx, ry);
            } else {
                this.graphics.lineTo(rx, ry);
            }
        }

        this.graphics.closePath();
        this.graphics.fillPath(); // Fill defines the mask area
    }

    destroy() {
        if (this.textureTimer) this.textureTimer.remove();
        if (this.scene) {
            this.scene.events.off('update', this.updateListener);
            this.scene.tweens.killTweensOf(this.nextSurface);
        }
        if (this.surface && this.surface.active) this.surface.destroy();
        if (this.nextSurface && this.nextSurface.active) this.nextSurface.destroy();
        if (this.graphics) this.graphics.destroy();
    }
}
