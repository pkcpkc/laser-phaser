import { describe, it, expect } from 'vitest';
import { StorylineManager } from '../../src/logic/storyline-manager';

describe('StorylineManager', () => {
    it('should be a singleton', () => {
        const instance1 = StorylineManager.getInstance();
        const instance2 = StorylineManager.getInstance();
        expect(instance1).toBe(instance2);
    });

    it('should parse markdown correctly', () => {
        const markdown = `
## galaxy-1
### planet-A
Welcome to Planet A.

## galaxy-2
### planet-B
Welcome to Planet B.
`;
        const manager = StorylineManager.getInstance();
        manager.init(markdown);

        expect(manager.getIntroText('galaxy-1', 'planet-A')).toBe('Welcome to Planet A.');
        expect(manager.getIntroText('galaxy-2', 'planet-B')).toBe('Welcome to Planet B.');
        expect(manager.getIntroText('galaxy-1', 'planet-B')).toBeNull();
    });

    it('should handle multi-line text', () => {
        const markdown = `
## g1
### p1
Line 1.
Line 2.

Line 3.
`;
        const manager = StorylineManager.getInstance();
        manager.init(markdown);

        const text = manager.getIntroText('g1', 'p1');
        expect(text).toContain('Line 1.');
        expect(text).toContain('Line 3.');
        // Verify whitespace handling if needed, currently checking for presence
    });

    it('should handle the real galaxy IDs', () => {
        const markdown = `
## blood-hunters-galaxy
### belt
Real text.

## demo-galaxy
### astra
Demo text.
`;
        const manager = StorylineManager.getInstance();
        manager.init(markdown);

        expect(manager.getIntroText('blood-hunters-galaxy', 'belt')).toBe('Real text.');
        expect(manager.getIntroText('demo-galaxy', 'astra')).toBe('Demo text.');
    });
});
