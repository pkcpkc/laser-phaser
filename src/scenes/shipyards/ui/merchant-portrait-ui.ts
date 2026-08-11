import Phaser from 'phaser';
import { MerchantAnimator } from '../merchant-animator';

export class MerchantPortraitUI {
    private container!: Phaser.GameObjects.Container;
    private bubbleContainer!: Phaser.GameObjects.Container;
    private bubbleGraphics!: Phaser.GameObjects.Graphics;
    private dialogueText!: Phaser.GameObjects.Text;
    private merchantAnimator: MerchantAnimator | null = null;

    constructor(
        private scene: Phaser.Scene,
        private x: number,
        private y: number,
        private panelWidth: number,
        private shipyardConfig?: { image: string; goods: Record<string, number> }
    ) { }

    public create() {
        this.container = this.scene.add.container(0, 0);

        const portraitEmoji = this.shipyardConfig?.image || '👨‍💼';

        // Check if texture atlas exists
        const hasTexture = this.scene.textures.get('merchants')?.has(portraitEmoji);

        if (hasTexture) {
            // Animated merchant
            const portrait = this.scene.add.image(this.x, this.y, 'merchants', portraitEmoji);
            this.container.add(portrait);

            this.merchantAnimator = new MerchantAnimator(
                this.scene,
                portraitEmoji,
                this.x,
                this.y,
                this.container
            );
        } else {
            // Text fallback (emoji)
            const fallbackText = this.scene.add.text(this.x, this.y, portraitEmoji, {
                fontSize: '64px'
            }).setOrigin(0.5);
            this.container.add(fallbackText);
        }

        // Speech Bubble
        const bubbleX = this.x + 60;
        const bubbleY = this.y - 65;
        const bubbleW = this.panelWidth - 120;
        const bubbleH = 130;

        this.bubbleGraphics = this.scene.add.graphics();
        this.drawSpeechBubble(this.bubbleGraphics, bubbleW, bubbleH);

        this.dialogueText = this.scene.add.text(12, 10, '', {
            fontFamily: 'Oswald, sans-serif',
            fontSize: '14px',
            color: '#00ff88',
            wordWrap: { width: bubbleW - 24 },
            lineSpacing: 2
        });

        this.bubbleContainer = this.scene.add.container(bubbleX, bubbleY, [
            this.bubbleGraphics,
            this.dialogueText
        ]);
        this.container.add(this.bubbleContainer);
    }

    private drawSpeechBubble(graphics: Phaser.GameObjects.Graphics, w: number, h: number) {
        graphics.clear();
        graphics.fillStyle(0x0a111e, 0.9);
        graphics.fillRoundedRect(0, 0, w, h, 8);
        graphics.lineStyle(1.5, 0x00ff88, 0.9);
        graphics.strokeRoundedRect(0, 0, w, h, 8);

        // Triangle pointer pointing left (towards portrait)
        graphics.beginPath();
        graphics.moveTo(0, h / 2 - 6);
        graphics.lineTo(-8, h / 2);
        graphics.lineTo(0, h / 2 + 6);
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();
    }

    public setDialogueText(text: string) {
        if (this.dialogueText) {
            this.dialogueText.setText(text);
        }
        if (this.merchantAnimator) {
            this.merchantAnimator.speak();
        }
    }

    public setVisible(visible: boolean) {
        if (this.container) {
            this.container.setVisible(visible);
        }
    }

    public updatePosition(x: number, y: number, panelWidth: number, isDesktop: boolean) {
        this.x = x;
        this.y = y;
        this.panelWidth = panelWidth;
        
        // Find portrait and move it
        this.container.list.forEach((child) => {
            if (child instanceof Phaser.GameObjects.Image) {
                child.setPosition(x, y);
            } else if (child instanceof Phaser.GameObjects.Text && child !== this.dialogueText) {
                child.setPosition(x, y);
            }
        });

        // Recreate merchant animator overlays at new positions
        if (this.merchantAnimator) {
            this.merchantAnimator.destroy();
            const portraitEmoji = this.shipyardConfig?.image || '👨‍💼';
            this.merchantAnimator = new MerchantAnimator(
                this.scene,
                portraitEmoji,
                x,
                y,
                this.container
            );
        }

        const bubbleW = isDesktop ? (panelWidth - 110) : (panelWidth - 100);
        const bubbleH = isDesktop ? 130 : 90;

        if (this.bubbleGraphics) {
            this.drawSpeechBubble(this.bubbleGraphics, bubbleW, bubbleH);
        }
        if (this.dialogueText) {
            this.dialogueText.setWordWrapWidth(bubbleW - 24);
        }

        if (this.bubbleContainer) {
            // Align the bottom of the speech bubble with the bottom of the merchant (y + 65)
            this.bubbleContainer.setPosition(x + 60, y + 65 - bubbleH);
        }
    }

    // Expose animator for interacting components
    public getAnimator(): MerchantAnimator | null {
        return this.merchantAnimator;
    }
}
