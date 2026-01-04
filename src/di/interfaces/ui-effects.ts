import { LootType } from '../../ships/types';

export interface ILootUI {
    create(depth?: number): void;
    updateCounts(type: LootType, count: number): void;
    updatePositions(): void;
    setVisible(visible: boolean): void;
    destroy(): void;
}

export interface IStarfield {
    config(texture: string, nebulaTexture: string): void;
    update(time: number, delta: number): void;
    destroy(): void;
}
