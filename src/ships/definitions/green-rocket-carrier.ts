import type { ShipDefinition } from '../types';
import { markers as allMarkers } from '../../generated/ships/markers/green-rocket-carrier.markers';

export const GreenRocketCarrierDefinition: ShipDefinition = {
    id: 'green-rocket-carrier',
    assetKey: 'ships',
    frame: 'green-rocket-carrier',
    assetPath: 'assets/ships/green-rocket-carrier.png',
    markers: allMarkers,
    physics: {
        frictionAir: 0.05,
        fixedRotation: false,
        mass: 16
    },
    gameplay: {
        health: 60,
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
