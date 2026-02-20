import type { IPathSegment, PathSegmentContext } from './types';

export class SinusSegment implements IPathSegment {
    constructor(
        private target: IPathSegment,
        private amplitude: number,
        private frequency: number
    ) { }

    resolve(context: PathSegmentContext): { x: number, y: number } | null {
        return this.target.resolve(context);
    }

    getOffset(context: PathSegmentContext, angle: number): { x: number, y: number } {
        const phase = context.time * this.frequency;
        const waveOffset = Math.sin(phase) * this.amplitude;

        // Perpendicular angle
        const perpAngle = angle + Math.PI / 2;

        return {
            x: Math.cos(perpAngle) * waveOffset,
            y: Math.sin(perpAngle) * waveOffset
        };
    }

    getRotation(context: PathSegmentContext, angle: number): number {
        const phase = context.time * this.frequency;
        // Derivative of sin(f*t) is f*cos(f*t)
        const waveVelocity = this.amplitude * this.frequency * Math.cos(phase);

        // effectiveAngle = angle + atan2(waveVelocity, pathSpeed)
        // pathSpeed is context.speed (px/ms)
        const angleAdjustment = Math.atan2(waveVelocity, context.speed || 0.1);

        return angle + angleAdjustment;
    }

    getSpeedMultiplier(context: PathSegmentContext): number {
        const phase = context.time * this.frequency;
        const waveVelocity = this.amplitude * this.frequency * Math.cos(phase);
        const pathSpeed = context.speed || 0.1;

        // The ship speed along the actual path is sqrt(pathSpeed^2 + waveVelocity^2)
        // We want this to be equal to the desired pathSpeed.
        // So we need to slow down time by the ratio of actual speed to desired speed.
        return Math.sqrt(1 + Math.pow(waveVelocity / pathSpeed, 2));
    }
}
