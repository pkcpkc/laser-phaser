import type { ShipDefinition } from '../types';
import { markers as allMarkers } from '../../generated/ships/markers/big-cruiser.markers';

export const BigCruiserDefinition: ShipDefinition = {
    id: 'big-cruiser',
    assetKey: 'ships',
    frame: 'big-cruiser',
    assetPath: 'assets/ships/big-cruiser.png',
    markers: allMarkers,
    physics: {
        frictionAir: 0.05,
        mass: 20
    },
    gameplay: {
        health: 100,
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
