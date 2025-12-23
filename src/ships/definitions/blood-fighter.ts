import type { ShipDefinition } from '../types';
import { markers as allMarkers } from '../../generated/blood-fighter.markers';

console.log('Evaluating BloodFighterDefinition module');
export const BloodFighterDefinition: ShipDefinition = {
    id: 'blood-fighter',
    assetKey: 'ships',
    frame: 'blood-fighter',
    assetPath: 'assets/ships/blood-fighter.png',
    markers: allMarkers,
    physics: {
        frictionAir: 0,
        fixedRotation: true,
        initialAngle: 90
    },
    gameplay: {
        health: 2,
        speed: 3,
        rotationSpeed: 0.12
    },
    explosion: {
        frame: 'red',
        speed: { min: 50, max: 150 },
        scale: { start: 0.4, end: 0 },
        lifespan: 500,
        blendMode: 'ADD'
    }
};
