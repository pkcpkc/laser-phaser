export interface IPlanetEffect {
    setVisible(visible: boolean): void;
    destroy(): void;
    update?(time: number, delta: number): void;
}

export interface BaseEffectConfig {
    type: string;
}
