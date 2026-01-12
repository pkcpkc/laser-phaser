import { getStoryline } from '../../src-generated/storylines/storylines';

export class StorylineManager {
    private static instance: StorylineManager;

    private constructor() { }

    public static getInstance(): StorylineManager {
        if (!StorylineManager.instance) {
            StorylineManager.instance = new StorylineManager();
        }
        return StorylineManager.instance;
    }

    public get initialized(): boolean {
        return true;
    }


    public getIntroText(galaxyId: string, planetId: string, locale: string = 'en'): string | null {
        return getStoryline(galaxyId, planetId, locale);
    }
}

