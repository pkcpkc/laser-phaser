import Phaser from 'phaser';

export const createFlareTexture = (scene: Phaser.Scene, key: string, color: number) => {
    if (scene.textures.exists(key)) {
        console.log(`Texture ${key} already exists`);
        return;
    }

    try {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            const centerX = 64;
            const centerY = 64;
            const radius = 64;

            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);

            // Convert hex color to RGB for gradient
            const r = (color >> 16) & 255;
            const g = (color >> 8) & 255;
            const b = color & 255;

            // "Hot" core (white)
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            // Transition to color with lower intensity
            gradient.addColorStop(0.1, `rgba(${r}, ${g}, ${b}, 0.5)`);
            // Quick falloff
            gradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, 0.3)`);
            // Soft halo
            gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.05)`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 128, 128);

            scene.textures.addCanvas(key, canvas);
        } else {
            console.error(`Failed to create context for ${key}`);
        }
    } catch (e) {
        console.error(`Error generating texture ${key}:`, e);
    }
};
