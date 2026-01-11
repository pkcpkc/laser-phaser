
import type { GalaxyConfig } from '../galaxy-config';

export const DemoGalaxyConfig: GalaxyConfig = {
    id: 'demo-galaxy',
    name: 'Demo Galaxy',
    // backgroundTexture defaults to 'nebula' if not specified in Galaxy, 
    // but here we can rely on Galaxy default or specify it if we want.
    // The original class did not set backgroundTexture, so it used default 'nebula' from Galaxy.
    planets: [
        {
            id: 'ship-debug',
            name: 'Ship Debug',
            hidden: false,
            tint: 0xFF5555, // Light Red
            interaction: {
                levelId: 'ship-debug-level',
                showAlways: true
            },
            effects: []
        },
        {
            id: 'astra',
            name: 'Astra',
            hidden: false,
            tint: 0x4488FF, // Blue-ish
            visualScale: 1.0,
            centralPlanet: true,
            interaction: {
                levelId: 'ship-demo-level',
                warpGalaxyId: 'blood-hunters-galaxy', // Warp to Blood Hunter Galaxy
                showAlways: true
            },
            effects: [
                { type: 'hurricane', color: 0xffffff },
                { type: 'hurricane', color: 0xffffff },
                { type: 'hurricane', color: 0xffffff }
            ]
        },
        {
            id: 'aurelia',
            name: 'Aurelia',
            tint: 0xB8860B, // Dark Golden Rod
            visualScale: 0.8,
            interaction: {
                levelId: 'debug-aurelia-level'
            },
            effects: [
                {
                    type: 'solid-ring',
                    color: 0xCC9944,
                    angle: 30,
                    rotation: true
                }
            ]
        },
        {
            id: 'veridia',
            name: 'Veridia',
            tint: 0xeeeeee, // Green-ish
            interaction: {
                levelId: 'debug-veridia-level'
            },
            effects: [
                {
                    type: 'rectangles',
                    rectCount: 55,
                    color: 0xAA00FF, // Purple
                    minSize: 4,
                    maxSize: 6,
                    lightsColor: 0xffff00,
                    clusterCount: 4
                },
                {
                    type: 'satellite',
                    tint: 0xffff00,
                    count: 10
                }
            ]
        },
        {
            id: 'nox',
            name: 'Nox',
            interaction: {
                levelId: 'blood-hunters-level'
            },
            hidden: false,
            visualScale: 1.5, // Smaller? No, 1.5 is bigger usually.
            tint: 0xAA00FF, // Purple
            effects: [
                {
                    type: 'gas-ring',
                    color: 0x33FF33, // Toxic Green
                    angle: 0,
                    lifespan: 2500
                }
            ]
        },
        {
            id: 'crimson',
            name: 'Crimson',
            tint: 0x8B0000, // Dark red
            visualScale: 0.5,
            hidden: false,
            interaction: {
                levelId: 'blood-boss-level',
                hasShipyard: true,
                showAlways: true
            },
            effects: [
                { type: 'mini-moon', tint: 0xFFAAAA, tilt: -60 }, // Light red
                { type: 'mini-moon', tint: 0xFF8888, tilt: 0 },   // Slightly darker
                { type: 'mini-moon', tint: 0xFFCCCC, tilt: 60 }   // Very light
            ]
        },
        {
            id: 'ignis',
            name: 'Ignis',
            tint: 0xaB0000, // Dark red
            visualScale: 1,
            hidden: false,
            interaction: {
                levelId: 'targeting-test-level',
                hasShipyard: true,
                showAlways: true
            },
            effects: [
                {
                    type: 'solar-flare',
                    color: 0xff3300,
                    frequency: 2000,
                    speed: 20
                }
            ]
        },
        {
            id: 'pulsar',
            name: 'Pulsar',
            tint: 0x333333,
            visualScale: 0.6,
            hidden: false,
            interaction: {
                levelId: 'debug-pulsar-level'
            },
            effects: [
                {
                    type: 'ghost-shade',
                    pulse: true,
                    color: 0xFF0000
                }
            ]
        },
        {
            id: 'frost',
            name: 'Frost',
            tint: 0x444444, // Dark Grey
            visualScale: 0.9,
            hidden: true,
            interaction: {
                levelId: 'blood-hunters-level'
            },
            effects: [
                {
                    type: 'glimmering-snow',
                    color: 0xFFFFFF
                }
            ]
        },
        {
            id: 'umbra',
            name: 'Umbra',
            tint: 0x333333,
            visualScale: 0.6,
            hidden: false,
            interaction: {
                levelId: 'debug-umbra-level'
            },
            effects: [
                {
                    type: 'ghost-shade',
                    pulse: false,
                    color: 0xffffff
                }
            ]
        }
    ]
};
