import { describe, it, expect } from 'vitest';
import { SinusSegment } from '../../../../../../src/scenes/shoot-em-ups/tactics/path-segments/sinus-segment';
import { CoordinateSegment } from '../../../../../../src/scenes/shoot-em-ups/tactics/path-segments/coordinate-segment';

describe('SinusSegment', () => {
    it('should resolve to target segment resolution', () => {
        const coord = new CoordinateSegment(0.5, 0.5);
        const sinus = new SinusSegment(coord, 100, 0.01);
        const mockContext = {
            scene: { scale: { width: 800, height: 600 } } as any,
            currentAnchorX: 0,
            currentAnchorY: 0,
            time: 1000,
            speed: 0.1
        };

        const result = sinus.resolve(mockContext);
        expect(result).toEqual({ x: 400, y: 300 });
    });

    it('should calculate perpendicular offset based on sine wave', () => {
        // Amplitude 100, Frequency results in phase PI/2 at some time
        // Let's use 1.0 frequency for simplicity (phase = time)
        // time = PI/2 (~1.57) -> sin(PI/2) = 1.0 -> waveOffset = 100
        const coord = new CoordinateSegment(0, 0);
        const sinus = new SinusSegment(coord, 100, 1.0);

        const mockContext = {
            scene: {} as any,
            currentAnchorX: 0,
            currentAnchorY: 0,
            time: Math.PI / 2,
            speed: 0.1
        };

        // Angle 0 (Right) -> Perpendicular angle PI/2 (Down)
        // Offset should be (0, 100)
        const offset = sinus.getOffset(mockContext, 0);
        expect(offset.x).toBeCloseTo(0, 5);
        expect(offset.y).toBeCloseTo(100, 5);

        // Angle PI/2 (Down) -> Perpendicular angle PI (Left)
        // Offset should be (-100, 0)
        const offset2 = sinus.getOffset(mockContext, Math.PI / 2);
        expect(offset2.x).toBeCloseTo(-100, 5);
        expect(offset2.y).toBeCloseTo(0, 5);
    });

    it('should calculate effective rotation based on wave derivative', () => {
        const coord = new CoordinateSegment(0, 0);
        const sinus = new SinusSegment(coord, 100, 1.0);

        // time = 0 -> cos(0) = 1.0 -> waveVelocity = 100 * 1.0 * 1.0 = 100
        // speed = 100 -> adjustment = atan2(100, 100) = PI/4
        const mockContext = {
            scene: {} as any,
            currentAnchorX: 0,
            currentAnchorY: 0,
            time: 0,
            speed: 100
        };

        const rotation = sinus.getRotation(mockContext, 0);
        expect(rotation).toBeCloseTo(Math.PI / 4, 5);

        // time = PI/2 -> cos(PI/2) = 0 -> waveVelocity = 0 -> adjustment = 0
        const mockContext2 = { ...mockContext, time: Math.PI / 2 };
        const rotation2 = sinus.getRotation(mockContext2, 0);
        expect(rotation2).toBeCloseTo(0, 5);
    });
});
