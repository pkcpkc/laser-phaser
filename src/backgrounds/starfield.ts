import Phaser from 'phaser';

export class Starfield {
    private scene: Phaser.Scene;
    private stars: { sprite: Phaser.GameObjects.Image, speed: number }[] = [];

    private nebula!: Phaser.GameObjects.TileSprite;

    private backgroundTexture: string;
    private backgroundFrame?: string;

    constructor(scene: Phaser.Scene, texture: string = 'nebula', frame?: string) {
        this.scene = scene;
        this.backgroundTexture = texture;
        this.backgroundFrame = frame;

        // if (texture === 'backgrounds' && !frame) {
        //     this.backgroundFrame = 'nebula';
        // }

        this.createTexture();
        this.createNebula();
        this.createStars();
    }

    private createTexture() {
        if (!this.scene.textures.exists('star')) {
            const graphics = this.scene.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(0, 0, 2, 2);
            graphics.generateTexture('star', 2, 2);
            graphics.destroy();
        }
    }

    private createNebula() {
        const { width, height } = this.scene.scale;
        this.nebula = this.scene.add.tileSprite(width / 2, height / 2, width, height, this.backgroundTexture, this.backgroundFrame);
        this.nebula.setOrigin(0.5, 0.5);
        this.nebula.setDepth(-2); // Behind stars
        this.nebula.setAlpha(0.5); // Slightly transparent
    }

    private createStars() {
        const { width, height } = this.scene.scale;
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const star = this.scene.add.image(x, y, 'star');
            star.setDepth(-1);
            star.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
            const speed = Phaser.Math.FloatBetween(0.5, 2);
            this.stars.push({ sprite: star, speed });
        }
    }

    update() {
        const { width, height } = this.scene.scale;

        // Scroll nebula
        this.nebula.tilePositionY -= 0.2;

        this.stars.forEach(star => {
            star.sprite.y += star.speed;
            if (star.sprite.y > height) {
                star.sprite.y = 0;
                star.sprite.x = Phaser.Math.Between(0, width);
                star.sprite.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
            }
        });
    }

    destroy() {
        this.nebula.destroy();
        this.stars.forEach(star => star.sprite.destroy());
        this.stars = [];
    }
}
