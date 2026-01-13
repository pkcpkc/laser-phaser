import type { ShipDefinition } from '../types';
import { markers as allMarkers } from '../../generated/ships/markers/blood-boss.markers';

export const BloodBossDefinition: ShipDefinition = {
    id: 'blood-boss',
    assetKey: 'ships',
    frame: 'blood-boss',
    assetPath: 'assets/ships/blood-boss.png',
    markers: allMarkers,
    physics: {
        frictionAir: 0.05,
        fixedRotation: false,
        mass: 23 // Heavy boss
    },
    gameplay: {
        health: 150, // Boss health
        rotationSpeed: 0.03 // Slow rotation
    },
    explosion: {
        frame: 'red',
        speed: { min: 50, max: 150 },
        scale: { start: 2.0, end: 0 }, // Large explosion
        lifespan: 1200,
        blendMode: 'ADD'
    }
};
