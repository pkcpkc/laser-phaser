import Phaser from 'phaser';
import type { IPlanetEffect } from './planet-effect';

export interface PlanetData {
    id: string;
    x: number;
    y: number;
    name: string;
    hidden?: boolean; // Defaults to true
    visualScale?: number;
    tint?: number; // Optional color tint

    // Configuration Objects
    effects?: IPlanetEffect[];
    requiredVictories?: number;

    interaction?: {
        levelId?: string;
        shipyard?: {
            image: string;
            goods: Record<string, number>;
        };
        warpGalaxyId?: string;
        showAlways?: boolean;
    };

    // Central planet flag - if true, this planet is positioned at the center and doesn't orbit
    centralPlanet?: boolean;

    // Runtime references
    gameObject?: Phaser.GameObjects.Text | Phaser.GameObjects.Image;
    overlayGameObject?: Phaser.GameObjects.Text;
    usingOverlay?: boolean;
    isHijacked?: boolean; // True when grabbed by IntroOverlay
    emitter?: Phaser.GameObjects.Particles.ParticleEmitter; // Locked particle effect

    // Positioning persistence
    orbitAngle?: number; // radians
    orbitRadius?: number; // relative distance factor (0 to 1, where 1 is max radius)
    lightPhase?: number; // 0-7, index of moonFrames for lighting calculation
}
