import type { ShipDefinition } from '../types';
import { markers as allMarkers } from '../markers-generated/big-cruiser.markers';

export const BigCruiserDefinition: ShipDefinition = {
    id: 'big-cruiser',
    assetKey: 'ships',
    frame: 'big-cruiser',
    assetPath: 'assets/ships/big-cruiser.png',
    markers: allMarkers,
    physics: {
        frictionAir: 0.05,
        fixedRotation: false,
        mass: 5,
        initialAngle: -90
    },
    gameplay: {
        health: 4,
        speed: 12,
        rotationSpeed: 0.08,
        thrust: 0.1
    },
    explosion: {
        frame: 'red', // Default, user can adjust
        speed: { min: 30, max: 100 },
        scale: { start: 0.8, end: 0 },
        lifespan: 800,
        blendMode: 'ADD'
    }
};
