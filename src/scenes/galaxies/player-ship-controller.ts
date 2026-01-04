import { inject } from 'inversify';
import { SceneScoped } from '../../di/decorators';
import Phaser from 'phaser';

/**
 * Manages the player ship game object in the galaxy scene.
 * Handles creation, positioning, and rotation.
 */
@SceneScoped()
export class PlayerShipController {
    private ship!: Phaser.GameObjects.Image;

    constructor(@inject('Scene') private scene: Phaser.Scene) {
    }

    /**
     * Creates the player ship at the origin.
     */
    create(): Phaser.GameObjects.Image {
        this.ship = this.scene.add.image(0, 0, 'ships', 'big-cruiser')
            .setScale(0.4)
            .setAngle(-90)
            .setOrigin(0.5)
            .setDepth(1000);

        return this.ship;
    }

    /**
     * Returns the ship game object.
     */
    getShip(): Phaser.GameObjects.Image {
        return this.ship;
    }

    /**
     * Sets the ship position.
     */
    setPosition(x: number, y: number): void {
        this.ship.setPosition(x, y);
    }

    /**
     * Gets the current ship position.
     */
    getPosition(): { x: number; y: number } {
        return { x: this.ship.x, y: this.ship.y };
    }

    /**
     * Calculates the angle to target and returns the shortest rotation.
     */
    calculateRotationTo(targetX: number, targetY: number): number {
        const targetRotation = Phaser.Math.Angle.Between(
            this.ship.x,
            this.ship.y,
            targetX,
            targetY
        );

        let diff = targetRotation - this.ship.rotation;
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;

        return this.ship.rotation + diff;
    }

    /**
     * Animates the ship to rotate toward a target position.
     */
    rotateTo(targetX: number, targetY: number, duration: number = 500): void {
        const finalRotation = this.calculateRotationTo(targetX, targetY);

        this.scene.tweens.add({
            targets: this.ship,
            rotation: finalRotation,
            duration,
            ease: 'Power2'
        });
    }

    /**
     * Animates the ship to move to a target position.
     */
    moveTo(targetX: number, targetY: number, duration: number = 1000, onComplete?: () => void): void {
        this.scene.tweens.add({
            targets: this.ship,
            x: targetX,
            y: targetY,
            duration,
            ease: 'Power2',
            onComplete
        });
    }

    /**
     * Animates both rotation and movement to target.
     */
    travelTo(targetX: number, targetY: number, onComplete?: () => void): void {
        this.rotateTo(targetX, targetY, 500);
        this.moveTo(targetX, targetY, 1000, onComplete);
    }
}
