import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AsteroidFieldFormation } from '../../../../../src/scenes/shoot-em-ups/formations/asteroid-field-formation';
import { Ship } from '../../../../../src/ships/ship';
import Phaser from 'phaser';

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Math: {
                Between: vi.fn(),
                FloatBetween: vi.fn(),
            },
            Time: {
                TimerEvent: class { }
            },
            GameObjects: {
                Image: class { }
            }
        }
    };
});

// Mock Ship
vi.mock('../../../../../src/ships/ship', () => {
    return {
        Ship: class {
            static capturedConfigs: any[] = [];
            sprite: any;
            config: any;
            constructor(_scene: any, _x: any, _y: any, config: any, _collisionConfig: any) {
                this.config = config;
                (this.constructor as any).capturedConfigs.push(config);
                this.sprite = {
                    setData: vi.fn(),
                    setVelocityY: vi.fn(),
                    setVelocity: vi.fn(),
                    setPosition: vi.fn(),
                    setRotation: vi.fn(),
                    active: true,
                    y: 0,
                    x: 0,
                    width: 0,
                    height: 0,
                    destroy: vi.fn(),
                    setCollidesWith: vi.fn(),
                    setCollisionCategory: vi.fn(),
                    setFixedRotation: vi.fn(),
                    setFrictionAir: vi.fn(),
                    setMass: vi.fn(),
                    setSleepThreshold: vi.fn(),
                    setOrigin: vi.fn(),
                    once: vi.fn(),
                    setAngle: vi.fn()
                };
            }
            destroy = vi.fn();
            setEffect = vi.fn();
        }
    };
});

// Mock Effects
vi.mock('../../../../../src/ships/effects/asteroid-morph-effect', () => ({
    AsteroidMorphEffect: class {
        constructor() { }
        destroy() { }
    }
}));

// Mock Constants
vi.mock('../../../../../src/ships/configurations/asteroid-small-dust', () => ({
    SmallAsteroidDustConfig: { definition: { id: 'small', physics: { mass: 1 }, markers: [] }, modules: [] }
}));
vi.mock('../../../../../src/ships/configurations/asteroid-medium-dust', () => ({
    MediumAsteroidDustConfig: { definition: { id: 'medium', physics: { mass: 2 }, markers: [] }, modules: [] }
}));
vi.mock('../../../../../src/ships/configurations/asteroid-large-dust', () => ({
    LargeAsteroidDustConfig: { definition: { id: 'large', physics: { mass: 4 }, markers: [] }, modules: [] }
}));

describe('AsteroidFieldFormation', () => {
    let formation: AsteroidFieldFormation;
    let mockScene: any;
    let mockCollisionConfig: any;

    beforeEach(() => {
        (Ship as any).capturedConfigs = [];
        vi.clearAllMocks();

        mockScene = {
            scale: {
                width: 800,
                height: 600
            },
            time: {
                delayedCall: vi.fn().mockReturnValue({ remove: vi.fn() }),
                now: 1000
            },
            textures: {
                exists: vi.fn().mockReturnValue(true),
                get: vi.fn().mockReturnValue({ has: vi.fn().mockReturnValue(true) })
            },
            matter: {
                add: {
                    image: vi.fn().mockReturnValue({
                        setAngle: vi.fn(),
                        setFixedRotation: vi.fn(),
                        setFrictionAir: vi.fn(),
                        setMass: vi.fn(),
                        setSleepThreshold: vi.fn(),
                        setCollisionCategory: vi.fn(),
                        setCollidesWith: vi.fn(),
                        setOrigin: vi.fn(),
                        setData: vi.fn(),
                        once: vi.fn()
                    })
                }
            },
            events: {
                on: vi.fn(),
                off: vi.fn()
            }
        };

        mockCollisionConfig = { category: 1, collidesWith: 2, isEnemy: true };
    });

    it('should spawn correct number of asteroids', () => {
        (Phaser.Math.Between as any).mockReturnValue(0);
        (Phaser.Math.FloatBetween as any).mockReturnValue(1);

        formation = new AsteroidFieldFormation(mockScene, null, mockCollisionConfig, {
            count: 5,
            spawnWidth: 0.8,
            sizeWeights: { small: 1, medium: 0, large: 0 }
        });

        formation.spawn();
        expect(formation.getEnemies()).toHaveLength(5);
    });

    it('should apply random spawn delay between 100 and 400ms', () => {
        (Phaser.Math.Between as any).mockImplementation((min: number, max: number) => {
            if (min === 100 && max === 400) return 250;
            return 0;
        });
        (Phaser.Math.FloatBetween as any).mockReturnValue(1);

        formation = new AsteroidFieldFormation(mockScene, null, mockCollisionConfig, {
            count: 2,
            spawnWidth: 0.8,
            sizeWeights: { small: 1, medium: 0, large: 0 }
        });

        formation.spawn();
        const enemies = formation.getEnemies();

        // spawnTime = 1000 + 250 = 1250
        expect(enemies[0].spawnTime).toBe(1250);
        expect(Phaser.Math.Between).toHaveBeenCalledWith(100, 400);
    });

    it('should randomize asteroid mass by +/- 15%', () => {
        (Phaser.Math.Between as any).mockReturnValue(0);
        (Phaser.Math.FloatBetween as any).mockImplementation((min: number, max: number) => {
            if (min === 0.85 && max === 1.15) return 1.1; // +10%
            return 1;
        });

        formation = new AsteroidFieldFormation(mockScene, null, mockCollisionConfig, {
            count: 1,
            sizeWeights: { small: 1, medium: 0, large: 0 }
        });

        formation.spawn();

        const captured = (Ship as any).capturedConfigs;
        expect(captured.length).toBe(1);
        const config = captured[0];

        // Base mass for small is 1
        // 1 * 1.1 = 1.1
        expect(config.definition.physics.mass).toBe(1.1);
        expect(Phaser.Math.FloatBetween).toHaveBeenCalledWith(0.85, 1.15);
    });
});
