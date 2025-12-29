export type LootData = Record<LootType, number>;

import { LootType } from '../ships/types';

export interface PlanetPosition {
    orbitAngle: number;
    orbitRadius: number;
}

export class GameStatus {
    private static instance: GameStatus;

    private loot: LootData = {
        [LootType.GOLD]: 0,
        [LootType.GEM]: 0,
        [LootType.MODULE]: 0,
        [LootType.SILVER]: 0
    };

    private revealedPlanets: Set<string> = new Set();

    // Key format: "universeId:planetId"
    private planetPositions: Map<string, PlanetPosition> = new Map();

    // Key format: "universeId" -> number of victories
    private victories: Record<string, number> = {};

    private constructor() {
        this.load();
    }

    public static getInstance(): GameStatus {
        if (!GameStatus.instance) {
            GameStatus.instance = new GameStatus();
        }
        return GameStatus.instance;
    }

    // Persistence
    private load() {
        // Persistence disabled by user request
        // const dataStr = localStorage.getItem('laser-phaser-save');
        // if (dataStr) {
        //     const data = JSON.parse(dataStr);
        //     this.loot = data.loot || {};
        //     this.revealedPlanets = new Set(data.revealedPlanets || []);
        //     this.planetPositions = new Map(data.planetPositions || []);
        //     this.victories = data.victories || {};
        // }
    }

    private save() {
        // Persistence disabled by user request
        // const data = {
        //     loot: this.loot,
        //     revealedPlanets: Array.from(this.revealedPlanets),
        //     planetPositions: Array.from(this.planetPositions.entries()),
        //     victories: this.victories
        // };
        // localStorage.setItem('laser-phaser-save', JSON.stringify(data));
    }

    // Loot Management
    public getLoot(): LootData {
        return { ...this.loot };
    }

    public updateLoot(type: LootType, amount: number) {
        this.loot[type] += amount;
        this.save();
    }

    // Planet Management
    public isPlanetRevealed(id: string): boolean {
        return this.revealedPlanets.has(id);
    }

    public revealPlanet(id: string) {
        this.revealedPlanets.add(id);
        this.save();
    }

    // Planet Position Management
    public getPlanetPosition(universeId: string, planetId: string): PlanetPosition | undefined {
        return this.planetPositions.get(`${universeId}:${planetId}`);
    }

    public setPlanetPosition(universeId: string, planetId: string, position: PlanetPosition) {
        this.planetPositions.set(`${universeId}:${planetId}`, position);
        this.save();
    }

    // Victory Management
    public getVictories(universeId: string): number {
        return this.victories[universeId] || 0;
    }

    public addVictory(universeId: string) {
        if (!this.victories[universeId]) {
            this.victories[universeId] = 0;
        }
        this.victories[universeId]++;
        this.save();
    }

    public reset() {
        this.loot = {
            [LootType.GOLD]: 0,
            [LootType.GEM]: 0,
            [LootType.MODULE]: 0,
            [LootType.SILVER]: 0
        };
        this.revealedPlanets.clear();
        this.planetPositions.clear();
        this.victories = {};
        this.save();
    }
}
