import type { ShipDefinition } from '../types';
import { markers as allMarkers } from '../../generated/big-cruiser.markers';

export const BigCruiserDefinition: ShipDefinition = {
    id: 'big-cruiser',
    assetKey: 'ships',
    frame: 'big-cruiser',
    assetPath: 'assets/ships/big-cruiser.png',
    markers: allMarkers,
    physics: {
        mass: 30,
        frictionAir: 0.05,
        fixedRotation: true,
        initialAngle: -90
    },
    gameplay: {
        health: 100,
        speed: 200,
        thrust: 0.2,
        rotationSpeed: 0.05
    },
    explosion: {
        frame: 'white',
        speed: { min: 50, max: 200 },
        scale: { start: 0.6, end: 0 },
        lifespan: 800,
        blendMode: 'ADD'
    }
};
