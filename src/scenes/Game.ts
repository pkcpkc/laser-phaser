import Phaser from 'phaser';

export default class Game extends Phaser.Scene {
    private ship!: Phaser.Physics.Matter.Image;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private stars: { sprite: Phaser.GameObjects.Image, speed: number }[] = [];

    constructor() {
        super('Game');
    }

    preload() {
        this.load.image('t-ship', 'res/ships/t-ship.png');
        this.load.atlas('space', 'res/assets/space.png', 'res/assets/space.json');
    }

    create() {
        const { width, height } = this.scale;

        // Add t-ship using Matter.js
        this.ship = this.matter.add.image(width * 0.5, height - 50, 't-ship');

        // Configure ship physics
        this.ship.setFixedRotation();
        this.ship.setFrictionAir(0.05);
        this.ship.setMass(30);

        // Set world bounds
        this.matter.world.setBounds(0, 0, width, height);

        // Create particle emitter
        const emitter = this.add.particles(0, 0, 'space', {
            frame: 'blue',
            speed: {
                onEmit: () => (this.ship.body as MatterJS.BodyType).speed
            },
            lifespan: {
                onEmit: () => Phaser.Math.Percent((this.ship.body as MatterJS.BodyType).speed, 0, 300) * 20000
            },
            alpha: {
                onEmit: () => Phaser.Math.Percent((this.ship.body as MatterJS.BodyType).speed, 0, 300) * 1000
            },
            scale: { start: 1.0, end: 0 },
            blendMode: 'ADD'
        });

        emitter.setDepth(-1); // Ensure particles are behind the ship
        emitter.startFollow(this.ship);

        // Generate laser texture
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 4, 4);
        graphics.generateTexture('laser', 4, 4);

        // Generate star texture
        graphics.clear();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 2, 2);
        graphics.generateTexture('star', 2, 2);

        graphics.destroy();

        // Create stars
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const star = this.add.image(x, y, 'star');
            star.setDepth(-1); // Ensure stars are behind everything
            const speed = Phaser.Math.FloatBetween(0.5, 2);
            this.stars.push({ sprite: star, speed });
        }

        // Set up keyboard controls
        this.cursors = this.input.keyboard!.createCursorKeys();
    }

    update() {
        const { width, height } = this.scale;

        // Update stars
        this.stars.forEach(star => {
            star.sprite.y += star.speed;
            if (star.sprite.y > height) {
                star.sprite.y = 0;
                star.sprite.x = Phaser.Math.Between(0, width);
            }
        });

        if (this.cursors.left.isDown) {
            this.ship.thrustBack(0.1);
        } else if (this.cursors.right.isDown) {
            this.ship.thrust(0.1);
        }

        if (this.cursors.up.isDown) {
            this.ship.thrustLeft(0.1);
        } else if (this.cursors.down.isDown) {
            this.ship.thrustRight(0.1);
        }

        if (this.input.keyboard!.checkDown(this.cursors.space, 250)) {
            this.fireLaser();
        }
    }

    private fireLaser() {
        const { x, y } = this.ship;
        const laser = this.matter.add.image(x, y, 'laser');
        laser.setFrictionAir(0);
        laser.setFixedRotation();
        laser.setVelocityY(-10); // Move up

        // Optional: Destroy laser after some time or when out of bounds
        this.time.addEvent({
            delay: 2000,
            callback: () => {
                if (laser.active) laser.destroy();
            }
        });
    }
}
