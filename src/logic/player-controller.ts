import Phaser from 'phaser';
import { Ship } from '../ships/ship';
import { BigCruiser } from '../ships/big-cruiser';

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

    constructor(scene: Phaser.Scene, ship: Ship, cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
        this.scene = scene;
        this.ship = ship;
        this.cursors = cursors;

        // Setup input for movement
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
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

    private showTargetEffect(x: number, y: number) {
        // Destroy existing effect if active to "redirect"
        if (this.targetEffect) {
            this.targetEffect.destroy();
        }

        // Create a visual marker
        this.targetEffect = this.scene.add.circle(x, y, 5, 0x00ff00, 0.8);
        this.targetEffect.setDepth(100);

        // Simple animation: Expand and fade
        this.scene.tweens.add({
            targets: this.targetEffect,
            scale: 4,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                if (this.targetEffect && this.targetEffect.alpha <= 0.1) {
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
            this.ship.sprite.thrustLeft(BigCruiser.gameplay.thrust || 0.1);
            movingWithKeys = true;
        } else if (this.cursors.right.isDown) {
            this.ship.sprite.thrustRight(BigCruiser.gameplay.thrust || 0.1);
            movingWithKeys = true;
        }
        if (this.cursors.up.isDown) {
            this.ship.sprite.thrust(BigCruiser.gameplay.thrust || 0.1);
            movingWithKeys = true;
        } else if (this.cursors.down.isDown) {
            this.ship.sprite.thrustBack(BigCruiser.gameplay.thrust || 0.1);
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

            // Hard stop threshold (pixels)
            const stopThreshold = 5;

            if (dist < stopThreshold) {
                // Arrived
                this.ship.sprite.setPosition(this.targetPosition.x, this.targetPosition.y);
                this.ship.sprite.setVelocity(0, 0);
                this.targetPosition = null;

                // Clear effect immediately
                if (this.targetEffect) {
                    this.targetEffect.destroy();
                    this.targetEffect = null;
                }
            } else {
                // Move towards target
                const angle = Phaser.Math.Angle.BetweenPoints(shipPos, this.targetPosition);

                // Kinematic Parameters
                const MAX_SPEED = 6;
                const ACCEL = 0.25;
                const DECEL = 0.3;

                // 1. Calculate Braking Distance needed to stop from current speed
                // d = (v^2) / (2 * a)
                const brakingDistance = (this.currentSpeed * this.currentSpeed) / (2 * DECEL);

                if (dist <= brakingDistance) {
                    // Deceleration Phase
                    // v = sqrt(2 * a * d)
                    // We want to arrive at distance 0 with speed 0. 
                    this.currentSpeed -= DECEL;
                    if (this.currentSpeed < 0.5) this.currentSpeed = 0.5; // Min speed to ensure arrival
                } else {
                    // Acceleration Phase
                    if (this.currentSpeed < MAX_SPEED) {
                        this.currentSpeed += ACCEL;
                        if (this.currentSpeed > MAX_SPEED) this.currentSpeed = MAX_SPEED;
                    }
                }

                const velX = Math.cos(angle) * this.currentSpeed;
                const velY = Math.sin(angle) * this.currentSpeed;

                this.ship.sprite.setVelocity(velX, velY);
            }
        }

        // Fire logic
        if (this.scene.input.keyboard!.checkDown(this.cursors.space, 250)) {
            this.fireLaser();
        }

        if (this.isFiring) {
            if (time > this.lastFired + 250) {
                this.fireLaser();
                this.lastFired = time;
            }
        }

        // Keep ship within game boundaries
        const margin = 30;
        const clampedX = Phaser.Math.Clamp(this.ship.sprite.x, margin, width - margin);
        const clampedY = Phaser.Math.Clamp(this.ship.sprite.y, margin, height - margin);

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

    private fireLaser() {
        if (!this.ship.sprite.active) return;
        this.ship.fireLasers();
    }
}
