
// Base interface for all planet effects
export interface PlanetEffectConfig {
    type: string;
    [key: string]: any;
}

export interface PlanetConfig {
    id: string;
    name: string;
    hidden?: boolean; // Defaults to true
    visualScale?: number;
    tint?: number; // Optional color tint

    // Optional initial position (often overridden by layout)
    x?: number;
    y?: number;

    // Configuration Objects
    effects?: PlanetEffectConfig[];
    requiredVictories?: number;

    interaction?: {
        levelId?: string;
        hasShipyard?: boolean;
        warpGalaxyId?: string;
        showAlways?: boolean; // Show shipyard/warp icons even if planet not defeated
    };

    // Central planet flag - if true, this planet is positioned at the center and doesn't orbit
    centralPlanet?: boolean;

    // Positioning persistence defaults
    orbitAngle?: number; // radians
    orbitRadius?: number; // relative distance factor (0 to 1)
    lightPhase?: number;
}

export interface GalaxyConfig {
    id: string;
    name: string;
    backgroundTexture?: string;
    planets: PlanetConfig[];
}
