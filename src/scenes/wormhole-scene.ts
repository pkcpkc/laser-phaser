import Phaser from 'phaser';

interface WarpStar {
    x: number;
    y: number;
    z: number;
    angle: number;
    speed: number;
    color: number;
}

export default class WormholeScene extends Phaser.Scene {
    private stars: WarpStar[] = [];
    private graphics!: Phaser.GameObjects.Graphics;
    private warpSpeed: number = 0; // Starts static
    private galaxyId: string = '';
    private maxSpeed: number = 50;
    private colorIntensity: number = 0; // 0 = White, 1 = Full Color
    private centerMoveIntensity: number = 0; // 0 = Stable, 1 = Dynamic

    private nebulas: Phaser.GameObjects.Image[] = [];

    constructor() {
        super('WormholeScene');
    }

    init(data: { galaxyId: string }) {
        this.galaxyId = data?.galaxyId || 'blood-hunters-galaxy';
    }

    create() {
        const { width, height } = this.scale;

        // Generate Nebula Texture
        this.generateNebulaTexture();

        // Create Nebula Sprites (Background layer)
        for (let i = 0; i < 20; i++) {
            const nebula = this.add.image(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                'nebula-cloud'
            );
            nebula.setBlendMode(Phaser.BlendModes.ADD);
            nebula.setAlpha(0); // Start invisible
            nebula.setScale(Phaser.Math.FloatBetween(2, 4));
            nebula.setDepth(-1); // Behind stars (which are drawn on graphics, so graphics needs higher depth or just draw order)
            // Graphics is always on top of what was added before unless we manage depth. 
            // Actually graphics is added *after* this loop in my proposed order below? 
            // No, graphics was added at start of create.
            // Let me re-order or set depth.

            // Custom properties for movement
            (nebula as any).z = Phaser.Math.FloatBetween(1, 100);
            (nebula as any).speed = Phaser.Math.FloatBetween(0.5, 1.5);
            (nebula as any).baseTint = this.getRandomColor();
            nebula.setTint((nebula as any).baseTint);

            this.nebulas.push(nebula);
        }

        // Graphics on top
        this.graphics = this.add.graphics();
        this.graphics.setDepth(10);

        // Initialize stars
        for (let i = 0; i < 1000; i++) { // Increased count for denser, finer look
            this.stars.push(this.createStar(width, height));
        }

        // Animation Sequence (Total ~5s)

        // 0. Static Start (0 -> 1.0s)
        // Hold static for 1 second

        // 0. Static Start (0 -> 1.0s)
        // Hold static for 1 second

        this.time.delayedCall(1000, () => {
            // 1. Acceleration (1.0s -> 2.5s)
            this.tweens.add({
                targets: this,
                warpSpeed: this.maxSpeed,
                duration: 1500,
                ease: 'Power2'
            });
        });

        // 2. Center Stability & Color (Start changes at 2.0s - overlapping end of accel)
        this.time.delayedCall(2000, () => {
            // Ramp up colors and movement
            this.tweens.add({
                targets: this,
                colorIntensity: 1,
                centerMoveIntensity: 1,
                duration: 500,
                ease: 'Linear'
            });
        });

        // 3. Return to White (At 5.0s)
        // Shifted phases by 1s due to static start
        this.time.delayedCall(5000, () => {
            this.tweens.add({
                targets: this,
                colorIntensity: 0, // Back to white
                // centerMoveIntensity handled in decel phase now
                duration: 1000,
                ease: 'Power2'
            });
        });

        // 4. Deceleration (4.5s -> 6.0s)
        this.time.delayedCall(4500, () => {
            // Smoothly recenter during deceleration
            this.tweens.add({
                targets: this,
                centerMoveIntensity: 0,
                duration: 1500, // Sync with deceleration
                ease: 'Power2'
            });

            this.tweens.add({
                targets: this,
                warpSpeed: 0,
                duration: 1500,
                ease: 'Power2',
                onComplete: () => {
                    this.cameras.main.fade(500, 0, 0, 0, false, (camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
                        void camera;
                        if (progress === 1) {
                            this.scene.start('GalaxyScene', { galaxyId: this.galaxyId });
                        }
                    });
                }
            });
        });
    }

    private generateNebulaTexture() {
        if (this.textures.exists('nebula-cloud')) return;

        const size = 256;
        const canvas = this.textures.createCanvas('nebula-cloud', size, size);
        if (!canvas) return;

        const ctx = canvas.getContext();

        // Create a soft, radial gradient cloud
        const grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grd.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grd.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
        grd.addColorStop(0.8, 'rgba(255, 255, 255, 0.1)');
        grd.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, size, size);

        // Add some noise/texture?
        // Keep it simple and soft for "nebula" feel.

        canvas.refresh();
    }

    private createStar(width: number, height: number): WarpStar {
        return {
            x: Phaser.Math.Between(-width, width),
            y: Phaser.Math.Between(-height, height),
            z: Phaser.Math.Between(1, width), // Depth
            angle: 0,
            speed: 0,
            color: this.getRandomColor()
        };
    }

    private getRandomColor(): number {
        // 15% chance for sparse red-dish colors
        if (Math.random() < 0.15) {
            const redColors = [
                0xFF4500, // Orange Red
                0xDC143C, // Crimson
                0xFF6347  // Tomato
            ];
            return Phaser.Utils.Array.GetRandom(redColors);
        }

        // Image Palette: Cyan, Deep Sky Blue, Teal, Sea Green, Turquoise (Green-Bluish theme)
        const colors = [
            0x00FFFF, // Cyan
            0x00BFFF, // Deep Sky Blue
            0x008080, // Teal
            0x3CB371, // Medium Sea Green
            0x40E0D0  // Turquoise
        ];
        return Phaser.Utils.Array.GetRandom(colors);
    }

    update(time: number, delta: number) {
        // Prevent unused var lints
        void time;

        const { width, height } = this.scale;

        // Wandering Center: Move smoothly around screen center
        // Intensity controls how far it wanders from center
        const maxOffsetX = 100;
        const maxOffsetY = 60;

        const centerX = (width / 2) + (Math.sin(time / 1000) * maxOffsetX * this.centerMoveIntensity);
        const centerY = (height / 2) + (Math.cos(time / 1300) * maxOffsetY * this.centerMoveIntensity);

        // Update Nebulas
        if (this.nebulas.length > 0) {
            this.nebulas.forEach((nebula, index) => {
                void nebula;

                // Make nebulas persistent "tunnel walls"
                // They don't move along Z with speed, they just wobble in place around the tunnel
                // Position is radial from center

                // Initialize properties if missing (or rely on what we set in create)
                // We need to override the previous Z-movement logic

                const baseAngle = (index / this.nebulas.length) * Math.PI * 2;
                const wobble = Math.sin((time / 1000) + (index * 0.5)) * 0.2; // Gentle wobble

                // Place them at a fixed "distance" relative to center, but projected
                // Let's say they exist at a mid-range Z
                const staticZ = 50;
                const perspective = 128 / staticZ;

                // Radius from center
                const tunnelRadius = 300;

                const angle = baseAngle + wobble;

                const targetX = centerX + Math.cos(angle) * tunnelRadius * perspective;
                const targetY = centerY + Math.sin(angle) * tunnelRadius * perspective;

                nebula.setPosition(targetX, targetY);

                // Wobble rotation and scale
                nebula.setRotation(angle + Math.PI / 2 + wobble);
                nebula.setScale((3 + Math.sin(time / 500) * 0.5) * perspective);

                // Alpha controls transparency based on phase
                // Persistent during color phase (intensity 1), invisible otherwise?
                // User said "Start with white stripes only... then colorful". Nebulas are "colorful nebulas".
                // So they fade in with colorIntensity.
                // "More persistent and not flashy" -> smoother alpha transition, closer to 1.
                nebula.setAlpha(this.colorIntensity * 0.6); // Visible but transparent
            });
        }

        this.graphics.clear();

        this.stars.forEach(star => {
            // Move star towards camera (decreasing z)
            star.z -= this.warpSpeed * (delta / 16);

            // Reset star if it passes camera
            if (star.z <= 0) {
                star.z = width;
                star.x = Phaser.Math.Between(-width, width);
                star.y = Phaser.Math.Between(-height, height);
            }

            // Project 3D position to 2D
            // Perspective projection: x2d = x / z
            const perspective = 128 / star.z;
            const x = centerX + star.x * perspective;
            const y = centerY + star.y * perspective;

            // Calculate previous position for streak effect
            const prevPerspective = 128 / (star.z + this.warpSpeed * (delta / 16) * 2); // Multiplier for trail length
            const prevX = centerX + star.x * prevPerspective;
            const prevY = centerY + star.y * prevPerspective;

            // Determine Color: Mix between White (0xFFFFFF) and Star Color
            // If colorIntensity is 0, use White. If 1, use Star Color.
            const color = this.interpolateColor(0xFFFFFF, star.color, this.colorIntensity);

            // Finer stripes: Reduced line width multiplier (min 0.5, max 1)
            const lineWidth = Math.max(0.5, Math.min(1.5, perspective));

            // Draw
            if (this.warpSpeed > 5) {
                // Draw streaks
                this.graphics.lineStyle(lineWidth, color, Math.min(1, perspective * 2));
                this.graphics.beginPath();
                this.graphics.moveTo(prevX, prevY);
                this.graphics.lineTo(x, y);
                this.graphics.strokePath();
            } else {
                // Draw dots (at low speed)
                this.graphics.fillStyle(color, Math.min(1, perspective * 2));
                this.graphics.fillPoint(x, y, lineWidth * 2);
            }
        });
    }

    private interpolateColor(color1: number, color2: number, t: number): number {
        const r1 = (color1 >> 16) & 0xFF;
        const g1 = (color1 >> 8) & 0xFF;
        const b1 = color1 & 0xFF;

        const r2 = (color2 >> 16) & 0xFF;
        const g2 = (color2 >> 8) & 0xFF;
        const b2 = color2 & 0xFF;

        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        return (r << 16) | (g << 8) | b;
    }
}
