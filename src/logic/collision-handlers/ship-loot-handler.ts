import Phaser from 'phaser';
import type { CollisionHandler } from './collision-handler.interface';

export class ShipLootHandler implements CollisionHandler {
    constructor(
        private shipCategory: number,
        private lootCategory: number,
        private onLootCollected?: (loot: Phaser.GameObjects.GameObject) => void
    ) { }

    handle(
        _scene: Phaser.Scene,
        categoryA: number,
        categoryB: number,
        gameObjectA: Phaser.GameObjects.GameObject | null,
        gameObjectB: Phaser.GameObjects.GameObject | null
    ): boolean {
        if (!gameObjectA || !gameObjectB) return false;

        if ((categoryA === this.shipCategory && categoryB === this.lootCategory) ||
            (categoryB === this.shipCategory && categoryA === this.lootCategory)) {

            const loot = categoryA === this.lootCategory ? gameObjectA : gameObjectB;
            if (this.onLootCollected) {
                this.onLootCollected(loot);
            }
            return true;
        }

        return false;
    }
}
