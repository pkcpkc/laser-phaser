import Phaser from 'phaser';
import type { PlanetData } from '../planet-data';
import type { IPlanetEffect } from '../planet-effect';

export interface TrailPoint {
    x: number;
    y: number;
    // z/depth is sometimes used for sorting, alpha for fading
    alpha: number;
    depth?: number;
}

/**
 * Base class for effects that involve objects orbiting a planet.
 * Provides helper methods for 3D orbit calculation and trail rendering.
 */
export abstract class BaseOrbitEffect implements IPlanetEffect {
    protected scene: Phaser.Scene;
    protected planet: PlanetData;

    // Common orbital constants
    protected readonly PERSPECTIVE_FLATTEN = 0.3;

    constructor(scene: Phaser.Scene, planet: PlanetData) {
        this.scene = scene;
        this.planet = planet;
    }

    public update(_time: number, _delta: number) {
        // Skip update if planet is hidden
        if (this.planet.hidden ?? true) {
            return;
        }
        this.onUpdate();
    }

    abstract onUpdate(): void;

    /**
     * Calculates the screen position and depth properties of an orbiting object.
     * 
     * @param angle Current orbital angle (radians)
     * @param radius Orbital radius (pixels)
     * @param tilt Tilt of the orbital plane (radians, rotation around X axis)
     * @param rotation Rotation of the orbital plane (radians, rotation around Y axis) - optional, default 0
     * @param centerX Planet center X
     * @param centerY Planet center Y
     */
    protected calculateOrbitPosition(
        angle: number,
        radius: number,
        tilt: number,
        rotation: number = 0,
        centerX: number,
        centerY: number
    ) {
        // 1. Start with circular orbit in XZ plane
        const localX = Math.cos(angle) * radius;
        const localZ = Math.sin(angle) * radius;
        const localY = 0;

        // 2. Apply orbital tilt (rotation around X axis)
        const tiltedY = localY * Math.cos(tilt) - localZ * Math.sin(tilt);
        const tiltedZ = localY * Math.sin(tilt) + localZ * Math.cos(tilt);

        // 3. Apply orbital rotation (rotation around Y axis)
        const finalX = localX * Math.cos(rotation) + tiltedZ * Math.sin(rotation);
        const finalZ = -localX * Math.sin(rotation) + tiltedZ * Math.cos(rotation);
        const finalY = tiltedY;

        // 4. Project to 2D Screen Coordinates
        const screenX = centerX + finalX;
        const screenY = centerY + finalY + (finalZ * this.PERSPECTIVE_FLATTEN);

        // 5. Calculate misc props based on Z
        const isFront = finalZ > 0;

        // Scale factor based on Z (simulated depth)
        // Normalized Z: -radius -> 0, +radius -> 1
        const normalizedZ = (finalZ / radius + 1) / 2;

        // Simple depth scale approximation (0.7 to 1.3 range example, or similar)
        // MiniMoon used: 0.8 + (normalizedZ * 0.4) -> 0.8 to 1.2
        // Satellite used: 0.7 + normalizedZ * 0.3 -> 0.7 to 1.0 (wait, check that logic)
        // We will return normalizedZ so subclasses can decide exact scale formula if they want,
        // or provide a standard one.

        return {
            x: screenX,
            y: screenY,
            z: finalZ,
            normalizedZ,
            isFront
        };
    }

    /**
     * Calculates the target depth for an orbiting object based on its position relative to the planet.
     * Ensures objects behind the planet are drawn significantly lower than the planet's depth.
     * 
     * @param baseDepth The base depth assigned to this effect layer
     * @param isFront Whether the object is in front of the planet (z > 0)
     */
    protected getOrbitDepth(baseDepth: number, isFront: boolean): number {
        // Planet is usually at depth 50.
        // Effect layers start around 49, 51, etc.
        // If front: Keep on top of the base layer -> baseDepth + 1.2
        // If back: DROPPING IT LOW. -100 ensures it is behind the planet (50) 
        // regardless of how high the effect stack gets (e.g. effect #5 might be baseDepth ~60).
        return isFront ? baseDepth + 1.2 : baseDepth - 100;
    }

    public setVisible(_visible: boolean) {
        // To be implemented by subclasses or made abstract if needed.
        // But since this implements IPlanetEffect, we probably need it here
        // or leave it to subclasses.
        // We'll mark it as something subclasses MUST implement effectively.
    }

    public destroy() {
        this.onDestroy();
    }

    protected abstract onDestroy(): void;
}
