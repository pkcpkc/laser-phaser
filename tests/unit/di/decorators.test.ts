import { describe, it, expect, beforeEach } from 'vitest';
import { SceneScoped, sceneServices } from '../../../src/di/decorators';

describe('DI Decorators', () => {
    beforeEach(() => {
        // Clear the registry before each test
        sceneServices.clear();
    });

    describe('SceneScoped', () => {
        it('should register the class in sceneServices', () => {
            @SceneScoped()
            class TestService { }

            expect(sceneServices.has(TestService)).toBe(true);
        });

        it('should allow multiple classes to be registered', () => {
            @SceneScoped()
            class ServiceA { }

            @SceneScoped()
            class ServiceB { }

            expect(sceneServices.has(ServiceA)).toBe(true);
            expect(sceneServices.has(ServiceB)).toBe(true);
            expect(sceneServices.size).toBe(2);
        });

        it('should not duplicate registration for the same class', () => {
            @SceneScoped()
            class DuplicateService { }

            // Manually try to add again (decorator won't run twice)
            sceneServices.add(DuplicateService);

            expect(sceneServices.size).toBe(1);
        });
    });

    describe('sceneServices registry', () => {
        it('should be a Set', () => {
            expect(sceneServices).toBeInstanceOf(Set);
        });

        it('should be empty initially (after clear)', () => {
            expect(sceneServices.size).toBe(0);
        });
    });
});
