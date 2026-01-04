/**
 * Manages locale detection and storage.
 * Extracts locale handling from GalaxyScene.
 */
export class LocaleManager {
    private static instance: LocaleManager;

    private currentLocale: string = 'en';

    private constructor() { }

    static getInstance(): LocaleManager {
        if (!LocaleManager.instance) {
            LocaleManager.instance = new LocaleManager();
        }
        return LocaleManager.instance;
    }

    /**
     * Detects locale from URL param, browser setting, or defaults to 'en'.
     * Also stores the detected locale in the scene registry if provided.
     */
    detectLocale(registry?: Phaser.Data.DataManager): string {
        const params = new URLSearchParams(window.location.search);
        const browserLocale = navigator.language.split('-')[0];
        const userLocale = params.get('locale') || browserLocale || 'en';

        this.currentLocale = userLocale;

        if (registry) {
            registry.set('locale', this.currentLocale);
        }

        return this.currentLocale;
    }

    /**
     * Returns the current locale.
     */
    getLocale(): string {
        return this.currentLocale;
    }

    /**
     * Sets the locale manually (useful for testing).
     */
    setLocale(locale: string): void {
        this.currentLocale = locale;
    }

    /**
     * Resets the singleton (for testing).
     */
    static reset(): void {
        LocaleManager.instance = undefined as unknown as LocaleManager;
    }
}
