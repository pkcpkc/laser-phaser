import { Container } from 'inversify';
import { TYPES } from './types';
import { GameManager } from '../logic/game-manager';
import { CollisionManager } from '../logic/collision-manager';
import { PlayerController } from '../logic/player-controller';
import { Ship } from '../ships/ship';
import { ModuleManager } from '../ships/module-manager';
import { ShipCombat } from '../ships/ship-combat';
import { LootUI } from '../ui/loot-ui';
import { Starfield } from '../backgrounds/starfield';
import { WarpStarfield } from '../backgrounds/warp-starfield';
import { PlanetVisuals } from '../scenes/galaxies/planets/planet-visuals';
import { GalaxyInteractionManager } from '../scenes/galaxies/galaxy-interaction';
import { PlayerShipController } from '../scenes/galaxies/player-ship-controller';
import { PlanetNavigator } from '../scenes/galaxies/planet-navigator';
import { PlanetIntroOverlay } from '../scenes/galaxies/planets/planet-intro-overlay';

interface ServiceBinding {
    id: symbol;
    to: new (...args: any[]) => any;
    scope?: 'scene';
}

const binders: ServiceBinding[] = [
    { id: TYPES.GameManager, to: GameManager },
    { id: TYPES.CollisionManager, to: CollisionManager },
    { id: TYPES.PlayerController, to: PlayerController },
    { id: TYPES.Ship, to: Ship },
    { id: TYPES.ModuleManager, to: ModuleManager },
    { id: TYPES.ShipCombat, to: ShipCombat },
    { id: TYPES.LootUI, to: LootUI, scope: 'scene' },
    { id: TYPES.Starfield, to: Starfield },
    { id: TYPES.WarpStarfield, to: WarpStarfield, scope: 'scene' },
    { id: TYPES.PlanetVisuals, to: PlanetVisuals, scope: 'scene' },
    { id: TYPES.GalaxyInteractionManager, to: GalaxyInteractionManager, scope: 'scene' },
    { id: TYPES.PlayerShipController, to: PlayerShipController, scope: 'scene' },
    { id: TYPES.PlanetNavigator, to: PlanetNavigator, scope: 'scene' },
    { id: TYPES.PlanetIntroOverlay, to: PlanetIntroOverlay, scope: 'scene' },
];

export const container = new Container();

binders.forEach(binding => {
    container.bind(binding.id).to(binding.to);
});

export function bindScene(scene: Phaser.Scene) {
    if (container.isBound(TYPES.Scene)) {
        container.rebind(TYPES.Scene).toConstantValue(scene);
    } else {
        container.bind(TYPES.Scene).toConstantValue(scene);
    }

    // Rebind scene-specific services to ensure they are singletons PER SCENE execution
    binders.filter(b => b.scope === 'scene').forEach(binding => {
        container.rebind(binding.id).to(binding.to).inSingletonScope();
    });
}
