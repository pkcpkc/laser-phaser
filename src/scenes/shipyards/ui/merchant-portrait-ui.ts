import Phaser from 'phaser';
import { MerchantAnimator } from '../merchant-animator';

export class MerchantPortraitUI {
    private merchantAnimator: MerchantAnimator | null = null;

    constructor(
        private scene: Phaser.Scene,
        private x: number,
        private y: number,
        private shipyardConfig?: { image: string; goods: Record<string, number> }
    ) { }

    public create() {
        const portraitEmoji = this.shipyardConfig?.image || '👨‍💼';

        const merchantsAtlas = this.scene.textures.get('merchants');
        if (merchantsAtlas && merchantsAtlas.has(portraitEmoji)) {
            this.scene.add.image(this.x, this.y, 'merchants', portraitEmoji).setOrigin(0.5);
            this.merchantAnimator = new MerchantAnimator(
                this.scene,
                portraitEmoji,
                this.x,
                this.y
            );
        } else {
            this.scene.add.text(this.x, this.y, portraitEmoji, { fontSize: '48px' }).setOrigin(0.5);
        }
    }

    // Expose animator for interacting components
    public getAnimator(): MerchantAnimator | null {
        return this.merchantAnimator;
    }
}
