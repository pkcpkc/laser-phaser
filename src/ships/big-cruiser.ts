import type { ShipConfig } from './types';

export const BigCruiser: ShipConfig = {
    id: 'big-cruiser',
    assetKey: 'big-cruiser',
    assetPath: 'res/ships/big-cruiser.png',
    markerPath: 'res/ships/big-cruiser.marker.json',
    physics: {
        mass: 30,
        frictionAir: 0.05,
        fixedRotation: true,
        initialAngle: -90
    },
    gameplay: {
        health: 100, // Placeholder value
        thrust: 0.1,
        rotationSpeed: 0
    }
};
