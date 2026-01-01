import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser globally
vi.mock('phaser', () => {
    return {
        default: {
            Math: {
                Percent: vi.fn(),
            },
            GameObjects: {
                Particles: {
                    ParticleEmitter: class {
                        setDepth = vi.fn();
                        startFollow = vi.fn();
                        destroy = vi.fn();
                    }
                }
            }
        }
    };
});

import { EngineTrail } from '../../../../src/ships/effects/engine-trail';
import Phaser from 'phaser';

describe('EngineTrail', () => {
    let mockShip: any;
    let mockScene: any;
    let mockEmitter: any;

    beforeEach(() => {
        mockEmitter = {
            setDepth: vi.fn(),
            startFollow: vi.fn(),
            destroy: vi.fn(),
        };

        mockScene = {
            add: {
                particles: vi.fn().mockReturnValue(mockEmitter),
            },
        };

        mockShip = {
            sprite: {
                scene: mockScene,
                active: true,
                body: { speed: 100 },
            },
        };
    });

    it('should create emitter and start following', () => {
        new EngineTrail(mockShip);

        expect(mockScene.add.particles).toHaveBeenCalledWith(0, 0, 'flare-white', expect.any(Object));
        expect(mockEmitter.setDepth).toHaveBeenCalledWith(-1);
        expect(mockEmitter.startFollow).toHaveBeenCalledWith(mockShip.sprite);
    });

    it('should destroy emitter', () => {
        const trail = new EngineTrail(mockShip);
        trail.destroy();
        expect(mockEmitter.destroy).toHaveBeenCalled();
    });

    it('should calculate particle properties on emit', () => {
        new EngineTrail(mockShip);
        const config = mockScene.add.particles.mock.calls[0][3];

        // Test callbacks
        expect(config.speed.onEmit()).toBe(100);

        // Mock Percent for other properties
        (Phaser.Math.Percent as any).mockReturnValue(0.5);
        expect(config.lifespan.onEmit()).toBe(1000); // 0.5 * 2000
        expect(config.alpha.onEmit()).toBe(500); // 0.5 * 1000
    });

    it('should handle inactive ship gracefully', () => {
        new EngineTrail(mockShip);
        const config = mockScene.add.particles.mock.calls[0][3];

        mockShip.sprite.active = false;

        expect(config.speed.onEmit()).toBe(0);
        expect(config.lifespan.onEmit()).toBe(0);
        expect(config.alpha.onEmit()).toBe(0);
    });
});
