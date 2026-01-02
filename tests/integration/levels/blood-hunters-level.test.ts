import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser completely before importing anything else
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            Math: {
                Between: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
                GetSpeed: (distance: number, time: number) => distance / time,
                Vector2: class { x = 0; y = 0; },
                GetRandom: (arr: any[]) => arr[0]
            },
            Physics: {
                Matter: {
                    Image: class { }
                }
            },
            Utils: {
                Array: {
                    GetRandom: (arr: any[]) => arr[0]
                }
            },
            Time: {
                TimerEvent: class { remove() { } }
            }
        }
    };
});

import { Level } from '../../../src/scenes/shoot-em-ups/levels/level';
import { BloodHuntersLevel } from '../../../src/scenes/shoot-em-ups/levels/blood-hunters-level';

describe('Integration: BloodHuntersLevel', () => {
    let mockScene: any;
    let createdSprites: any[] = [];

    beforeEach(() => {
        createdSprites = [];

        mockScene = {
            time: {
                delayedCall: vi.fn((delay, callback) => {
                    return {
                        remove: vi.fn(),
                        callback: callback,
                        delay: delay
                    };
                }),
                now: 0
            },
            matter: {
                add: {
                    image: vi.fn((x, y, key, frame) => {
                        const sprite: any = {
                            x, y,
                            key, frame,
                            active: true,
                            visible: true,
                            body: { velocity: { x: 0, y: 0 } },
                            setData: vi.fn(),
                            getData: vi.fn(),
                            setAngle: vi.fn(),
                            setFixedRotation: vi.fn(),
                            setFrictionAir: vi.fn(),
                            setMass: vi.fn(),
                            setCollisionCategory: vi.fn(),
                            setCollidesWith: vi.fn(),
                            setOrigin: vi.fn(),
                            setSleepThreshold: vi.fn(),
                            setDepth: vi.fn(),
                            setRotation: vi.fn(),
                            setPosition: vi.fn(function (this: any, nx: number, ny: number) { this.x = nx; this.y = ny; }),
                            setVelocity: vi.fn(),
                            setVelocityY: vi.fn(),
                            destroy: vi.fn(function (this: any) { this.active = false; }),
                            scene: mockScene,
                            thrustBack: vi.fn(),
                            on: vi.fn(),
                            once: vi.fn(),
                            off: vi.fn()
                        };
                        sprite.getData.mockReturnValue(null);
                        createdSprites.push(sprite);
                        return sprite;
                    })
                }
            },
            add: {
                image: vi.fn().mockReturnValue({
                    setRotation: vi.fn(),
                    setDepth: vi.fn(),
                    setScale: vi.fn(),
                    setVisible: vi.fn(),
                    setPosition: vi.fn(),
                    destroy: vi.fn(),
                    on: vi.fn(),
                    once: vi.fn(),
                    off: vi.fn()
                }),
                particles: vi.fn().mockReturnValue({
                    setDepth: vi.fn(),
                    createEmitter: vi.fn().mockReturnValue({
                        startFollow: vi.fn()
                    }),
                    destroy: vi.fn()
                })
            },
            textures: {
                exists: vi.fn().mockReturnValue(true),
                get: vi.fn().mockReturnValue({ has: vi.fn().mockReturnValue(true) })
            },
            scale: {
                width: 800,
                height: 600
            },
            events: {
                on: vi.fn(),
                once: vi.fn(),
                off: vi.fn()
            },
            make: {
                graphics: vi.fn().mockReturnValue({
                    fillStyle: vi.fn(),
                    fillRect: vi.fn(),
                    generateTexture: vi.fn(),
                    destroy: vi.fn()
                })
            }
        };
        // Link scene for Ship
        mockScene.matter.add.image.mockImplementation((x: number, y: number, k: string, f: string) => {
            const sprite: any = {
                x, y,
                key: k, frame: f,
                active: true,
                visible: true,
                body: { velocity: { x: 0, y: 0 } },
                setData: vi.fn(),
                getData: vi.fn(),
                setAngle: vi.fn(),
                setFixedRotation: vi.fn(),
                setFrictionAir: vi.fn(),
                setMass: vi.fn(),
                setCollisionCategory: vi.fn(),
                setCollidesWith: vi.fn(),
                setOrigin: vi.fn(),
                setSleepThreshold: vi.fn(),
                setDepth: vi.fn(),
                setRotation: vi.fn(),
                setPosition: vi.fn(function (this: any, nx: number, ny: number) { this.x = nx; this.y = ny; }),
                setVelocity: vi.fn(),
                setVelocityY: vi.fn(),
                destroy: vi.fn(function (this: any) { this.active = false; }),
                scene: mockScene,
                thrustBack: vi.fn(),
                setTint: vi.fn(),
                clearTint: vi.fn(),
                on: vi.fn(),
                once: vi.fn(),
                off: vi.fn()
            };
            createdSprites.push(sprite);
            return sprite;
        });
    });

    it('should spawn Blood Hunters and move them downwards', () => {
        const collisionConfig = {
            category: 1,
            collidesWith: 2,
            laserCategory: 4,
            laserCollidesWith: 8,
            lootCategory: 16,
            lootCollidesWith: 32,
            isEnemy: true
        };

        const level = new Level(mockScene, BloodHuntersLevel, collisionConfig);
        level.start();

        // Advance time to allow ships to spawn and move
        // TacticRunner spawns immediately if startDelay is 0
        // BloodHunters Level 1st step: SinusTactic has NO startDelay.

        // Simulate update loop
        const dt = 16;
        const totalTime = 4000; // 4 seconds (ships should be on screen)

        for (let t = 0; t < totalTime; t += dt) {
            mockScene.time.now = t;
            level.update(t, dt);
        }

        console.log(`Created ${createdSprites.length} sprites.`);

        // Log sprite details for debugging
        const shipSprites = createdSprites.filter(s => s.active); // Filter out destroyed/modules if any

        // We expect at least the Sinus formation ships (3-5) and Diamond (1-3)
        // Check for 'blood-hunter' which is the problematic one
        const bloodHunters = shipSprites.filter(s => s.frame === 'blood-hunter' || s.key === 'ships');

        console.log(`Active Blood Hunters: ${bloodHunters.length}`);

        bloodHunters.forEach((s, i) => {
            console.log(`Hunter ${i}: y=${s.y}`);
        });

        // Assertion: We should have spawned blood hunters
        expect(bloodHunters.length).toBeGreaterThan(0);

        // Assertion: At least some should be on screen or have passed through
        // (y > -200)

        const visibleOrPassed = bloodHunters.some(s => s.y > -200);
        expect(visibleOrPassed).toBe(true);

        // Check if any actually entered the screen (y > 0)
        const enteredScreen = bloodHunters.some(s => s.y > 0);
        expect(enteredScreen).toBe(true);
    });
});
