import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => ({
    default: {
        Scene: class { },
        Geom: {
            Circle: class { constructor(_x: number, _y: number, _r: number) { } }
        },
        Math: {
            Between: vi.fn(() => 0),
        }
    }
}));

// Mock TimeUtils
vi.mock('../../../../src/utils/time-utils', () => ({
    TimeUtils: {
        delayedCall: vi.fn((_scene, _delay, callback) => callback())
    }
}));

import { Explosion } from '../../../../src/ships/effects/explosion';
import { TimeUtils } from '../../../../src/utils/time-utils';

describe('Explosion', () => {
    let mockScene: any;
    let mockEmitters: any[];

    beforeEach(() => {
        vi.clearAllMocks();
        mockEmitters = [];

        const createMockEmitter = () => ({
            setDepth: vi.fn(),
            setPosition: vi.fn(),
            start: vi.fn(),
            explode: vi.fn(),
            destroy: vi.fn(),
            active: true
        });

        mockScene = {
            add: {
                particles: vi.fn(() => {
                    const emitter = createMockEmitter();
                    mockEmitters.push(emitter);
                    return emitter;
                })
            }
        };
    });

    it('should create 3 emitters and explode', () => {
        new Explosion(mockScene, 100, 200, { frame: 'white' });

        expect(mockScene.add.particles).toHaveBeenCalledTimes(3);

        // Emitter and Center explode
        expect(mockEmitters[0].explode).toHaveBeenCalledWith(16, 100, 200);
        expect(mockEmitters[2].explode).toHaveBeenCalledWith(1, 100, 200);

        // Spark emitter starts (continuous for short duration)
        expect(mockEmitters[1].setPosition).toHaveBeenCalledWith(100, 200);
        expect(mockEmitters[1].start).toHaveBeenCalled();
    });

    it('should schedule auto cleanup', () => {
        new Explosion(mockScene, 100, 200, { frame: 'white' });

        expect(TimeUtils.delayedCall).toHaveBeenCalled();
        // Since mock calls callback immediately:
        expect(mockEmitters[0].destroy).toHaveBeenCalled();
        expect(mockEmitters[1].destroy).toHaveBeenCalled();
        expect(mockEmitters[2].destroy).toHaveBeenCalled();
    });
});
