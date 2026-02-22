import { describe, it, expect, vi } from 'vitest';
import { StorylineManager } from '../../../src/logic/storyline-manager';
import * as GeneratedStorylines from '../../../src/generated/storylines/storylines';

vi.mock('../../../src/generated/storylines/storylines', () => ({
    getText: vi.fn()
}));

describe('StorylineManager', () => {
    it('should be a singleton', () => {
        const instance1 = StorylineManager.getInstance();
        const instance2 = StorylineManager.getInstance();
        expect(instance1).toBe(instance2);
    });

    it('should delegate to getStoryline', () => {
        const manager = StorylineManager.getInstance();
        (GeneratedStorylines.getText as any).mockReturnValue('Mock Text');

        const res = manager.getIntroText('g1', 'p1', 'de');
        expect(GeneratedStorylines.getText).toHaveBeenCalledWith('g1', 'p1', 'de');
        expect(res).toBe('Mock Text');
    });

    it('should use default locale if not specified', () => {
        const manager = StorylineManager.getInstance();
        (GeneratedStorylines.getText as any).mockReturnValue('Default Text');

        const res = manager.getIntroText('g1', 'p1');
        // The manager defaults locale to param default value 'en'
        expect(GeneratedStorylines.getText).toHaveBeenCalledWith('g1', 'p1', 'en');
        expect(res).toBe('Default Text');
    });
});
