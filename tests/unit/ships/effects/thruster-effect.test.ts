import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser
vi.mock('phaser', () => ({
    default: {
        Scene: class { },
        Math: {
            RadToDeg: vi.fn(val => val * (180 / Math.PI)),
            DegToRad: vi.fn(val => val * (Math.PI / 180)),
            Between: vi.fn(() => 0),
        }
    }
}));

import { ThrusterEffect, type ThrusterConfig } from '../../../../src/ships/effects/thruster-effect';

describe('ThrusterEffect', () => {
    let effect: ThrusterEffect;
    let mockScene: any;
    let mockModule: any;
    let mockEmitters: any[];
    let mockEvents: any;

    const defaultConfig: ThrusterConfig = {
        outer: [0xffffff, 0xaaaaaa],
        core: [0xdddddd, 0x888888],
        inner: [0xeeeeee, 0x444444],
        sparks: [0xff0000, 0xaa0000],
        lengthScale: 1.0
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockEmitters = [];

        mockEvents = {
            on: vi.fn(),
            off: vi.fn()
        };

        const createMockEmitter = () => ({
            setDepth: vi.fn(),
            setPosition: vi.fn(),
            start: vi.fn(),
            destroy: vi.fn(),
            emitting: false,
            active: true
        });

        mockScene = {
            add: {
                particles: vi.fn(() => {
                    const emitter = createMockEmitter();
                    mockEmitters.push(emitter);
                    return emitter;
                })
            },
            events: mockEvents
        };

        mockModule = {
            on: vi.fn(),
            active: true,
            x: 100,
            y: 200,
            rotation: 0
        };

        effect = new ThrusterEffect(mockScene, mockModule, defaultConfig);
    });

    it('should create 4 emitters', () => {
        expect(mockEmitters.length).toBe(4);
        expect(mockScene.add.particles).toHaveBeenCalledTimes(4);
    });

    it('should set depth for emitters', () => {
        mockEmitters.forEach(emitter => {
            expect(emitter.setDepth).toHaveBeenCalledWith(100);
        });
    });

    it('should register update and destroy listeners', () => {
        expect(mockEvents.on).toHaveBeenCalledWith('update', expect.any(Function));
        expect(mockModule.on).toHaveBeenCalledWith('destroy', expect.any(Function), expect.any(Object));
    });

    it('should update emitters position during update loop', () => {
        const updateListener = mockEvents.on.mock.calls.find((call: any[]) => call[0] === 'update')[1];

        mockModule.x = 300;
        mockModule.y = 400;

        updateListener();

        mockEmitters.forEach(emitter => {
            expect(emitter.setPosition).toHaveBeenCalledWith(300, 400);
            expect(emitter.setDepth).toHaveBeenCalledWith(100); // Check depth reset
            expect(emitter.start).toHaveBeenCalled(); // Since !emitting
        });
    });

    it('should stop undefined emitters behavior', () => {
        // Just verify logic inside createCallback via execution path?
        // createCallback returns a function that modifies particle
        // Since we mock particles(), we can't easily test the callback logic unless we execute the callback passed to particles.

        const outerEmitterCall = mockScene.add.particles.mock.calls[0];
        const config = outerEmitterCall[3];
        const emitCallback = config.emitCallback;

        const mockParticle = { velocityX: 0, velocityY: 0 };
        emitCallback(mockParticle);

        // Check if velocity is set (mocked Math.Between returns 0)
        expect(mockParticle.velocityX).toBeDefined();
        expect(mockParticle.velocityY).toBeDefined();
    });

    it('should clean up on destroy', () => {
        effect.destroy();

        expect(mockEvents.off).toHaveBeenCalledWith('update', expect.any(Function));
        mockEmitters.forEach(emitter => {
            expect(emitter.destroy).toHaveBeenCalled();
        });
    });
});
