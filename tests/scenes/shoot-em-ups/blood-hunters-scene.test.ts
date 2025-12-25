import { describe, it, expect, vi } from 'vitest';

// Mock Phaser globally
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class {
                sys = { config: 'BloodHunters' };
            },
            GameObjects: {
                Image: class { },
                Text: class { }
            },
            Physics: {
                Matter: {
                    Sprite: class { },
                    Image: class { }
                }
            }
        }
    };
});

vi.mock('phaser3-rex-plugins/plugins/virtualjoystick.js', () => {
    return {
        default: class { }
    };
});

import BloodHuntersScene from '../../../src/scenes/shoot-em-ups/blood-hunters-scene';
import { BloodHuntersLevel } from '../../../src/scenes/shoot-em-ups/levels/blood-hunters-level';

describe('BloodHuntersScene', () => {
    it('should initialize with correct key', () => {
        const scene = new BloodHuntersScene();
        expect(scene.sys.config).toBe('BloodHunters');
    });

    it('should use BloodHuntersLevel', () => {
        const scene = new BloodHuntersScene();
        // Access protected method via any cast
        expect((scene as any).getLevelClass()).toBe(BloodHuntersLevel);
    });
});
