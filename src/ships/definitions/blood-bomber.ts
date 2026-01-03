import type { ShipDefinition } from '../types';
import { markers as allMarkers } from '../../../src-generated/ships/markers/blood-bomber.markers';

export const BloodBomberDefinition: ShipDefinition = {
    id: 'blood-bomber',
    assetKey: 'ships',
    frame: 'blood-bomber',
    assetPath: 'assets/ships/blood-bomber.png',
    markers: allMarkers,
    physics: {
        frictionAir: 0.05,
        fixedRotation: false,
        mass: 16
    },
    gameplay: {
        health: 12,
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
