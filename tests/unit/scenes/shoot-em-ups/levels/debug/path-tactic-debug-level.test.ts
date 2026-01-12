import { describe, it, expect, vi } from 'vitest';

// Mock Phaser first
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            Math: {
                Vector2: class { x = 0; y = 0; },
            },
            Physics: {
                Matter: {
                    Image: class { }
                }
            },
            GameObjects: {
                Sprite: class { }
            }
        }
    };
});

import { PathTacticDemoLevel } from '../../../../../../src/scenes/shoot-em-ups/levels/debug/path-tactic-debug-level';

describe('PathTacticDemoLevel', () => {
    it('should be a valid level config', () => {
        expect(PathTacticDemoLevel).toBeDefined();
        expect(PathTacticDemoLevel.name).toBe('Path Tactic Demo');
        expect(PathTacticDemoLevel.formations.length).toBeGreaterThan(0);
    });
});
