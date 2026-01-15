import { describe, it, expect } from 'vitest';
import { CoordinateSegment } from '../../../../../../src/scenes/shoot-em-ups/tactics/path-segments/coordinate-segment';

describe('CoordinateSegment', () => {
    it('should resolve to correct coordinates based on scene scale', () => {
        const segment = new CoordinateSegment(0.5, 0.2);
        const mockContext = {
            scene: {
                scale: {
                    width: 800,
                    height: 600
                }
            } as any,
            currentAnchorX: 0,
            currentAnchorY: 0,
            time: 0,
            speed: 0.1
        };

        const result = segment.resolve(mockContext);
        expect(result).toEqual({ x: 400, y: 120 });
    });
});
