
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Ship } from '../../src/ships/ship';
// import Phaser from 'phaser';

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Physics: {
                Matter: {
                    Image: class {
                        setAngle = vi.fn();
                        setFixedRotation = vi.fn();
                        setFrictionAir = vi.fn();
                        setMass = vi.fn();
                        setSleepThreshold = vi.fn();
                        setCollisionCategory = vi.fn();
                        setCollidesWith = vi.fn();
                        thrustBack = vi.fn();
                        setOrigin = vi.fn();
                        destroy = vi.fn();
                        active = true;
                        x = 100;
                        y = 100;
                        rotation = 0;
                        scene = {};
                        width = 32;
                        height = 32;
                        setData = vi.fn();
                        setBounce = vi.fn();
                        setSensor = vi.fn();
                        on = vi.fn();
                        once = vi.fn();
                        off = vi.fn();
                        body = { velocity: { x: 0, y: 0 } };
                    }
                }
            }
        }
    };
});

// Mock Everything else needed
class MockPhysicsImage {
    scene: any;
    x: number = 0;
    y: number = 0;
    width: number = 100;
    height: number = 100;
    rotation: number = 0;
    active: boolean = true;
    body = { velocity: { x: 0, y: 0 } };
    setData = vi.fn();
    setAngle = vi.fn();
    setFixedRotation = vi.fn();
    setFrictionAir = vi.fn();
    setMass = vi.fn();
    setSleepThreshold = vi.fn();
    setCollisionCategory = vi.fn();
    setCollidesWith = vi.fn();
    setOrigin = vi.fn();
    setDepth = vi.fn();
    setScale = vi.fn();
    setTint = vi.fn();
    clearTint = vi.fn();
    destroy = vi.fn();
    setVisible = vi.fn();
    addListener = vi.fn();
    on = vi.fn();
    once = vi.fn();
    off = vi.fn();

    constructor(scene: any) {
        this.scene = scene;
    }
}

describe('Ship Damage', () => {
    let ship: Ship;
    let mockScene: any;
    let mockConfig: any;
    let mockCollisionConfig: any;
    let mockSprite: any;

    beforeEach(() => {
        mockSprite = new MockPhysicsImage(null);
        mockScene = {
            matter: {
                add: {
                    image: vi.fn(() => mockSprite)
                }
            },
            add: {
                image: vi.fn(() => ({
                    setRotation: vi.fn(),
                    setDepth: vi.fn(),
                    setScale: vi.fn(),
                    setPosition: vi.fn(),
                    setVisible: vi.fn(),
                    destroy: vi.fn()
                })),
                particles: vi.fn(() => ({
                    createEmitter: vi.fn(),
                    destroy: vi.fn(),
                    setPosition: vi.fn()
                }))
            },
            time: {
                now: 1000,
                delayedCall: vi.fn((_delay, callback) => callback())
            },
            events: {
                on: vi.fn(),
                off: vi.fn(),
                once: vi.fn()
            }
        };
        mockSprite.scene = mockScene;

        mockConfig = {
            definition: {
                assetKey: 'test-ship',
                physics: {},
                markers: [],
                gameplay: {
                    health: 100
                },
                explosion: {
                    type: 'normal'
                }
            }
        };

        mockCollisionConfig = {
            category: 1,
            collidesWith: 2,
            laserCategory: 4,
            laserCollidesWith: 8,
            isEnemy: false
        };

        ship = new Ship(mockScene as any, 0, 0, mockConfig, mockCollisionConfig);
    });

    it('should initialize with correct health', () => {
        expect(ship.currentHealth).toBe(100);
    });

    it('should take damage', () => {
        ship.takeDamage(20);
        expect(ship.currentHealth).toBe(80);
    });

    it('should show visual feedback on damage', () => {
        ship.takeDamage(10);
        expect(mockSprite.setTint).toHaveBeenCalledWith(0xff0000);
        // delayedCall is mocked to run immediately
        expect(mockSprite.clearTint).toHaveBeenCalled();
    });

    it('should explode when health reaches 0', () => {
        const explodeSpy = vi.spyOn(ship, 'explode');
        ship.takeDamage(100);
        expect(ship.currentHealth).toBe(0);
        expect(explodeSpy).toHaveBeenCalled();
    });

    it('should explode when health drops below 0', () => {
        const explodeSpy = vi.spyOn(ship, 'explode');
        ship.takeDamage(150);
        expect(ship.currentHealth).toBe(-50);
        expect(explodeSpy).toHaveBeenCalled();
    });

    it('should not take damage if destroyed', () => {
        ship.destroy();
        ship.takeDamage(10);
        // Health shouldn't change from initial 100 because it returns early
        // Wait, destroy() mechanism might clear refs.
        // But logic is `if (this.isDestroyed || !this.sprite.active) return;`
        // destroy() sets isDestroyed = true.
        expect(ship.currentHealth).toBe(100);
    });
});
