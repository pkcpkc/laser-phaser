import type { ShipConfig } from './types';

export const BloodHunter: ShipConfig = {
    id: 'blood-hunter',
    assetKey: 'blood-hunter',
    assetPath: 'res/ships/blood-hunter.png',
    markerPath: 'res/ships/blood-hunter.marker.json', // Note: This file might not exist yet if not generated
    physics: {
        frictionAir: 0,
        fixedRotation: true,
        initialAngle: 90
    },
    gameplay: {
        health: 20, // Placeholder value
        speed: 2 // Vertical speed
    }
};
