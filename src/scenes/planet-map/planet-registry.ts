import Phaser from 'phaser';

export interface PlanetData {
    id: string;
    x: number;
    y: number;
    type: 'main' | 'moon' | 'planet';
    name: string;
    unlocked: boolean;
    connections: string[];
    visualType?: 'emoji' | 'sprite'; // Default to emoji
    visual: string; // The emoji char or asset key
    visualScale?: number;
    levelId?: string;
    hasTrader?: boolean;
    hasShipyard?: boolean;
    tint?: number; // Optional color tint
    angle?: number; // Optional rotation angle
    // Runtime references
    gameObject?: Phaser.GameObjects.Text | Phaser.GameObjects.Image;
    overlayGameObject?: Phaser.GameObjects.Text;
    usingOverlay?: boolean;
    emitter?: Phaser.GameObjects.Particles.ParticleEmitter;
}

export class PlanetRegistry {
    private planets: PlanetData[] = [];

    constructor() { }

    public initPlanets(width: number, height: number) {
        const cx = width / 2;
        const earthX = cx;
        const earthYPos = Math.min(height - 100, height * 0.8);

        // Standard orbit radius
        const orbitRadius = Math.min(width, height) * 0.35;

        // Position calculations
        const moonAngle = Phaser.Math.DegToRad(-135);
        const moonX = earthX + Math.cos(moonAngle) * orbitRadius;
        const moonYPos = earthYPos + Math.sin(moonAngle) * orbitRadius;

        const ringAngle = Phaser.Math.DegToRad(-90);
        const ringX = earthX + Math.cos(ringAngle) * orbitRadius;
        const ringYPos = earthYPos + Math.sin(ringAngle) * orbitRadius;

        // Red Moon: 0 deg
        const redX = earthX + Math.cos(0) * orbitRadius;
        const redY = earthYPos + Math.sin(0) * orbitRadius;

        // Ice Moon: -45 deg
        const iceRad = Phaser.Math.DegToRad(-45);
        const iceX = earthX + Math.cos(iceRad) * orbitRadius;
        const iceY = earthYPos + Math.sin(iceRad) * orbitRadius;

        // Toxic Moon: 180 deg
        const toxicRad = Phaser.Math.DegToRad(180);
        const toxicX = earthX + Math.cos(toxicRad) * orbitRadius;
        const toxicY = earthYPos + Math.sin(toxicRad) * orbitRadius;

        this.planets = [
            {
                id: 'earth',
                x: earthX,
                y: earthYPos,
                type: 'main',
                name: 'Earth',
                unlocked: true,
                connections: ['moon-base', 'ring-world', 'red-moon', 'ice-moon', 'toxic-moon'],
                visual: '🌍',
                visualScale: 0.8
            },
            {
                id: 'moon-base',
                x: moonX,
                y: moonYPos,
                type: 'moon',
                name: 'Dark Moon',
                unlocked: false,
                connections: ['earth', 'ring-world'],
                visual: '🌑',
                visualScale: 0.6
            },
            {
                id: 'ring-world',
                x: ringX,
                y: ringYPos,
                type: 'planet',
                name: 'Ring World',
                unlocked: false,
                connections: ['earth', 'moon-base'],
                visual: '🪐',
                visualScale: 1.2
            },
            {
                id: 'red-moon',
                x: redX,
                y: redY,
                type: 'moon',
                name: 'Red Moon',
                unlocked: false,
                connections: ['earth'],
                visual: '🌑',
                tint: 0xff8888,
                angle: 45,
                visualScale: 0.5,
                levelId: 'blood-hunters',
                hasTrader: true,
                hasShipyard: true,
            },
            {
                id: 'ice-moon',
                x: iceX,
                y: iceY,
                type: 'moon',
                name: 'Ice Moon',
                unlocked: false,
                connections: ['earth'],
                visual: '🌑',
                tint: 0x8888ff,
                angle: -45,
                visualScale: 1.0
            },
            {
                id: 'toxic-moon',
                x: toxicX,
                y: toxicY,
                type: 'moon',
                name: 'Toxic Moon',
                unlocked: false,
                connections: ['earth'],
                visual: '🌑',
                tint: 0x88ff88,
                angle: 180,
                visualScale: 1.5
            }
        ];
    }

    public updatePositions(width: number, height: number) {
        const cx = width / 2;
        const orbitRadius = Math.min(width, height) * 0.35;

        // Earth
        const earth = this.getById('earth');
        const earthX = cx;
        const earthYPos = Math.min(height - 100, height * 0.8);

        if (earth) {
            this.setPlanetPosition(earth, earthX, earthYPos);
        }

        // Helper to set relative pos
        const setRelativePos = (id: string, angleDeg: number) => {
            const planet = this.getById(id);
            if (planet) {
                const rad = Phaser.Math.DegToRad(angleDeg);
                const px = earthX + Math.cos(rad) * orbitRadius;
                const py = earthYPos + Math.sin(rad) * orbitRadius;
                this.setPlanetPosition(planet, px, py);
            }
        };

        setRelativePos('moon-base', -135);
        setRelativePos('ring-world', -90);
        setRelativePos('red-moon', 0);
        setRelativePos('ice-moon', -45);
        setRelativePos('toxic-moon', 180);
    }

    private setPlanetPosition(planet: PlanetData, x: number, y: number) {
        planet.x = x;
        planet.y = y;
        if (planet.gameObject) {
            planet.gameObject.setPosition(x, y);
            if (planet.overlayGameObject) planet.overlayGameObject.setPosition(x, y);
        }
    }

    public getAll(): PlanetData[] {
        return this.planets;
    }

    public getById(id: string): PlanetData | undefined {
        return this.planets.find(p => p.id === id);
    }

    public findNearestNeighbor(currentId: string, dx: number, dy: number): PlanetData | null {
        const currentPlanet = this.getById(currentId);
        if (!currentPlanet) return null;

        const others = this.planets.filter(p => p.id !== currentId);

        // Filter candidates by direction
        let candidates: PlanetData[] = [];
        if (dx < 0) { // Left
            candidates = others.filter(p => p.x < currentPlanet.x - 1);
        } else if (dx > 0) { // Right
            candidates = others.filter(p => p.x > currentPlanet.x + 1);
        } else if (dy < 0) { // Up
            candidates = others.filter(p => p.y < currentPlanet.y - 1);
        } else if (dy > 0) { // Down
            candidates = others.filter(p => p.y > currentPlanet.y + 1);
        }

        if (candidates.length === 0) return null;

        // Sort by score
        candidates.sort((a, b) => {
            const distA = Phaser.Math.Distance.Between(currentPlanet.x, currentPlanet.y, a.x, a.y);
            const distB = Phaser.Math.Distance.Between(currentPlanet.x, currentPlanet.y, b.x, b.y);

            let penaltyA = 0;
            let penaltyB = 0;

            if (dx !== 0) { // Horizontal movement, penalize vertical deviation
                penaltyA = Math.abs(a.y - currentPlanet.y) / distA;
                penaltyB = Math.abs(b.y - currentPlanet.y) / distB;
            } else { // Vertical movement, penalize horizontal deviation
                penaltyA = Math.abs(a.x - currentPlanet.x) / distA;
                penaltyB = Math.abs(b.x - currentPlanet.x) / distB;
            }

            const scoreA = distA * (1 + penaltyA * 2);
            const scoreB = distB * (1 + penaltyB * 2);

            return scoreA - scoreB;
        });

        return candidates[0] || null;
    }
}
