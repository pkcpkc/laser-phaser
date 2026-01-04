import Phaser from 'phaser';

// Tilt Effect Constants
const TILT_OUT_DURATION = 80; // Duration to return to upright (ms)
const LERP_FACTOR = 0.15; // Higher = faster rotation

export type TiltDirection = 'left' | 'right' | 'none' | 'moving';

/**
 * Handles player ship rotation and tilt effects.
 */
export class PlayerRotation {
    private currentTiltDirection: TiltDirection = 'none';
    private tiltTween: Phaser.Tweens.Tween | null = null;

    constructor(
        private readonly scene: Phaser.Scene,
        private readonly sprite: Phaser.Physics.Matter.Image
    ) { }

    get tiltDirection(): TiltDirection {
        return this.currentTiltDirection;
    }

    /**
     * Set the ship's rotation to point toward the movement direction.
     * Uses smooth interpolation (lerp) for continuous updates.
     */
    pointToAngle(angleRadians: number): void {
        if (!this.sprite.active) return;

        // Stop any return-to-upright tween that might be running
        if (this.tiltTween) {
            this.tiltTween.stop();
            this.tiltTween = null;
        }

        // Convert to degrees
        const targetAngleDegrees = Phaser.Math.RadToDeg(angleRadians);
        const currentAngle = this.sprite.angle;

        // Handle angle wrapping to avoid spinning the long way around
        let diff = targetAngleDegrees - currentAngle;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        this.sprite.setAngle(currentAngle + diff * LERP_FACTOR);
        this.currentTiltDirection = 'moving';
    }

    /**
     * Return the ship to upright position (pointing up).
     */
    returnToUpright(): void {
        if (this.currentTiltDirection === 'none') return;
        if (!this.sprite.active) return;

        this.currentTiltDirection = 'none';

        // Stop any existing tilt tween
        if (this.tiltTween) {
            this.tiltTween.stop();
            this.tiltTween = null;
        }

        this.tiltTween = this.scene.tweens.add({
            targets: this.sprite,
            angle: -90, // -90 = pointing up (ship sprite orientation)
            duration: TILT_OUT_DURATION,
            ease: 'Power2'
        });
    }

    /**
     * Mark as moving to allow pointToAngle to work.
     */
    setMoving(): void {
        this.currentTiltDirection = 'moving';
    }

    /**
     * Clean up tweens on destroy.
     */
    destroy(): void {
        if (this.tiltTween) {
            this.tiltTween.stop();
            this.tiltTween = null;
        }
    }
}
