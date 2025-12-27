export interface Drive {
    readonly thrust: number;
    readonly name: string;
    readonly description: string;

    // Optional visuals
    createTexture?(scene: Phaser.Scene): void;

    // Needed to satisfy the generic module interface used in ship.ts
    // In ship.ts we check if module is "ActiveModule" which expects "module: Laser" (currently).
    // We updated "module: Laser" to "module: Laser | Drive" (TODO in types but effectively any).
    // We need to make sure Drive fits whatever interface we treat modules as.
    // Currently ship.ts treats modules as having:
    // - createTexture(scene)
    // - visibleOnMount
    // - mountTextureKey / TEXTURE_KEY
    // - scale?
    // - addMountEffect?
    // - reloadTime, currentAmmo, lastFired, fire() (checked before use)

    visibleOnMount: boolean;
    TEXTURE_KEY?: string;
    mountTextureKey?: string;
    scale?: number;
    addMountEffect?(scene: Phaser.Scene, sprite: Phaser.GameObjects.Image): void;
}
