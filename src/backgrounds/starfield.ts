import Phaser from 'phaser';

export class Starfield {
    private scene: Phaser.Scene;
    private stars: { sprite: Phaser.GameObjects.Image, speed: number }[] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createTexture();
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

    private createStars() {
        const { width, height } = this.scene.scale;
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const star = this.scene.add.image(x, y, 'star');
            star.setDepth(-1);
            const speed = Phaser.Math.FloatBetween(0.5, 2);
            this.stars.push({ sprite: star, speed });
        }
    }

    update() {
        const { width, height } = this.scene.scale;
        this.stars.forEach(star => {
            star.sprite.y += star.speed;
            if (star.sprite.y > height) {
                star.sprite.y = 0;
                star.sprite.x = Phaser.Math.Between(0, width);
            }
        });
    }

    destroy() {
        this.stars.forEach(star => star.sprite.destroy());
        this.stars = [];
    }
}
