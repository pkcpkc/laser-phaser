
import Phaser from 'phaser';
import type { PlanetData } from './planet-data';
import type { PlanetEffectConfig } from '../galaxy-config';
import type { IPlanetEffect } from './planet-effect';

// Effect class constructor type
type PlanetEffectConstructor = new (scene: Phaser.Scene, planet: PlanetData, config: any) => IPlanetEffect;

export class PlanetEffectFactory {
    private static registry: Map<string, PlanetEffectConstructor> = new Map();

    public static register(type: string, effectClass: PlanetEffectConstructor) {
        this.registry.set(type, effectClass);
    }

    public static create(scene: Phaser.Scene, planet: PlanetData, config: PlanetEffectConfig): IPlanetEffect | undefined {
        const EffectClass = this.registry.get(config.type);

        if (!EffectClass) {
            console.warn(`Unknown effect type: ${config.type}`);
            return undefined;
        }

        return new EffectClass(scene, planet, config);
    }

    // Static initializer to load all effects
    public static initialize() {
        // Glob import all effect files, excluding base classes
        const modules = import.meta.glob([
            './effects/*.ts',
            '!./effects/base-*.ts'
        ], { eager: true });

        for (const path in modules) {
            const module = modules[path] as any;
            // Iterate exports
            for (const key in module) {
                const Exported = module[key];

                // Check if it's an effect class with effectType static property
                if (Exported && typeof Exported === 'function' && 'effectType' in Exported) {
                    PlanetEffectFactory.register(Exported.effectType, Exported);
                    console.log(`Registered effect: ${Exported.effectType}`);
                }
            }
        }
    }
}

// Automatically initialize when module is loaded
PlanetEffectFactory.initialize();
