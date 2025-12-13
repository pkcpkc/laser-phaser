import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShootEmUpScene } from '../../src/scenes/shoot-em-ups/shoot-em-up-scene';
import { Level } from '../../src/levels/level';

const MockPhaser = vi.hoisted(() => {
    const mock = {
        Scene: class {
            sys = { settings: { key: 'TestScene' } };
            add = {
                text: vi.fn(),
                image: vi.fn()
            };
            scale = { width: 800, height: 600, on: vi.fn() };
            game = { canvas: { style: {} } };
            textures = { exists: vi.fn().mockReturnValue(true) };
            input = {
                addPointer: vi.fn(),
                keyboard: { once: vi.fn(), createCursorKeys: vi.fn(), on: vi.fn() }
            };
            matter = {
                world: {
                    setBounds: vi.fn(),
                    nextCategory: vi.fn().mockReturnValue(1),
                    on: vi.fn()
                }
            };
            create() { }
            update() { }
        },
        GameObjects: {
            Image: class { },
            Text: class { },
            Container: class { },
        },
        Physics: {
            Matter: {
                Image: class { },
                Sprite: class { }
            }
        },
        Input: {
            Keyboard: {
                Key: class { },
                KeyCodes: { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39 }
            }
        },
        Utils: {
            Objects: {
                GetValue: vi.fn((source, key, defaultValue) => source ? source[key] || defaultValue : defaultValue)
            }
        },
        Math: {
            Vector2: class { },
            Between: vi.fn(),
            FloatBetween: vi.fn(),
            Distance: {
                Between: vi.fn()
            },
            Angle: {
                Between: vi.fn()
            }
        },
        Geom: {
            Circle: class {
                static Contains = vi.fn();
            },
            Rectangle: class {
                static Contains = vi.fn();
            }
        }
    };
    (global as any).Phaser = mock; // Assign to global immediately
    return mock;
});

// Mock Phaser completely to avoid device feature detection side effects
vi.mock('phaser', () => {
    return {
        default: MockPhaser
    };
});

// Mock Level
vi.mock('../../src/levels/level', () => {
    return {
        // Use a function declaration so it can be called with 'new'
        Level: vi.fn(function () {
            return {
                start: vi.fn(),
                update: vi.fn(),
                destroy: vi.fn()
            };
        })
    };
});

// Concrete class for testing abstract base
class TestScene extends ShootEmUpScene {
    constructor() {
        super('TestScene');
    }
    protected getLevelClass() {
        return class { }; // Mock config class
    }
}

describe('ShootEmUpScene', () => {
    let scene: TestScene;

    beforeEach(() => {
        // Mock phaser scene context
        scene = new TestScene();
        scene.sys = {
            settings: { key: 'TestScene' }
        } as any;

        const mockGameObject = {
            setOrigin: vi.fn().mockReturnThis(),
            setInteractive: vi.fn().mockReturnThis(),
            on: vi.fn().mockReturnThis(),
            setVisible: vi.fn().mockReturnThis(),
            setScrollFactor: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
            setScale: vi.fn().mockReturnThis(),
            setAlpha: vi.fn().mockReturnThis(),
            setText: vi.fn().mockReturnThis(),
            setPosition: vi.fn().mockReturnThis()
        };

        // Mock standard scene properties
        scene.add = {
            text: vi.fn().mockReturnValue(mockGameObject),
            image: vi.fn().mockReturnValue(mockGameObject),
            sprite: vi.fn().mockReturnValue(mockGameObject),
            tileSprite: vi.fn().mockReturnValue(mockGameObject),
            container: vi.fn().mockReturnValue({ ...mockGameObject, add: vi.fn() }),
            graphics: vi.fn().mockReturnValue({
                clear: vi.fn().mockReturnThis(),
                lineStyle: vi.fn().mockReturnThis(),
                fillStyle: vi.fn().mockReturnThis(),
                fillRect: vi.fn().mockReturnThis(),
                strokeRect: vi.fn().mockReturnThis()
            })
        } as any;

        scene.scale = { width: 800, height: 600 } as any;

        // Mock Managers (base scene expected them)
        (scene as any).gameManager = {
            isGameActive: vi.fn().mockReturnValue(true),
            handleGameOver: vi.fn()
        };
        (scene as any).collisionManager = {
            getCategories: vi.fn().mockReturnValue({
                shipCategory: 1,
                enemyCategory: 2,
                laserCategory: 4,
                enemyLaserCategory: 8,
                lootCategory: 16
            })
        };
    });

    it('should start level on create', () => {
        // Hack: bypass super.create() complexity by just testing logic or mocking base create
        // Since BaseScene.create() does a lot, we might want to just call scene.create() 
        // IF we mock BaseScene methods. Or simpler: test startLevel if it was public.
        // It is private.

        // Let's call create and see if Level constructor is called.
        // We need to mock BaseScene.create if possible or provide all deps.
        // For now, let's assume dependencies are set (we mocked managers).

        // Use mocks from MockPhaser or existing setup
        scene.scale.on = vi.fn();

        // Mock createPlayerShip (protected method of BaseScene)
        (scene as any).createPlayerShip = vi.fn();
        (scene as any).createUI = vi.fn();
        (scene as any).setupControls = vi.fn();

        scene.create();

        expect(Level).toHaveBeenCalled();
    });
});
