import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LocaleManager } from '../../../src/config/locale-manager';

describe('LocaleManager', () => {
    let originalLocation: Location;
    let originalNavigator: Navigator;

    beforeEach(() => {
        LocaleManager.reset();
        originalLocation = window.location;
        originalNavigator = window.navigator;
    });

    afterEach(() => {
        Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
        Object.defineProperty(window, 'navigator', { value: originalNavigator, writable: true });
    });

    describe('getInstance', () => {
        it('returns a singleton instance', () => {
            const instance1 = LocaleManager.getInstance();
            const instance2 = LocaleManager.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('detectLocale', () => {
        it('uses URL param if provided', () => {
            Object.defineProperty(window, 'location', {
                value: { search: '?locale=fr' },
                writable: true
            });

            const result = LocaleManager.getInstance().detectLocale();
            expect(result).toBe('fr');
        });

        it('falls back to browser locale if no URL param', () => {
            Object.defineProperty(window, 'location', {
                value: { search: '' },
                writable: true
            });
            Object.defineProperty(window, 'navigator', {
                value: { language: 'de-DE' },
                writable: true
            });

            const result = LocaleManager.getInstance().detectLocale();
            expect(result).toBe('de');
        });

        it('falls back to en if no locale available', () => {
            Object.defineProperty(window, 'location', {
                value: { search: '' },
                writable: true
            });
            Object.defineProperty(window, 'navigator', {
                value: { language: '' },
                writable: true
            });

            const result = LocaleManager.getInstance().detectLocale();
            expect(result).toBe('en');
        });

        it('stores locale in registry if provided', () => {
            Object.defineProperty(window, 'location', {
                value: { search: '?locale=es' },
                writable: true
            });

            const mockRegistry = { set: vi.fn() } as unknown as Phaser.Data.DataManager;
            LocaleManager.getInstance().detectLocale(mockRegistry);

            expect(mockRegistry.set).toHaveBeenCalledWith('locale', 'es');
        });
    });

    describe('getLocale', () => {
        it('returns the detected locale', () => {
            Object.defineProperty(window, 'location', {
                value: { search: '?locale=it' },
                writable: true
            });

            const manager = LocaleManager.getInstance();
            manager.detectLocale();
            expect(manager.getLocale()).toBe('it');
        });
    });

    describe('setLocale', () => {
        it('sets the locale manually', () => {
            const manager = LocaleManager.getInstance();
            manager.setLocale('ja');
            expect(manager.getLocale()).toBe('ja');
        });
    });
});
