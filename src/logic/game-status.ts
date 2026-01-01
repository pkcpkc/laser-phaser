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
    private seenIntroPlanetIds: Set<string> = new Set();
    private defeatedPlanets: Set<string> = new Set(); // Key: "galaxyId:planetId"

    // Key format: "galaxyId:planetId"
    private planetPositions: Map<string, PlanetPosition> = new Map();

    // Key format: "galaxyId" -> number of victories
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
        //     this.seenIntroPlanetIds = new Set(data.seenIntroPlanetIds || []);
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

    // Intro Tracking
    public hasSeenIntro(planetId: string): boolean {
        return this.seenIntroPlanetIds.has(planetId);
    }

    public markIntroSeen(planetId: string) {
        this.seenIntroPlanetIds.add(planetId);
        this.save();
    }

    // Planet Position Management
    public getPlanetPosition(galaxyId: string, planetId: string): PlanetPosition | undefined {
        return this.planetPositions.get(`${galaxyId}:${planetId}`);
    }

    public setPlanetPosition(galaxyId: string, planetId: string, position: PlanetPosition) {
        this.planetPositions.set(`${galaxyId}:${planetId}`, position);
        this.save();
    }

    // Victory Management
    public getVictories(galaxyId: string): number {
        return this.victories[galaxyId] || 0;
    }

    public addVictory(galaxyId: string) {
        if (!this.victories[galaxyId]) {
            this.victories[galaxyId] = 0;
        }
        this.victories[galaxyId]++;
        this.save();
    }

    // Planet Defeat Tracking
    public isPlanetDefeated(galaxyId: string, planetId: string): boolean {
        return this.defeatedPlanets.has(`${galaxyId}:${planetId}`);
    }

    public markPlanetDefeated(galaxyId: string, planetId: string) {
        this.defeatedPlanets.add(`${galaxyId}:${planetId}`);
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
        this.seenIntroPlanetIds.clear();
        this.planetPositions.clear();
        this.defeatedPlanets.clear();
        this.victories = {};
        this.save();
    }
}
