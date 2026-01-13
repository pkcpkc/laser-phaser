import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('phaser', () => ({
    default: {
        Math: {
            DegToRad: (deg: number) => deg * Math.PI / 180,
            Between: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
        },
        Physics: {
            Matter: {
                Image: class { }
            }
        }
    }
}));

import { HealthIndicator } from '../../../src/ships/health-indicator';

describe('HealthIndicator', () => {
    let mockScene: any;
    let mockParent: any;
    let mockCombat: any;
    let mockDefinition: any;
    let mockGraphics: any;
    let mockSparkEmitter: any;
    let indicator: HealthIndicator;
    let destroyCallback: (() => void) | null = null;

    beforeEach(() => {
        vi.clearAllMocks();
        destroyCallback = null;

        mockGraphics = {
            setDepth: vi.fn().mockReturnThis(),
            setPosition: vi.fn().mockReturnThis(),
            setAlpha: vi.fn().mockReturnThis(),
            clear: vi.fn().mockReturnThis(),
            lineStyle: vi.fn().mockReturnThis(),
            beginPath: vi.fn().mockReturnThis(),
            arc: vi.fn().mockReturnThis(),
            strokePath: vi.fn().mockReturnThis(),
            destroy: vi.fn()
        };

        mockSparkEmitter = {
            setDepth: vi.fn().mockReturnThis(),
            emitParticleAt: vi.fn(),
            destroy: vi.fn()
        };

        mockScene = {
            add: {
                graphics: vi.fn().mockReturnValue(mockGraphics),
                particles: vi.fn().mockReturnValue(mockSparkEmitter)
            },
            time: {
                now: 0
            },
            events: {
                on: vi.fn(),
                off: vi.fn()
            }
        };

        mockParent = {
            x: 100,
            y: 100,
            displayWidth: 64,
            displayHeight: 64,
            active: true,
            once: vi.fn((event, callback) => {
                if (event === 'destroy') {
                    destroyCallback = callback;
                }
            })
        };

        mockCombat = {
            currentHealth: 100
        };

        mockDefinition = {
            gameplay: { health: 100 }
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create graphics and spark emitter on construction', () => {
        new HealthIndicator(mockScene, mockParent, mockCombat, mockDefinition);

        expect(mockScene.add.graphics).toHaveBeenCalled();
        expect(mockScene.add.particles).toHaveBeenCalled();
        expect(mockGraphics.setDepth).toHaveBeenCalledWith(100);
        expect(mockSparkEmitter.setDepth).toHaveBeenCalledWith(101);
    });

    it('should register update and destroy listeners', () => {
        new HealthIndicator(mockScene, mockParent, mockCombat, mockDefinition);

        expect(mockScene.events.on).toHaveBeenCalledWith('update', expect.any(Function), expect.anything());
        expect(mockParent.once).toHaveBeenCalledWith('destroy', expect.any(Function));
    });

    it('should update graphics position on update', () => {
        indicator = new HealthIndicator(mockScene, mockParent, mockCombat, mockDefinition);

        indicator.update();

        expect(mockGraphics.setPosition).toHaveBeenCalledWith(100, 100);
    });

    it('should set full alpha when recently damaged', () => {
        indicator = new HealthIndicator(mockScene, mockParent, mockCombat, mockDefinition);

        mockScene.time.now = 500;
        indicator.onDamage();

        mockScene.time.now = 600;
        indicator.update();

        expect(mockGraphics.setAlpha).toHaveBeenCalledWith(1);
    });

    it('should set low alpha when not recently damaged', () => {
        indicator = new HealthIndicator(mockScene, mockParent, mockCombat, mockDefinition);

        mockScene.time.now = 2000;
        indicator.update();

        expect(mockGraphics.setAlpha).toHaveBeenCalledWith(0.3);
    });

    it('should animate health decrease over time', () => {
        indicator = new HealthIndicator(mockScene, mockParent, mockCombat, mockDefinition);

        mockCombat.currentHealth = 50;
        indicator.update();
        indicator.update();
        indicator.update();

        expect(mockGraphics.clear).toHaveBeenCalled();
        expect(mockGraphics.arc).toHaveBeenCalled();
    });

    it('should emit sparks when trail is visible', () => {
        indicator = new HealthIndicator(mockScene, mockParent, mockCombat, mockDefinition);

        mockCombat.currentHealth = 50;

        for (let i = 0; i < 20; i++) {
            indicator.update();
        }

        expect(mockSparkEmitter.emitParticleAt).toHaveBeenCalled();
    });

    it('should not update when parent is inactive', () => {
        indicator = new HealthIndicator(mockScene, mockParent, mockCombat, mockDefinition);

        mockParent.active = false;
        mockGraphics.setPosition.mockClear();

        indicator.update();

        expect(mockGraphics.setPosition).not.toHaveBeenCalled();
    });

    it('should clean up resources on destroy', () => {
        new HealthIndicator(mockScene, mockParent, mockCombat, mockDefinition);

        destroyCallback?.();

        expect(mockSparkEmitter.destroy).toHaveBeenCalled();
        expect(mockGraphics.destroy).toHaveBeenCalled();
        expect(mockScene.events.off).toHaveBeenCalledWith('update', expect.any(Function), expect.anything());
    });

    it('should draw health arc with dark red color', () => {
        indicator = new HealthIndicator(mockScene, mockParent, mockCombat, mockDefinition);

        indicator.update();

        expect(mockGraphics.lineStyle).toHaveBeenCalledWith(5, 0x8b0000, 0.8);
    });

    it('should draw burn trail with orange color when health is decreasing', () => {
        indicator = new HealthIndicator(mockScene, mockParent, mockCombat, mockDefinition);

        mockCombat.currentHealth = 50;

        for (let i = 0; i < 30; i++) {
            indicator.update();
        }

        expect(mockGraphics.lineStyle).toHaveBeenCalledWith(5, 0xff6600, 0.9);
    });
});
