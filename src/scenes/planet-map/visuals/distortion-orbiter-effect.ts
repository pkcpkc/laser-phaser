import Phaser from 'phaser';
import type { PlanetData } from '../planet-registry';

/**
 * Creates a distortion orbiter effect around a planet.
 * An orbiter circles the planet, and a displacement effect follows it,
 * distorting the planet underneath.
 */
export class DistortionOrbiterEffect {
    private scene: Phaser.Scene;
    private planet: PlanetData;
    private updateListener: () => void;

    // Orbiter visuals
    private orbiter!: Phaser.GameObjects.Image;
    private lensSprite!: Phaser.GameObjects.Image; // Invisible sprite tracking orbiter for displacement source
    private displacementTextureKey: string;

    // Orbit logic
    private orbitRadius: number = 30; // Base radius
    private currentAngle: number = 0;
    private orbitSpeed: number = 0.03;

    // 3D Orbit parameters
    private orbitTilt: number = 0; // Current tilt of the orbit
    private tiltSpeed: number = 0.005; // Speed at which the tilt changes

    // FX
    private displacementFX: Phaser.FX.Displacement | null = null;

    constructor(scene: Phaser.Scene, planet: PlanetData) {
        this.scene = scene;
        this.planet = planet;

        this.displacementTextureKey = 'distortion-lens';
        this.ensureDisplacementTexture();
        this.ensureOrbiterTexture();

        this.createVisuals();
        this.createDisplacementFX();

        this.updateListener = () => this.update();
        this.scene.events.on('update', this.updateListener);
    }

    private ensureDisplacementTexture() {
        if (!this.scene.textures.exists(this.displacementTextureKey)) {
            // Create a radial gradient texture for the lens displacement
            const size = 64; // Size of the distortion "lens"
            const canvas = this.scene.textures.createCanvas(this.displacementTextureKey, size, size);
            if (!canvas) return;

            const context = canvas.context;
            const centerX = size / 2;
            const centerY = size / 2;
            const radius = size / 2;

            // Radial gradient for displacement
            // Center = High red (X shift), Middle Green (Y shift)?
            // Phaser Default Displacement typically uses:
            // Red channel: X displacement
            // Green channel: Y displacement
            // To create a lens/magnify effect, we want vectors pointing OUT from center (or IN).
            // A simple circular white-to-black gradient might not act as a lens without normal map logic,
            // but in Phaser DisplacementFX, 0 is no shift, 1 is max shift.
            // If we use a simple noise or gradient, it "wobbles".

            // Let's try a simple noise-like pattern or just a gradient blob.
            // A gradient blob (White center -> Black edge) causes pixels to shift based on intensity.
            const grd = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            grd.addColorStop(0, '#FFFFFF');
            grd.addColorStop(0.5, '#808080');
            grd.addColorStop(1, '#000000');

            context.fillStyle = grd;
            context.beginPath();
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            context.fill();

            canvas.refresh();
        }
    }

    private ensureOrbiterTexture() {
        if (!this.scene.textures.exists('orbiter-dot')) {
            const graphics = this.scene.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(4, 4, 4);
            graphics.generateTexture('orbiter-dot', 8, 8);
            graphics.destroy();
        }
    }

    private createVisuals() {
        // The visible dot
        this.orbiter = this.scene.add.image(0, 0, 'orbiter-dot');
        this.orbiter.setTint(0xccaa00); // Golden/Energy tint
        this.orbiter.setBlendMode(Phaser.BlendModes.ADD);
        this.orbiter.setDepth(2);

        // The lens source (invisible to camera, but used by FX)
        this.lensSprite = this.scene.add.image(0, 0, this.displacementTextureKey);
        this.lensSprite.setVisible(false); // Can be invisible? logic might require it enabled.
        // If invisible, it might not update transform? 
        // Phaser FX usually needs the source to exist.
        // Let's keep it visible but alpha 0.01 if needed, or just setVisible(false) if passing as config object works.
        // Actually, for addDisplacement(image), the image acts as the map.
        this.lensSprite.setVisible(false);
    }

    private createDisplacementFX() {
        if (!this.planet.gameObject) return;

        const obj = this.planet.gameObject as Phaser.GameObjects.Sprite | Phaser.GameObjects.Image | Phaser.GameObjects.Text;

        if (obj.preFX) {
            // @ts-ignore - Phaser 3.60 accepts GameObject as source for Displacement
            this.displacementFX = obj.preFX.addDisplacement(this.lensSprite as any, 0.15, 0.15);
        }
    }

    private update() {
        if (!this.planet.gameObject || !this.orbiter) return;

        const center = this.planet.gameObject.getCenter();
        const scale = this.planet.visualScale || 1.0;

        // Evolve orbit parameters
        this.currentAngle += this.orbitSpeed;
        this.orbitTilt += this.tiltSpeed;

        // Calculate 3D position
        const radius = this.orbitRadius * scale;

        // Basic circular orbit on XZ plane
        // Speed variation?

        const localX = Math.cos(this.currentAngle) * radius;
        const localZ = Math.sin(this.currentAngle) * radius;
        const localY = 0;

        // Oscillate tilt
        const currentTilt = Math.sin(this.orbitTilt) * (Math.PI / 2.5);

        // Apply tilt rotation around X axis
        const tiltedY = localY * Math.cos(currentTilt) - localZ * Math.sin(currentTilt);
        const tiltedZ = localY * Math.sin(currentTilt) + localZ * Math.cos(currentTilt);

        // Apply rotation around Y axis (precession)
        // Let's add a slow rotation to the entire system so the orbit plane spins
        const precession = this.orbitTilt * 0.3; // Slower than tilt oscillation

        const finalX = localX * Math.cos(precession) + tiltedZ * Math.sin(precession);
        const finalZ = -localX * Math.sin(precession) + tiltedZ * Math.cos(precession);
        const finalY = tiltedY;

        const screenX = center.x + finalX;
        const screenY = center.y + finalY; // Flat projection for now, ignoring perspective Y shift for simplicity of matching lens

        // Update Orbiter Position
        this.orbiter.setPosition(screenX, screenY);
        this.lensSprite.setPosition(screenX, screenY);

        // Depth management
        const isFront = finalZ > 0;
        const planetDepth = this.planet.gameObject.depth || 1;

        // If front, appear above planet. If back, appear behind?
        // Wait, if it's behind, should it distort?
        // Usually distortion implies the object is between viewer and planet (or refraction).
        // Let's say it distorts when in FRONT.
        this.orbiter.setDepth(isFront ? planetDepth + 1 : planetDepth - 1);

        // Scale based on fake depth
        const zScale = 1 + (finalZ / radius) * 0.3;
        this.orbiter.setScale(zScale);
        this.lensSprite.setScale(zScale * 1.5); // Lens is larger than dot

        // Logic: Only apply distortion strength when orbiter is in front of the planet
        if (this.displacementFX) {
            // Smoothly fade distortion in/out based on Z
            // If Z > 0 (front), full strength. If Z < 0 (back), fade to 0.
            const strength = Math.max(0, finalZ / radius) * 0.15;
            this.displacementFX.x = strength;
            this.displacementFX.y = strength;
        }
    }

    public setVisible(visible: boolean) {
        this.orbiter.setVisible(visible);
        // Lens sprite visibility doesn't strictly matter for the FX source usually, 
        // but we keep it sync just in case.
    }

    public destroy() {
        this.scene.events.off('update', this.updateListener);
        this.orbiter.destroy();
        this.lensSprite.destroy();
        // FX is destroyed with parent usually, but good to be safe if we kept ref
        // this.displacementFX?.destroy(); // Not always available on FX
    }
}
