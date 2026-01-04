import Phaser from 'phaser';
import type { PlanetData } from '../../scenes/galaxies/planets/planet-data';

export interface IPlanetVisuals {
    createVisuals(planets: PlanetData[], galaxyId: string, onClick: (planet: PlanetData) => void): void;
    updateVisibility(planets: PlanetData[]): void;
    update(time: number, delta: number): void;
}

export interface IGalaxyInteractionManager {
    setGalaxyId(id: string): void;
    setStorylineCallback(callback: (planet: PlanetData) => void): void;
    launchLevelIfAvailable(planet: PlanetData): void;
}

export interface IPlayerShipController {
    create(): void;
    getShip(): Phaser.GameObjects.Sprite | null;
    update(time: number, delta: number): void;
    moveTo(x: number, y: number, duration?: number, onComplete?: () => void): void;
}

export interface IPlanetNavigator {
    moveToPlanet(planetId: string, instant?: boolean, delay?: number): void;
    navigate(dx: number, dy: number): void;
    handlePlanetClick(planet: PlanetData): void;
    showStoryline(planet: PlanetData): void;
    getCurrentPlanetId(): string;
    areControlsEnabled(): boolean;
}

export interface IPlanetIntroOverlay {
    show(name: string, description: string, planetId: string, color?: string, onComplete?: () => void): void;
    isVisible(): boolean;
}

export interface IWarpStarfield {
    setSpeed(speed: number): void;
    resize(width: number, height: number): void;
}
