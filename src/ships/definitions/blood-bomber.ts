import type { ShipDefinition } from '../types';
import { markers as allMarkers } from '../markers-generated/blood-bomber.markers';

export const BloodBomberDefinition: ShipDefinition = {
    id: 'blood-bomber',
    assetKey: 'ships',
    frame: 'blood-bomber',
    assetPath: 'assets/ships/blood-bomber.png',
    markers: allMarkers,
    physics: {
        frictionAir: 0.05,
        fixedRotation: false,
        mass: 8
    },
    gameplay: {
        health: 4,
        rotationSpeed: 0.08
    },
    explosion: {
        frame: 'red', // Default, user can adjust
        speed: { min: 30, max: 100 },
        scale: { start: 0.8, end: 0 },
        lifespan: 800,
        blendMode: 'ADD'
    }
};
