import Phaser from 'phaser';
import { Ship } from '../ships/ship';
import { isWeapon } from '../ships/modules/module-types';

/**
 * Handles player weapon firing logic with rate limiting.
 */
export class PlayerFiring {
    private fireButton: Phaser.GameObjects.Text | null = null;
    private isFiring: boolean = false;
    private lastFired: number = 0;
    private autoFire: boolean = true;

    constructor(
        private readonly scene: Phaser.Scene,
        private readonly ship: Ship,
        private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys
    ) { }

    setFireButton(fireButton: Phaser.GameObjects.Text): void {
        this.fireButton = fireButton;
        this.fireButton.on('pointerdown', () => { this.isFiring = true; })
            .on('pointerup', () => { this.isFiring = false; })
            .on('pointerout', () => { this.isFiring = false; });
    }

    getFireButton(): Phaser.GameObjects.Text | null {
        return this.fireButton;
    }

    /**
     * Check if a pointer is clicking the fire button.
     */
    isClickingFireButton(pointer: Phaser.Input.Pointer): boolean {
        if (this.fireButton && this.fireButton.getBounds().contains(pointer.x, pointer.y)) {
            return true;
        }
        return false;
    }

    /**
     * Get the effective firing interval based on mounted weapons.
     * Uses the slowest (highest) weapon firingDelay.min to respect weapon limits.
     * If no weapon defines firingDelay, fires as fast as possible.
     */
    getEffectiveFiringInterval(): number {
        let maxInterval = 0;

        for (const module of this.ship.config.modules) {
            const shipModule = new module.module();
            if (isWeapon(shipModule) && shipModule.firingDelay) {
                maxInterval = Math.max(maxInterval, shipModule.firingDelay.min);
            }
        }

        return maxInterval;
    }

    /**
     * Update firing logic. Should be called each frame.
     */
    update(time: number): void {
        if (!this.ship.sprite.active) return;

        const firingInterval = this.getEffectiveFiringInterval();

        // Space bar firing
        if (this.scene.input.keyboard!.checkDown(this.cursors.space, firingInterval)) {
            this.fireLaser();
        }

        // Button/auto firing
        if (this.isFiring || this.autoFire) {
            if (time > this.lastFired + firingInterval) {
                this.fireLaser();
                this.lastFired = time;
            }
        }
    }

    private fireLaser(): void {
        if (!this.ship.sprite.active) return;
        this.ship.fireLasers();
    }
}
