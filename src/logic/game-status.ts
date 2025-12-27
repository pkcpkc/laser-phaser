export interface LootData {
    gold: number;
    silver: number;
    gems: number;
    modules: number;
}

export interface PlanetPosition {
    orbitAngle: number;
    orbitRadius: number;
}

export class GameStatus {
    private static instance: GameStatus;

    private loot: LootData = {
        gold: 0,
        silver: 0,
        gems: 0,
        modules: 0
    };

    private revealedPlanets: Set<string> = new Set();

    // Key format: "universeId:planetId"
    private planetPositions: Map<string, PlanetPosition> = new Map();

    private constructor() {
        // No loading from storage
    }

    public static getInstance(): GameStatus {
        if (!GameStatus.instance) {
            GameStatus.instance = new GameStatus();
        }
        return GameStatus.instance;
    }

    // Loot Management
    public getLoot(): LootData {
        return { ...this.loot };
    }

    public updateLoot(type: string, amount: number) {
        if (type === 'gold') this.loot.gold += amount;
        else if (type === 'gems' || type === 'gem') this.loot.gems += amount;
        else if (type === 'modules' || type === 'module') this.loot.modules += amount;
        else this.loot.silver += amount;
    }

    // Planet Management
    public isPlanetRevealed(id: string): boolean {
        return this.revealedPlanets.has(id);
    }

    public revealPlanet(id: string) {
        this.revealedPlanets.add(id);
    }

    // Planet Position Management
    public getPlanetPosition(universeId: string, planetId: string): PlanetPosition | undefined {
        return this.planetPositions.get(`${universeId}:${planetId}`);
    }

    public setPlanetPosition(universeId: string, planetId: string, position: PlanetPosition) {
        this.planetPositions.set(`${universeId}:${planetId}`, position);
    }

    public reset() {
        this.loot = { gold: 0, silver: 0, gems: 0, modules: 0 };
        this.revealedPlanets.clear();
        this.planetPositions.clear();
    }
}
