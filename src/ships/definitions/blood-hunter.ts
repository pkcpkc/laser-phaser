import type { ShipDefinition } from '../types';
import { markers as allMarkers } from '../../../src-generated/ships/markers/blood-hunter.markers';

export const BloodHunterDefinition: ShipDefinition = {
    id: 'blood-hunter',
    assetKey: 'ships',
    frame: 'blood-hunter',
    assetPath: 'assets/ships/blood-hunter.png',
    markers: allMarkers,
    physics: {
        frictionAir: 0.05,
        fixedRotation: false,
        mass: 10
    },
    gameplay: {
        health: 3,
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
