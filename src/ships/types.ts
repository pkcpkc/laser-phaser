export interface ShipPhysicsConfig {
    mass?: number;
    frictionAir?: number;
    fixedRotation?: boolean;
    initialAngle?: number;
}

export interface ShipGameplayConfig {
    health: number;
    speed?: number;
    thrust?: number;
    rotationSpeed?: number;
}

export interface ShipConfig {
    id: string;
    assetKey: string;
    assetPath: string;
    markerPath: string;
    physics: ShipPhysicsConfig;
    gameplay: ShipGameplayConfig;
}
