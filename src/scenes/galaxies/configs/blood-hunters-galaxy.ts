
import type { GalaxyConfig } from '../galaxy-config';

export const BloodHuntersGalaxyConfig: GalaxyConfig = {
    id: 'blood-hunters-galaxy',
    name: 'Blood Hunters Galaxy',
    backgroundTexture: 'blood_nebula',
    planets: [
        {
            id: 'belt',
            name: 'The Belt',
            hidden: false,
            tint: 0x555555, // Grey rocky color
            visualScale: 0.7,
            centralPlanet: true,
            requiredVictories: 0,
            interaction: { levelId: 'intro-asteroid-level' },
            effects: [
                {
                    type: 'asteroid-belt',
                    color: 0x4a4a4a,
                    asteroidCount: 50,
                    angle: -15
                }
            ]
        },
        {
            id: 'core',
            name: 'Core',
            hidden: true,
            tint: 0xdddddd,
            visualScale: 1.8,
            requiredVictories: 3,
            interaction: { levelId: 'blood-hunters-level' }
        },
        {
            id: 'vortex',
            name: 'Vortex',
            hidden: true,
            tint: 0x880000,
            visualScale: 1.2,
            requiredVictories: 1,
            interaction: { levelId: 'blood-hunters-level' },
            effects: [
                { type: 'hurricane', color: 0xff0000 }
            ]
        },
        {
            id: 'trinity',
            name: 'Trinity',
            hidden: true,
            tint: 0xbb1111,
            visualScale: 0.8,
            requiredVictories: 3,
            interaction: { levelId: 'blood-hunters-level' },
            effects: [
                { type: 'mini-moon', tint: 0xffffff, tilt: -30, scale: 0.2 },
                { type: 'mini-moon', tint: 0x222222, tilt: 20, scale: 0.3 },
                { type: 'mini-moon', tint: 0xbbbbbb, tilt: 60, scale: 0.4 }
            ]
        },
        {
            id: 'halo',
            name: 'Halo',
            hidden: true,
            tint: 0x333333,
            visualScale: 1.0,
            requiredVictories: 2,
            interaction: {
                levelId: 'blood-boss-level',
                warpGalaxyId: 'demo-galaxy'
            },
            effects: [
                { type: 'solid-ring', color: 0xaa0000, angle: 45 }
            ]
        },
        {
            id: 'fragment',
            name: 'Fragment',
            hidden: true,
            tint: 0xff0000,
            visualScale: 1.1,
            requiredVictories: 3,
            interaction: { levelId: 'blood-hunters-level' },
            effects: [
                { type: 'rectangles', color: 0x220000, rectCount: 60 }
            ]
        },
        {
            id: 'spectre',
            name: 'Spectre',
            hidden: true,
            tint: 0x111111,
            visualScale: 0.6,
            requiredVictories: 3,
            interaction: { levelId: 'blood-hunters-level' },
            effects: [
                { type: 'ghost-shade', color: 0xff0000 }
            ]
        }
    ]
};
