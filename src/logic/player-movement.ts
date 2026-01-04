import Phaser from 'phaser';
import { Ship } from '../ships/ship';

// Movement Constants
const STOP_THRESHOLD = 5;
const TAP_SPEED_MULTIPLIER = 3; // Tap movement is 3x faster than base ship speed
const ACCELERATION = 2.0; // Fast acceleration for tap movement
const DECELERATION = 3.0; // Quick deceleration for snappy stops
const MIN_SPEED = 0.5;
const KEYBOARD_THRUST = 0.04;

export interface MovementState {
    targetPosition: Phaser.Math.Vector2 | null;
    currentSpeed: number;
    isDragging: boolean;
    isDecelerating: boolean;
    movingWithKeys: boolean;
}

/**
 * Handles player ship movement: target-based (tap/drag) and keyboard controls.
 */
export class PlayerMovement {
    private targetPosition: Phaser.Math.Vector2 | null = null;
    private currentSpeed: number = 0;
    private isDragging: boolean = false;

    constructor(
        private readonly scene: Phaser.Scene,
        private readonly ship: Ship
    ) { }

    get state(): MovementState {
        return {
            targetPosition: this.targetPosition,
            currentSpeed: this.currentSpeed,
            isDragging: this.isDragging,
            isDecelerating: this.isDecelerating(),
            movingWithKeys: false // Updated during update()
        };
    }

    setDragging(dragging: boolean): void {
        this.isDragging = dragging;
    }

    setTarget(x: number, y: number): void {
        const { width, height } = this.scene.scale;

        // Clamp target to screen bounds
        const clampedX = Phaser.Math.Clamp(x, 0, width);
        const clampedY = Phaser.Math.Clamp(y, 0, height);

        this.targetPosition = new Phaser.Math.Vector2(clampedX, clampedY);
    }

    clearTarget(): void {
        this.targetPosition = null;
        this.currentSpeed = 0;
    }

    hasTarget(): boolean {
        return this.targetPosition !== null;
    }

    getTargetPosition(): Phaser.Math.Vector2 | null {
        return this.targetPosition;
    }

    private isDecelerating(): boolean {
        if (!this.targetPosition) return false;

        const shipPos = new Phaser.Math.Vector2(this.ship.sprite.x, this.ship.sprite.y);
        const dist = shipPos.distance(this.targetPosition);
        const brakingDistance = (this.currentSpeed * this.currentSpeed) / (2 * DECELERATION);

        return dist <= brakingDistance;
    }

    /**
     * Process keyboard input. Returns true if any movement keys are pressed.
     */
    updateKeyboard(cursors: Phaser.Types.Input.Keyboard.CursorKeys): boolean {
        let movingWithKeys = false;

        if (cursors.left.isDown) {
            this.ship.sprite.thrustLeft(KEYBOARD_THRUST);
            movingWithKeys = true;
        } else if (cursors.right.isDown) {
            this.ship.sprite.thrustRight(KEYBOARD_THRUST);
            movingWithKeys = true;
        }
        if (cursors.up.isDown) {
            this.ship.sprite.thrust(KEYBOARD_THRUST);
            movingWithKeys = true;
        } else if (cursors.down.isDown) {
            this.ship.sprite.thrustBack(KEYBOARD_THRUST);
            movingWithKeys = true;
        }

        // If keys are pressed, cancel target
        if (movingWithKeys) {
            this.targetPosition = null;
        }

        return movingWithKeys;
    }

    /**
     * Update target-based movement. Returns the movement angle or null if not moving.
     */
    updateTargetMovement(): { arrived: boolean; angle: number | null; isDecelerating: boolean } {
        if (!this.targetPosition) {
            return { arrived: false, angle: null, isDecelerating: false };
        }

        const shipPos = new Phaser.Math.Vector2(this.ship.sprite.x, this.ship.sprite.y);
        const dist = shipPos.distance(this.targetPosition);

        if (dist < STOP_THRESHOLD) {
            // Arrived at destination
            this.ship.sprite.setPosition(this.targetPosition.x, this.targetPosition.y);
            this.ship.sprite.setVelocity(0, 0);
            this.targetPosition = null;
            this.currentSpeed = 0;

            return { arrived: true, angle: null, isDecelerating: false };
        }

        // Move towards target
        const angle = Phaser.Math.Angle.BetweenPoints(shipPos, this.targetPosition);
        const brakingDistance = (this.currentSpeed * this.currentSpeed) / (2 * DECELERATION);
        const isDecelerating = dist <= brakingDistance;

        if (isDecelerating) {
            // Deceleration phase
            this.currentSpeed -= DECELERATION;
            if (this.currentSpeed < MIN_SPEED) this.currentSpeed = MIN_SPEED;
        } else {
            // Acceleration phase
            const maxSpeed = this.ship.maxSpeed * TAP_SPEED_MULTIPLIER;
            if (this.currentSpeed < maxSpeed) {
                this.currentSpeed += ACCELERATION;
                if (this.currentSpeed > maxSpeed) this.currentSpeed = maxSpeed;
            }
        }

        const velX = Math.cos(angle) * this.currentSpeed;
        const velY = Math.sin(angle) * this.currentSpeed;
        this.ship.sprite.setVelocity(velX, velY);

        return { arrived: false, angle, isDecelerating };
    }
}
