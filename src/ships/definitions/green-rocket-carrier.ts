import type { ShipDefinition } from '../types';
import { markers as allMarkers } from '../../generated/green-rocket-carrier.markers';

export const GreenRocketCarrierDefinition: ShipDefinition = {
    id: 'green-rocket-carrier',
    assetKey: 'ships',
    frame: 'green-rocket-carrier',
    assetPath: 'assets/ships/green-rocket-carrier.png',
    markers: allMarkers.map(m => ({ ...m, type: 'rocket' })),
    physics: {
        mass: 40,
        frictionAir: 0,
        fixedRotation: true,
        initialAngle: -90
    },
    gameplay: {
        health: 150,
        speed: 2,
        thrust: 0.15,
        rotationSpeed: 0.04
    },
    explosion: {
        frame: 'green',
        speed: { min: 50, max: 200 },
        scale: { start: 0.7, end: 0 },
        lifespan: 1000,
        blendMode: 'ADD'
    }
};
