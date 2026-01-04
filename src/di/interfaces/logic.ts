import Phaser from 'phaser';

export interface IGameManager {
    isGameActive(): boolean;
    isVictoryState(): boolean;
    handleGameOver(): void;
    handleVictory(color: string): void;
    handleResize(width: number, height: number): void;
    setVictoryState(victory: boolean): void;
    setRestartMessage(text: string): void;
}

export interface ICollisionManager {
    setupCollisions(): void;
    getCategories(): any;
    config(onGameOver: () => void, onLootCollected?: (loot: Phaser.GameObjects.GameObject) => void): void;
}

export interface IPlayerController {
    setFireButton(fireButton: Phaser.GameObjects.Text): void;
    update(time: number): void;
    onDestroy(): void;
}
