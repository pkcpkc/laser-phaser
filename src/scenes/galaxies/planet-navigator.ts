import { inject } from 'inversify';
import { SceneScoped } from '../../di/decorators';
import type { IPlanetNavigator } from '../../di/interfaces/galaxy';
import { type PlanetData } from './planets/planet-data';
import { PlayerShipController } from './player-ship-controller';
import { GalaxyInteractionManager } from './galaxy-interaction';
import { PlanetStoryline } from './planets/planet-storyline';
import { LootUI } from '../../ui/loot-ui';
import { GameStatus } from '../../logic/game-status';
import { StorylineManager } from '../../logic/storyline-manager';
import { Galaxy } from './galaxy';

/**
 * Handles planet navigation, travel animation, arrival, and intro coordination.
 */
@SceneScoped()
export class PlanetNavigator implements IPlanetNavigator {
    private currentPlanetId: string = '';
    private controlsEnabled: boolean = true;
    private galaxy!: Galaxy;
    private currentLocale: string = 'en';

    constructor(
        @inject(PlayerShipController) private shipController: PlayerShipController,
        @inject(GalaxyInteractionManager) private interactions: GalaxyInteractionManager,
        @inject(PlanetStoryline) private introOverlay: PlanetStoryline,
        @inject(LootUI) private lootUI: LootUI
    ) {
    }

    public config(galaxy: Galaxy, locale: string) {
        this.galaxy = galaxy;
        this.currentLocale = locale;
    }

    /**
     * Returns the current planet ID.
     */
    getCurrentPlanetId(): string {
        return this.currentPlanetId;
    }

    /**
     * Sets the current planet ID.
     */
    setCurrentPlanetId(planetId: string): void {
        this.currentPlanetId = planetId;
    }

    /**
     * Returns whether controls are enabled.
     */
    areControlsEnabled(): boolean {
        return this.controlsEnabled && !this.introOverlay.visible;
    }

    /**
     * Checks if a planet is locked based on victory requirements.
     */
    isPlanetLocked(planet: PlanetData): boolean {
        const required = planet.requiredVictories ?? 0;
        if (required <= 0) return false;

        const currentWins = GameStatus.getInstance().getVictories(this.galaxy.id);
        return currentWins < required;
    }

    /**
     * Handles planet click - either show UI or travel.
     */
    handlePlanetClick(planet: PlanetData): void {
        console.log(`PlanetNavigator: handlePlanetClick ${planet.name} (enabled: ${this.controlsEnabled}, overlay: ${this.introOverlay.visible})`);

        if (!this.areControlsEnabled()) {
            console.log('PlanetNavigator: Click ignored - controls disabled');
            return;
        }

        if (this.isPlanetLocked(planet)) {
            return;
        }

        if (this.currentPlanetId === planet.id) {
            this.interactions.showInteractionUI(planet);
            return;
        }

        this.travelToPlanet(planet);
    }

    /**
     * Animates travel to a planet.
     */
    travelToPlanet(target: PlanetData): void {
        if (this.isPlanetLocked(target)) return;

        this.interactions.hide();

        const targetX = target.x - 60;
        const targetY = target.y;

        this.shipController.travelTo(targetX, targetY, () => {
            this.arriveAtPlanet(target);
        });
    }

    /**
     * Handles arrival at a planet.
     */
    private arriveAtPlanet(planet: PlanetData): void {
        this.currentPlanetId = planet.id;

        const isHidden = planet.hidden || planet.hidden === undefined;
        if (isHidden) {
            this.revealPlanet(planet);
            return;
        }

        const introStarted = this.checkAndShowIntro(planet);
        if (!introStarted) {
            this.interactions.showInteractionUI(planet);
        }
    }

    /**
     * Checks for and shows intro if needed.
     */
    checkAndShowIntro(planet: PlanetData): boolean {
        const gameStatus = GameStatus.getInstance();
        const introText = StorylineManager.getInstance().getIntroText(
            this.galaxy.id,
            planet.id,
            this.currentLocale
        );

        if (introText && !gameStatus.hasSeenIntro(planet.id)) {
            if (this.lootUI) this.lootUI.setVisible(false);
            this.interactions.hide();

            this.introOverlay.show(planet, introText, () => {
                gameStatus.markIntroSeen(planet.id);
                if (this.lootUI) this.lootUI.setVisible(true);
                this.interactions.showInteractionUI(planet);
            });
            return true;
        }
        return false;
    }

    /**
     * Shows storyline for a planet (callback from interaction manager).
     */
    showStoryline(planet: PlanetData): void {
        const introText = StorylineManager.getInstance().getIntroText(
            this.galaxy.id,
            planet.id,
            this.currentLocale
        );
        if (!introText) return;

        if (this.lootUI) this.lootUI.setVisible(false);
        this.interactions.hide();

        this.introOverlay.show(planet, introText, () => {
            if (this.lootUI) this.lootUI.setVisible(true);
            this.interactions.showInteractionUI(planet);
        });
    }

    /**
     * Reveals a hidden planet.
     */
    private revealPlanet(planet: PlanetData): void {
        planet.hidden = false;
        GameStatus.getInstance().revealPlanet(planet.id);

        if (planet.emitter) {
            planet.emitter.destroy();
            planet.emitter = undefined;
        }

        const introStarted = this.checkAndShowIntro(planet);
        if (!introStarted) {
            this.interactions.showInteractionUI(planet);
        }
    }

    /**
     * Moves ship to planet position instantly.
     */
    moveToPlanet(planetId: string, instant: boolean = false): void {
        const planet = this.galaxy.getById(planetId);
        if (!planet) return;

        this.currentPlanetId = planetId;

        const shipX = planet.x - 60;
        const shipY = planet.y;

        if (instant) {
            this.shipController.setPosition(shipX, shipY);

            const introStarted = this.checkAndShowIntro(planet);
            if (!introStarted) {
                this.interactions.showInteractionUI(planet);
            }
        }
    }

    /**
     * Navigates to nearest neighbor planet in direction.
     */
    navigate(dx: number, dy: number): void {
        const bestCandidate = this.galaxy.findNearestNeighbor(this.currentPlanetId, dx, dy);
        if (bestCandidate && !this.isPlanetLocked(bestCandidate)) {
            this.travelToPlanet(bestCandidate);
        }
    }
}
