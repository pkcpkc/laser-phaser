export class StorylineManager {
    private static instance: StorylineManager;
    private storylines: Map<string, Map<string, string>> = new Map();
    private isInitialized: boolean = false;

    private constructor() { }

    public static getInstance(): StorylineManager {
        if (!StorylineManager.instance) {
            StorylineManager.instance = new StorylineManager();
        }
        return StorylineManager.instance;
    }

    /**
     * Parses the markdown content and caches the texts.
     * Expected format:
     * ## galaxy-id
     * ### planet-id
     * Text content...
     */
    public init(markdown: string) {
        if (this.isInitialized) {
            console.warn('StorylineManager already initialized. Overwriting existing data.');
        }

        this.storylines.clear();
        this.parseMarkdown(markdown);
        this.isInitialized = true;
        console.log('StorylineManager initialized with', this.storylines.size, 'galaxies.');
    }

    public getIntroText(galaxyId: string, planetId: string): string | null {
        if (!this.isInitialized) {
            console.error('StorylineManager not initialized. Call init() first.');
            return null;
        }

        const galaxyMap = this.storylines.get(galaxyId);
        if (galaxyMap) {
            return galaxyMap.get(planetId) || null;
        }
        return null;
    }

    private parseMarkdown(markdown: string) {
        const lines = markdown.split('\n');
        let currentGalaxyId: string | null = null;
        let currentPlanetId: string | null = null;
        let currentTextLines: string[] = [];

        const saveCurrentText = () => {
            if (currentGalaxyId && currentPlanetId && currentTextLines.length > 0) {
                let galaxyMap = this.storylines.get(currentGalaxyId);
                if (!galaxyMap) {
                    galaxyMap = new Map();
                    this.storylines.set(currentGalaxyId, galaxyMap);
                }
                // Join lines and trim extra whitespace, preserving paragraph breaks
                const text = currentTextLines.join('\n').trim();
                if (text) {
                    galaxyMap.set(currentPlanetId, text);
                }
            }
            currentTextLines = [];
        };

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.startsWith('## ')) {
                // New Galaxy Section
                saveCurrentText();
                currentGalaxyId = trimmed.substring(3).trim();
                currentPlanetId = null;
            } else if (trimmed.startsWith('### ')) {
                // New Planet Section
                saveCurrentText();
                currentPlanetId = trimmed.substring(4).trim();
            } else if (currentGalaxyId && currentPlanetId) {
                // Content
                // Skip empty lines at the start of a block if we haven't collected anything yet
                if (currentTextLines.length > 0 || trimmed !== '') {
                    currentTextLines.push(line); // Keep original indentation/spacing logic if needed, but usually trim is fine for display
                }
            }
        }
        // Save the last block
        saveCurrentText();
    }
}
