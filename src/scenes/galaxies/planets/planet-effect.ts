export interface IPlanetEffect {
    setVisible(visible: boolean): void;
    destroy(): void;
    update?(time: number, delta: number): void;
    setDepth?(depth: number): void;
    getDepth?(): number;
    /** Returns all underlying game objects managed by this effect for proper layering */
    getVisualElements?(): Phaser.GameObjects.GameObject[];
}


