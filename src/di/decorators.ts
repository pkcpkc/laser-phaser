import { injectable, decorate } from 'inversify';
import 'reflect-metadata';

// Registry to track scene-scoped services
export const sceneServices: Set<new (...args: any[]) => any> = new Set();

/**
 * Decorator to mark a class as a scene-scoped service.
 * These services will be re-bound as singletons in the scope of a specific scene execution.
 */
export function SceneScoped() {
    return function (target: new (...args: any[]) => any) {
        // Ensure the class is injectable
        try {
            decorate(injectable(), target);
        } catch (e) {
            // decorate throws if already decorated, which is fine
        }

        // Register for scene binding
        sceneServices.add(target);
    };
}
