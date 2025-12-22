import { BaseUniverse } from './base-universe';
import { BloodHuntersUniverse } from './universes/blood-hunters-universe';

type UniverseConstructor = new () => BaseUniverse;

export class UniverseFactory {
    private static registry: Map<string, UniverseConstructor> = new Map();

    public static register(id: string, constructor: UniverseConstructor) {
        this.registry.set(id, constructor);
    }

    public static create(id: string): BaseUniverse {
        const UniverseClass = this.registry.get(id);

        if (!UniverseClass) {
            console.warn(`Universe ID '${id}' not registered. Defaulting to BloodHuntersUniverse.`);
            return new BloodHuntersUniverse();
        }

        return new UniverseClass();
    }

    // Static initializer to load all universes
    public static initialize() {
        // Look in the 'universes' subdirectory
        const modules = import.meta.glob('./universes/*.ts', { eager: true });

        for (const path in modules) {
            const module = modules[path] as any;
            // Iterate exports
            for (const key in module) {
                const Exported = module[key];

                // Check if it's a class with a static 'id' property AND inherits from BaseUniverse
                if (typeof Exported === 'function' && 'id' in Exported) {
                    // Verify inheritance
                    if (BaseUniverse.isPrototypeOf(Exported)) {
                        UniverseFactory.register(Exported.id, Exported);
                        console.log(`Registered universe: ${Exported.id}`);
                    }
                }
            }
        }
    }
}

// Automatically initialize when module is loaded
UniverseFactory.initialize();
