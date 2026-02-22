import Phaser from 'phaser';

const BLINK_INTERVAL_MIN = 1000;
const BLINK_INTERVAL_MAX = 3500;
const BLINK_DURATION = 150;

const SPEAK_DURATION_MIN = 1000;
const SPEAK_DURATION_MAX = 2500;
const SPEAK_FLICKER_DURATION = 120;

/**
 * Animates a merchant portrait with blink and speak overlays.
 *
 * Convention: the base frame name (e.g. "green-alien") must have two
 * corresponding overlay frames in the same atlas:
 *   - "<base>-eyes"  – closed eyes (used for blinking)
 *   - "<base>-mouth" – open mouth (used for speaking)
 *
 * If either overlay frame is missing, the animator creates no visuals and all
 * animation calls are no-ops — future merchants that don't have overlays yet
 * continue to work without errors.
 */
export class MerchantAnimator {
    private eyesOverlay: Phaser.GameObjects.Image | null = null;
    private mouthOverlay: Phaser.GameObjects.Image | null = null;

    private blinkTimer: Phaser.Time.TimerEvent | null = null;
    private speakTimer: Phaser.Time.TimerEvent | null = null;
    private speakTween: Phaser.Tweens.Tween | null = null;

    private readonly scene: Phaser.Scene;
    private readonly hasOverlays: boolean;

    constructor(
        scene: Phaser.Scene,
        baseFrameName: string,
        x: number,
        y: number,
        container: Phaser.GameObjects.Container | null = null
    ) {
        this.scene = scene;

        const atlas = scene.textures.get('merchants');
        const eyesFrame = `${baseFrameName}-eyes`;
        const mouthFrame = `${baseFrameName}-mouth`;

        this.hasOverlays = !!(atlas && atlas.has(eyesFrame) && atlas.has(mouthFrame));

        if (!this.hasOverlays) {
            return;
        }

        // Eyes overlay — hidden by default; shown during blink
        this.eyesOverlay = scene.add.image(x, y, 'merchants', eyesFrame)
            .setOrigin(0.5)
            .setAlpha(0);

        // Mouth overlay — hidden by default; shown during speak
        this.mouthOverlay = scene.add.image(x, y, 'merchants', mouthFrame)
            .setOrigin(0.5)
            .setAlpha(0);

        if (container) {
            container.add([this.eyesOverlay, this.mouthOverlay]);
        }

        this.scheduleBlink();
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Trigger a brief speaking animation (mouth flicker for ~1.5 s).
     * Safe to call multiple times; restarts the timer if already speaking.
     */
    speak(): void {
        if (!this.hasOverlays || !this.mouthOverlay) return;

        // Clear any existing speak animation
        this.speakTween?.stop();
        this.speakTimer?.remove();

        this.mouthOverlay.setAlpha(1);

        this.speakTween = this.scene.tweens.add({
            targets: this.mouthOverlay,
            alpha: 0.3,
            duration: SPEAK_FLICKER_DURATION,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const speakDuration = Phaser.Math.Between(SPEAK_DURATION_MIN, SPEAK_DURATION_MAX);
        this.speakTimer = this.scene.time.delayedCall(speakDuration, () => {
            this.speakTween?.stop();
            this.mouthOverlay?.setAlpha(0);
        });
    }

    /**
     * Stop all animations and remove overlay images.
     * Must be called before re-rendering to avoid timer leaks.
     */
    destroy(): void {
        this.blinkTimer?.remove();
        this.speakTimer?.remove();
        this.speakTween?.stop();

        this.eyesOverlay?.destroy();
        this.mouthOverlay?.destroy();

        this.blinkTimer = null;
        this.speakTimer = null;
        this.speakTween = null;
        this.eyesOverlay = null;
        this.mouthOverlay = null;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private scheduleBlink(): void {
        if (!this.eyesOverlay) return;

        const delay = Phaser.Math.Between(BLINK_INTERVAL_MIN, BLINK_INTERVAL_MAX);
        this.blinkTimer = this.scene.time.delayedCall(delay, () => this.doBlink());
    }

    private doBlink(): void {
        if (!this.eyesOverlay) return;

        // Flash the eyes overlay in and out
        this.scene.tweens.add({
            targets: this.eyesOverlay,
            alpha: { from: 0, to: 1 },
            duration: BLINK_DURATION / 2,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => this.scheduleBlink()
        });
    }
}
