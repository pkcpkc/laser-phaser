import type { ShipDefinition } from '../types';
import { markers as allMarkers } from '../../generated/ships/markers/blood-fighter.markers';

export const BloodFighterDefinition: ShipDefinition = {
    id: 'blood-fighter',
    assetKey: 'ships',
    frame: 'blood-fighter',
    assetPath: 'assets/ships/blood-fighter.png',
    markers: allMarkers,
    physics: {
        frictionAir: 0.05,
        fixedRotation: false,
        mass: 14
    },
    gameplay: {
        health: 8,
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
