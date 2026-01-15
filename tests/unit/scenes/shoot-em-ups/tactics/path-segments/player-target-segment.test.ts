import { describe, it, expect } from 'vitest';
import { PlayerTargetSegment } from '../../../../../../src/scenes/shoot-em-ups/tactics/path-segments/player-target-segment';

describe('PlayerTargetSegment', () => {
    it('should resolve to player position with approach 1.0', () => {
        const segment = new PlayerTargetSegment(1.0);
        const mockScene = {
            ship: {
                sprite: { x: 500, y: 400, active: true }
            },
            scale: { width: 800, height: 600 }
        } as any;

        const mockContext = {
            scene: mockScene,
            currentAnchorX: 100,
            currentAnchorY: 100,
            time: 0,
            speed: 0.1
        };

        const result = segment.resolve(mockContext);
        expect(result).toEqual({ x: 500, y: 400 });
    });

    it('should resolve to partial distance with approach 0.5', () => {
        const segment = new PlayerTargetSegment(0.5);
        const mockScene = {
            ship: {
                sprite: { x: 500, y: 400, active: true }
            },
            scale: { width: 800, height: 600 }
        } as any;

        const mockContext = {
            scene: mockScene,
            currentAnchorX: 100,
            currentAnchorY: 100,
            time: 0,
            speed: 0.1
        };

        const result = segment.resolve(mockContext);
        // Distance is (400, 300). 0.5 * dist = (200, 150).
        // 100 + 200 = 300, 100 + 150 = 250.
        expect(result).toEqual({ x: 300, y: 250 });
    });

    it('should fallback to screen exit if player is missing or inactive', () => {
        const segment = new PlayerTargetSegment(1.0);
        const mockScene = {
            ship: null,
            scale: { width: 800, height: 600 }
        } as any;

        const mockContext = {
            scene: mockScene,
            currentAnchorX: 100,
            currentAnchorY: 100,
            time: 0,
            speed: 0.1
        };

        const result = segment.resolve(mockContext);
        expect(result?.x).toBe(400);
        expect(result?.y).toBeGreaterThan(600);
    });
});
