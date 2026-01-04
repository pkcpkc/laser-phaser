export const TYPES = {
    // Scene reference
    Scene: Symbol.for('Scene'),

    // Logic Managers
    GameManager: Symbol.for('GameManager'),
    CollisionManager: Symbol.for('CollisionManager'),
    PlayerController: Symbol.for('PlayerController'),
    PlayerMovement: Symbol.for('PlayerMovement'),
    PlayerRotation: Symbol.for('PlayerRotation'),
    PlayerFiring: Symbol.for('PlayerFiring'),
    PlayerCursorKeys: Symbol.for('PlayerCursorKeys'),
    StorylineManager: Symbol.for('StorylineManager'),

    // Ships
    Ship: Symbol.for('Ship'),
    ShipFactory: Symbol.for('ShipFactory'),
    ModuleManager: Symbol.for('ModuleManager'),
    ShipCombat: Symbol.for('ShipCombat'),
    Loot: Symbol.for('Loot'),

    // UI & Effects
    LootUI: Symbol.for('LootUI'),
    Starfield: Symbol.for('Starfield'),
    WarpStarfield: Symbol.for('WarpStarfield'),

    // Galaxy Domain
    PlanetVisuals: Symbol.for('PlanetVisuals'),
    GalaxyInteractionManager: Symbol.for('GalaxyInteractionManager'),
    PlayerShipController: Symbol.for('PlayerShipController'),
    PlanetNavigator: Symbol.for('PlanetNavigator'),
    PlanetIntroOverlay: Symbol.for('PlanetIntroOverlay')
};
