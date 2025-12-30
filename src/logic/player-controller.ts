import Phaser from 'phaser';
import { Ship } from '../ships/ship';
import { isWeapon } from '../ships/modules/module-types';


// Target Effect Constants
const TARGET_RADIUS = 5;
const TARGET_COLOR = 0x00ff00;
const TARGET_ALPHA = 0.8;
const TARGET_EFFECT_DEPTH = 100;
const TARGET_ANIMATION_SCALE = 4;
const TARGET_ANIMATION_DURATION = 500;
const TARGET_FADE_THRESHOLD = 0.1;

// Movement Constants
const STOP_THRESHOLD = 5;
const TAP_SPEED_MULTIPLIER = 3; // Tap movement is 3x faster than base ship speed
const ACCELERATION = 2.0; // Fast acceleration for tap movement
const DECELERATION = 3.0; // Quick deceleration for snappy stops
const MIN_SPEED = 0.5;
const SCREEN_MARGIN = 30;

const KEYBOARD_THRUST = 0.04;

// Tilt Effect Constants
const TILT_OUT_DURATION = 80; // Duration to return to upright (ms)

export class PlayerController {
    private scene: Phaser.Scene;
    private ship: Ship;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private fireButton: Phaser.GameObjects.Text | null = null;
    private isFiring: boolean = false;
    private lastFired: number = 0;

    private targetPosition: Phaser.Math.Vector2 | null = null;
    private targetEffect: Phaser.GameObjects.Arc | null = null;
    private currentSpeed: number = 0;

    // Tilt effect state
    private currentTiltDirection: 'left' | 'right' | 'none' | 'moving' = 'none';
    private tiltTween: Phaser.Tweens.Tween | null = null;

    constructor(scene: Phaser.Scene, ship: Ship, cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
        this.scene = scene;
        this.ship = ship;
        this.cursors = cursors;

        // Setup input for movement
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Skip if ship is destroyed (game over state)
            if (!this.ship.sprite.active) return;

            // Ignore if clicking on fire button or other interactive UI (if any)
            // Ideally UI stops propagation, but we can check checking ignore here
            // Basic check: if clicking valid world area
            const isUIInteraction = this.isClickingUI(pointer);
            if (!isUIInteraction) {
                this.setTarget(pointer.worldX, pointer.worldY);
            }
        });
    }

    // Helper to check if clicking UI (specifically firebutton for now)
    private isClickingUI(pointer: Phaser.Input.Pointer): boolean {
        if (this.fireButton && this.fireButton.getBounds().contains(pointer.x, pointer.y)) {
            return true;
        }
        return false;
    }

    public setFireButton(fireButton: Phaser.GameObjects.Text) {
        this.fireButton = fireButton;
        this.fireButton.on('pointerdown', () => { this.isFiring = true; })
            .on('pointerup', () => { this.isFiring = false; })
            .on('pointerout', () => { this.isFiring = false; });
    }

    private setTarget(x: number, y: number) {
        this.targetPosition = new Phaser.Math.Vector2(x, y);
        this.showTargetEffect(x, y);
    }

    /**
     * Set the ship's rotation to point toward the movement direction.
     * Uses smooth interpolation (lerp) for continuous updates.
     */
    private pointToAngle(angleRadians: number) {
        if (!this.ship.sprite.active) return; // Skip if ship is destroyed

        // Stop any return-to-upright tween that might be running
        if (this.tiltTween) {
            this.tiltTween.stop();
            this.tiltTween = null;
        }

        // Convert to degrees (no offset needed - ship sprite is already oriented correctly)
        const targetAngleDegrees = Phaser.Math.RadToDeg(angleRadians);

        // Smooth interpolation toward target angle
        const currentAngle = this.ship.sprite.angle;

        // Handle angle wrapping to avoid spinning the long way around
        let diff = targetAngleDegrees - currentAngle;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        // Lerp factor - higher = faster rotation (0.15 = smooth but responsive)
        const lerpFactor = 0.15;
        this.ship.sprite.setAngle(currentAngle + diff * lerpFactor);
    }

    /**
     * Return the ship to upright position (pointing up).
     */
    private returnToUpright() {
        if (this.currentTiltDirection === 'none') return;
        if (!this.ship.sprite.active) return; // Skip if ship is destroyed
        this.currentTiltDirection = 'none';

        // Stop any existing tilt tween
        if (this.tiltTween) {
            this.tiltTween.stop();
            this.tiltTween = null;
        }

        this.tiltTween = this.scene.tweens.add({
            targets: this.ship.sprite,
            angle: -90, // -90 = pointing up (ship sprite orientation)
            duration: TILT_OUT_DURATION,
            ease: 'Power2'
        });
    }

    private showTargetEffect(x: number, y: number) {
        // Destroy existing effect if active to "redirect"
        if (this.targetEffect) {
            this.targetEffect.destroy();
        }

        // Create a visual marker
        this.targetEffect = this.scene.add.circle(x, y, TARGET_RADIUS, TARGET_COLOR, TARGET_ALPHA);
        this.targetEffect.setDepth(TARGET_EFFECT_DEPTH);

        // Simple animation: Expand and fade
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

        // Also keep a persistent small marker or just rely on the pulse?
        // User asked: "visualize the target point with a short effect"
        // So a pulse is good.
    }

    public update(time: number) {
        if (!this.ship.sprite.active) return;

        const { width, height } = this.scene.scale;

        // Keyboard Movement override (optional? keeping it for now as fallback or removing? User said "instead implement point and click")
        // User said "remove the joystick ... instead implement point and click". 
        // I will keep keyboard as debug/alternative but prioritize click.
        // Actually, let's prioritize the target movement.

        let movingWithKeys = false;

        if (this.cursors.left.isDown) {
            this.ship.sprite.thrustLeft(KEYBOARD_THRUST);
            movingWithKeys = true;
        } else if (this.cursors.right.isDown) {
            this.ship.sprite.thrustRight(KEYBOARD_THRUST);
            movingWithKeys = true;
        }
        if (this.cursors.up.isDown) {
            this.ship.sprite.thrust(KEYBOARD_THRUST);
            movingWithKeys = true;
        } else if (this.cursors.down.isDown) {
            this.ship.sprite.thrustBack(KEYBOARD_THRUST);
            movingWithKeys = true;
        }

        // If keys are pressed, cancel target
        if (movingWithKeys) {
            this.targetPosition = null;
        }

        // Target Movement
        if (this.targetPosition && !movingWithKeys) {
            const shipPos = new Phaser.Math.Vector2(this.ship.sprite.x, this.ship.sprite.y);
            const dist = shipPos.distance(this.targetPosition);

            if (dist < STOP_THRESHOLD) {
                // Arrived
                this.ship.sprite.setPosition(this.targetPosition.x, this.targetPosition.y);
                this.ship.sprite.setVelocity(0, 0);
                this.targetPosition = null;

                // Clear effect immediately
                if (this.targetEffect) {
                    this.targetEffect.destroy();
                    this.targetEffect = null;
                }

                // Return to upright when arrived
                this.returnToUpright();
            } else {
                // Move towards target
                const angle = Phaser.Math.Angle.BetweenPoints(shipPos, this.targetPosition);

                // 1. Calculate Braking Distance needed to stop from current speed
                // d = (v^2) / (2 * a)
                const brakingDistance = (this.currentSpeed * this.currentSpeed) / (2 * DECELERATION);

                const isDecelerating = dist <= brakingDistance;

                if (isDecelerating) {
                    // Deceleration Phase - return to upright
                    this.currentSpeed -= DECELERATION;
                    if (this.currentSpeed < MIN_SPEED) this.currentSpeed = MIN_SPEED;
                    this.returnToUpright();
                } else {
                    // Acceleration Phase - point toward target
                    const maxSpeed = this.ship.maxSpeed * TAP_SPEED_MULTIPLIER;
                    if (this.currentSpeed < maxSpeed) {
                        this.currentSpeed += ACCELERATION;
                        if (this.currentSpeed > maxSpeed) this.currentSpeed = maxSpeed;
                    }
                    // Point ship nose toward movement direction
                    this.currentTiltDirection = 'moving'; // Mark as moving to allow pointToAngle
                    this.pointToAngle(angle);
                }

                const velX = Math.cos(angle) * this.currentSpeed;
                const velY = Math.sin(angle) * this.currentSpeed;

                this.ship.sprite.setVelocity(velX, velY);
            }
        }

        // Fire logic
        const firingInterval = this.getEffectiveFiringInterval();
        if (this.scene.input.keyboard!.checkDown(this.cursors.space, firingInterval)) {
            this.fireLaser();
        }

        if (this.isFiring || this.autoFire) {
            if (time > this.lastFired + firingInterval) {
                this.fireLaser();
                this.lastFired = time;
            }
        }

        // Keep ship within game boundaries
        const clampedX = Phaser.Math.Clamp(this.ship.sprite.x, SCREEN_MARGIN, width - SCREEN_MARGIN);
        const clampedY = Phaser.Math.Clamp(this.ship.sprite.y, SCREEN_MARGIN, height - SCREEN_MARGIN);

        if (this.ship.sprite.x !== clampedX || this.ship.sprite.y !== clampedY) {
            this.ship.sprite.setPosition(clampedX, clampedY);
            if (this.ship.sprite.x === clampedX) {
                this.ship.sprite.setVelocityX(0);
            }
            if (this.ship.sprite.y === clampedY) {
                this.ship.sprite.setVelocityY(0);
            }
            // Also clear target if we hit wall
            if (this.targetPosition) {
                // Check if target is outside bounds? nah, just let it slide
            }
        }
    }

    private autoFire: boolean = true;

    /**
     * Get the effective firing interval based on mounted weapons.
     * Uses the slowest (highest) weapon firingDelay.min to respect weapon limits.
     * If no weapon defines firingDelay, fires as fast as possible.
     */
    private getEffectiveFiringInterval(): number {
        let maxInterval = 0; // No limit by default - fire as fast as possible

        for (const module of this.ship.config.modules) {
            const shipModule = new module.module();
            if (isWeapon(shipModule) && shipModule.firingDelay) {
                // Use the minimum delay for maximum fire rate, but respect weapon limits
                maxInterval = Math.max(maxInterval, shipModule.firingDelay.min);
            }
        }

        return maxInterval;
    }

    private fireLaser() {
        if (!this.ship.sprite.active) return;
        this.ship.fireLasers();
    }
}

