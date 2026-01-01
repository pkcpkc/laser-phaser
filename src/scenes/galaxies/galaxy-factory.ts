
import { Galaxy } from './galaxy';
import type { GalaxyConfig } from './galaxy-config';
import { BloodHuntersGalaxyConfig } from './blood-hunters-galaxy';

export class GalaxyFactory {
    private static registry: Map<string, GalaxyConfig> = new Map();

    public static register(config: GalaxyConfig) {
        this.registry.set(config.id, config);
    }

    public static create(id: string): Galaxy {
        const config = this.registry.get(id);

        if (!config) {
            console.warn(`Galaxy ID '${id}' not registered. Defaulting to BloodHuntersGalaxy.`);
            return new Galaxy(BloodHuntersGalaxyConfig);
        }

        return new Galaxy(config);
    }

    // Static initializer to load all galaxies
    public static initialize() {
        // Look in the current directory for files exporting GalaxyConfig objects
        // Exclude galaxy-factory, galaxy-config, galaxy-scene, planet-data, Galaxy etc.
        // Better to target specific pattern or exclude known files.
        const modules = import.meta.glob(['./*.ts', '!./galaxy-factory.ts', '!./galaxy-config.ts', '!./galaxy.ts', '!./galaxy-interaction.ts', '!./galaxy-scene.ts'], { eager: true });

        for (const path in modules) {
            const module = modules[path] as any;
            // Iterate exports
            for (const key in module) {
                const Exported = module[key];

                // Check if it's a GalaxyConfig object
                // Duck typing: check for id, name, and planets array
                if (Exported && typeof Exported === 'object' && 'id' in Exported && 'planets' in Exported && Array.isArray(Exported.planets)) {
                    // Check strict type if possible, but runtime shape check is enough here
                    GalaxyFactory.register(Exported as GalaxyConfig);
                    console.log(`Registered galaxy: ${Exported.id}`);
                }
            }
        }
    }
}

// Automatically initialize when module is loaded
GalaxyFactory.initialize();
