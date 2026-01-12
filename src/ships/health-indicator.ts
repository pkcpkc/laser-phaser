import Phaser from 'phaser';
import type { ShipCombat } from './ship-combat';
import type { ShipDefinition } from './types';

export class HealthIndicator {
    private graphics: Phaser.GameObjects.Graphics;
    private lastDamageTime: number = -1000;

    constructor(
        private readonly scene: Phaser.Scene,
        private readonly parent: Phaser.Physics.Matter.Image,
        private readonly combat: ShipCombat,
        private readonly definition: ShipDefinition
    ) {
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(100);

        // Register update listener
        this.scene.events.on('update', this.update, this);
        this.parent.once('destroy', () => this.destroy());
    }

    onDamage(): void {
        this.lastDamageTime = this.scene.time.now;
        // No explicit redraw needed here as update() runs every frame and handles alpha/redrawing if needed,
        // BUT since we only draw when properties change, forcing a redraw or relying on update loop is fine.
        // Given existing logic, we only redraw when health changes? Or every frame?
        // Original code redrew on updateHealthBar() called from takeDamage() AND updated position in update().
        // Let's keep it efficient: update position and alpha every frame, redraw graphics only when needed?
        // Actually, the previous implementation redrew every frame effectively? No, `updateHealthBar` was called in `takeDamage`.
        // `updateHealthBarPosition` was called in loop.
        // But `updateHealthBarPosition` also updated alpha.
        // So we need to separate:
        // 1. Position/Alpha update (every frame)
        // 2. Geometry redraw (on damage/init)
    }

    update(): void {
        if (!this.graphics || !this.parent.active) return;

        // Position at ship center
        this.graphics.setPosition(this.parent.x, this.parent.y);

        // Update alpha based on time since last damage
        const timeSinceDamage = this.scene.time.now - this.lastDamageTime;
        const targetAlpha = timeSinceDamage < 1000 ? 1 : 0.3;
        this.graphics.setAlpha(targetAlpha);

        // We also need to ensure the arc reflects current health.
        // Redrawing every frame is simplest for "live" bars, but optimization: only redraw if dirty?
        // For now, let's redraw every frame to ensure smooth animation if we had it, but mostly to keep it simple.
        // Wait, the original code ONLY called `updateHealthBar` (redraw) on `takeDamage`.
        // So we should expose a method or check if health changed?
        // Actually, if we want to be clean: redraw on damage.

        // HOWEVER, if we redraw ONLY on damage, we might miss initialization or resize?
        // Let's add a public redraw method cause `onDamage` implies just the event.
    }

    redraw(): void {
        if (!this.graphics) return;

        const maxHealth = this.definition.gameplay.health;
        const currentHealth = Math.max(0, this.combat.currentHealth);
        const percent = currentHealth / maxHealth;

        this.graphics.clear();

        const radius = (Math.max(this.parent.displayWidth, this.parent.displayHeight) * 0.35);
        const thickness = 5;
        const startAngle = Phaser.Math.DegToRad(-90);
        const endAngle = Phaser.Math.DegToRad(-90 + (360 * percent));

        this.graphics.lineStyle(thickness, 0x8b0000, 0.8);
        this.graphics.beginPath();
        this.graphics.arc(0, 0, radius, startAngle, endAngle, false);
        this.graphics.strokePath();
    }

    destroy(): void {
        if (this.graphics) {
            this.graphics.destroy();
        }
        if (this.scene) {
            this.scene.events.off('update', this.update, this);
        }
    }
}
