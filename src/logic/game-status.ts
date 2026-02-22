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

    private moduleInventory: Record<string, number> = {};
    private shipLoadout: Record<number, string | null> = {};
    private merchantInventory: Record<string, number> = {};

    private constructor() {
        this.load();
    }

    public static getInstance(): GameStatus {
        if (!GameStatus.instance) {
            GameStatus.instance = new GameStatus();
        }
        return GameStatus.instance;
    }

    private load() {
        // No-op: persistence disabled
    }

    private save() {
        // No-op: persistence disabled
    }


    public getLoot(): LootData {
        return { ...this.loot };
    }

    public updateLoot(type: LootType, amount: number) {
        this.loot[type] += amount;
        if (this.loot[type] < 0) this.loot[type] = 0;
        this.save();
    }

    // --- Module Inventory ---

    public getModuleInventory(): Record<string, number> {
        return { ...this.moduleInventory };
    }

    public addModule(moduleId: string, amount: number = 1) {
        if (!this.moduleInventory[moduleId]) {
            this.moduleInventory[moduleId] = 0;
        }
        this.moduleInventory[moduleId] += amount;
        this.save();
    }

    public removeModule(moduleId: string, amount: number = 1): boolean {
        if (!this.moduleInventory[moduleId] || this.moduleInventory[moduleId] < amount) {
            return false; // Not enough in inventory
        }
        this.moduleInventory[moduleId] -= amount;
        this.save();
        return true;
    }

    // --- Ship Loadout ---

    public getShipLoadout(): Record<number, string | null> {
        return { ...this.shipLoadout };
    }

    public setShipLoadout(mountIndex: number, moduleId: string | null) {
        this.shipLoadout[mountIndex] = moduleId;
        this.save();
    }

    // --- Merchant Inventory ---

    public getMerchantInventory(): Record<string, number> {
        return { ...this.merchantInventory };
    }

    public clearMerchantInventory() {
        this.merchantInventory = {};
        this.save();
    }

    public setMerchantStock(moduleId: string, amount: number) {
        this.merchantInventory[moduleId] = amount;
        this.save();
    }

    public removeMerchantStock(moduleId: string, amount: number = 1): boolean {
        if (!this.merchantInventory[moduleId] || this.merchantInventory[moduleId] < amount) {
            return false;
        }
        this.merchantInventory[moduleId] -= amount;
        this.save();
        return true;
    }

    public addMerchantStock(moduleId: string, amount: number = 1) {
        if (!this.merchantInventory[moduleId]) {
            this.merchantInventory[moduleId] = 0;
        }
        this.merchantInventory[moduleId] += amount;
        this.save();
    }

    public isMerchantInitialized(): boolean {
        return Object.keys(this.merchantInventory).length > 0;
    }


    public isPlanetRevealed(id: string): boolean {
        return this.revealedPlanets.has(id);
    }

    public revealPlanet(id: string) {
        this.revealedPlanets.add(id);
        this.save();
    }


    public hasSeenIntro(planetId: string): boolean {
        return this.seenIntroPlanetIds.has(planetId);
    }

    public markIntroSeen(planetId: string) {
        this.seenIntroPlanetIds.add(planetId);
        this.save();
    }


    public getPlanetPosition(galaxyId: string, planetId: string): PlanetPosition | undefined {
        return this.planetPositions.get(`${galaxyId}:${planetId}`);
    }

    public setPlanetPosition(galaxyId: string, planetId: string, position: PlanetPosition) {
        this.planetPositions.set(`${galaxyId}:${planetId}`, position);
        this.save();
    }


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
        this.moduleInventory = {};
        this.shipLoadout = {};
        this.merchantInventory = {};
        this.save();
    }
}
