import Phaser from 'phaser';
import { Ship } from '../ships/ship';
import { PlayerMovement } from './player-movement';
import { PlayerRotation } from './player-rotation';
import { PlayerFiring } from './player-firing';

// Target Effect Constants
const TARGET_RADIUS = 5;
const TARGET_COLOR = 0x00ff00;
const TARGET_ALPHA = 0.8;
const TARGET_EFFECT_DEPTH = 100;
const TARGET_ANIMATION_SCALE = 4;
const TARGET_ANIMATION_DURATION = 500;
const TARGET_FADE_THRESHOLD = 0.1;

import { injectable, inject } from 'inversify';
import { InjectScene, InjectPlayerCursorKeys } from '../di/decorators';

import type { IPlayerController } from '../di/interfaces/logic';

/**
 * Orchestrates player ship control using composition.
 * Handles input, target effects, and boundary clamping.
 */
@injectable()
export class PlayerController implements IPlayerController {
    private movement: PlayerMovement;
    private rotation: PlayerRotation;
    private firing: PlayerFiring;
    private targetEffect: Phaser.GameObjects.Arc | null = null;

    constructor(
        @InjectScene() private readonly scene: Phaser.Scene,
        @inject(Ship) private readonly ship: Ship,
        @InjectPlayerCursorKeys() private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys
    ) {
        // Initialize components
        this.movement = new PlayerMovement(scene, ship);
        this.rotation = new PlayerRotation(scene, ship.sprite);
        this.firing = new PlayerFiring(scene, ship, cursors);

        // Clean up when ship is destroyed
        this.ship.sprite.once('destroy', this.onDestroy, this);

        // Setup input for movement
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (!this.ship.sprite.active) return;
            if (!this.isClickingUI(pointer)) {
                this.movement.setDragging(true);
                this.handleTargetInput(pointer.worldX, pointer.worldY);
            }
        });

        this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!this.ship.sprite.active) return;
            if (this.movement.state.isDragging) {
                this.handleTargetInput(pointer.worldX, pointer.worldY);
            }
        });

        this.scene.input.on('pointerup', () => {
            this.movement.setDragging(false);
        });
    }

    public onDestroy(): void {
        this.rotation.destroy();

        if (this.targetEffect) {
            this.scene.tweens.killTweensOf(this.targetEffect);
            this.targetEffect.destroy();
            this.targetEffect = null;
        }
    }

    private isClickingUI(pointer: Phaser.Input.Pointer): boolean {
        return this.firing.isClickingFireButton(pointer);
    }

    public setFireButton(fireButton: Phaser.GameObjects.Text): void {
        this.firing.setFireButton(fireButton);
    }

    private handleTargetInput(x: number, y: number): void {
        this.movement.setTarget(x, y);

        const target = this.movement.getTargetPosition();
        if (target) {
            if (this.targetEffect) {
                this.targetEffect.setPosition(target.x, target.y);
            } else {
                this.showTargetEffect(target.x, target.y);
            }
        }
    }

    private showTargetEffect(x: number, y: number): void {
        if (this.targetEffect) {
            this.targetEffect.destroy();
        }

        this.targetEffect = this.scene.add.circle(x, y, TARGET_RADIUS, TARGET_COLOR, TARGET_ALPHA);
        this.targetEffect.setDepth(TARGET_EFFECT_DEPTH);

        this.scene.tweens.add({
            targets: this.targetEffect,
            scale: TARGET_ANIMATION_SCALE,
            alpha: 0,
            duration: TARGET_ANIMATION_DURATION,
            onComplete: () => {
                if (this.targetEffect && this.targetEffect.alpha <= TARGET_FADE_THRESHOLD) {
                    this.targetEffect.destroy();
                    this.targetEffect = null;
                }
            }
        });
    }

    private clearTargetEffect(): void {
        if (this.targetEffect) {
            this.targetEffect.destroy();
            this.targetEffect = null;
        }
    }

    public update(time: number): void {
        if (!this.ship.sprite.active) return;

        const { width, height } = this.scene.scale;

        // Keyboard movement
        const movingWithKeys = this.movement.updateKeyboard(this.cursors);

        // Target movement
        if (!movingWithKeys && this.movement.hasTarget()) {
            const result = this.movement.updateTargetMovement();

            if (result.arrived) {
                this.clearTargetEffect();
                this.rotation.setMoving();
                this.rotation.returnToUpright();
            } else if (result.isDecelerating) {
                this.rotation.returnToUpright();
            } else if (result.angle !== null) {
                this.rotation.pointToAngle(result.angle);
            }
        }

        // Fire logic
        this.firing.update(time);

        // Keep ship's origin within screen bounds
        const clampedX = Phaser.Math.Clamp(this.ship.sprite.x, 0, width);
        const clampedY = Phaser.Math.Clamp(this.ship.sprite.y, 0, height);

        if (this.ship.sprite.x !== clampedX || this.ship.sprite.y !== clampedY) {
            this.ship.sprite.setPosition(clampedX, clampedY);
            if (this.ship.sprite.x === clampedX) {
                this.ship.sprite.setVelocityX(0);
            }
            if (this.ship.sprite.y === clampedY) {
                this.ship.sprite.setVelocityY(0);
            }

            // Stop target movement if we hit a wall
            if (this.movement.hasTarget()) {
                this.movement.clearTarget();
                this.clearTargetEffect();
            }

            // Return to upright when hitting boundary
            this.rotation.setMoving();
            this.rotation.returnToUpright();
        }
    }
}
