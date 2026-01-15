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

import { DustExplosion } from '../../../../src/ships/effects/dust-explosion';
import { TimeUtils } from '../../../../src/utils/time-utils';

describe('DustExplosion', () => {
    let mockScene: any;
    let mockEmitters: any[];

    beforeEach(() => {
        vi.clearAllMocks();
        mockEmitters = [];

        const createMockEmitter = () => ({
            setDepth: vi.fn(),
            explode: vi.fn(),
            destroy: vi.fn(),
            active: true
        });

        mockScene = {
            add: {
                graphics: vi.fn().mockReturnValue({
                    fillStyle: vi.fn(),
                    fillCircle: vi.fn(),
                    generateTexture: vi.fn(),
                    destroy: vi.fn()
                }),
                particles: vi.fn(() => {
                    const emitter = createMockEmitter();
                    mockEmitters.push(emitter);
                    return emitter;
                })
            },
            textures: {
                exists: vi.fn().mockReturnValue(false)
            }
        };
    });

    it('should create texture if not exists', () => {
        new DustExplosion(mockScene, 100, 200);
        expect(mockScene.add.graphics).toHaveBeenCalled();
        expect(mockScene.textures.exists).toHaveBeenCalledWith('dust-cloud-particle');
    });

    it('should create 2 emitters and explode', () => {
        new DustExplosion(mockScene, 100, 200);
        expect(mockScene.add.particles).toHaveBeenCalledTimes(2);

        mockEmitters.forEach(emitter => {
            expect(emitter.explode).toHaveBeenCalledWith(expect.any(Number), 100, 200);
        });
    });

    it('should schedule auto cleanup', () => {
        new DustExplosion(mockScene, 100, 200);

        expect(TimeUtils.delayedCall).toHaveBeenCalled();
        // Since mock calls callback immediately:
        expect(mockEmitters[0].destroy).toHaveBeenCalled();
        expect(mockEmitters[1].destroy).toHaveBeenCalled();
    });
});
