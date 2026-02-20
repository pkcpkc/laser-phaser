export interface PathSegmentContext {
    scene: Phaser.Scene;
    currentAnchorX: number;
    currentAnchorY: number;
    time: number;
    speed: number; // Pixels per ms
}

export interface IPathSegment {
    resolve(context: PathSegmentContext): { x: number, y: number } | null;
    getOffset?(context: PathSegmentContext, angle: number): { x: number, y: number };
    getRotation?(context: PathSegmentContext, angle: number): number;
    getSpeedMultiplier?(context: PathSegmentContext, angle: number): number;
}
