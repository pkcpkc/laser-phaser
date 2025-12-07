import type { ShipDefinition } from '../types';
import { markers as allMarkers } from '../../generated/blood-hunter.markers';

console.log('Evaluating BloodHunterDefinition module');
export const BloodHunterDefinition: ShipDefinition = {
    id: 'blood-hunter',
    assetKey: 'blood-hunter',
    assetPath: 'assets/ships/blood-hunter.png',
    markers: allMarkers,
    physics: {
        frictionAir: 0,
        fixedRotation: true,
        initialAngle: 90
    },
    gameplay: {
        health: 3,
        speed: 2,
        rotationSpeed: 0.1
    },
    explosion: {
        frame: 'red',
        speed: { min: 50, max: 150 },
        scale: { start: 0.4, end: 0 },
        lifespan: 500,
        blendMode: 'ADD'
    }
};
