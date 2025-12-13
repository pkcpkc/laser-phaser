# Laser Phaser <a href="https://pkcpkc.github.io/laser-phaser/"><img align="right" src="https://img.shields.io/badge/PLAY-NOW-red?style=for-the-badge&logo=spaceship&logoColor=white" alt="Play Now"></a>

![Laser Phaser Logo](./docs/assets/laser-phaser-logo.png)

## Credits
Concept and design by **Leopold** and **Thaddeus**.  
Implemented with the help of [**Google Antigravity**](https://antigravity.google/), [**Phaser.io**](https://phaser.io/) and... **Paul** ;)

## Homage
This game is a homage to the legendary late 80s shooter games that defined the genre. We draw inspiration from the classics:

*   **R-Type**
*   **Xenon II Megablast**
*   **Blood Money**
*   **Katakis**

### Gallery

| Game | Cover | Gameplay |
| :--- | :---: | :---: |
| [**R-Type**](https://en.wikipedia.org/wiki/R-Type) | ![R-Type Cover](https://upload.wikimedia.org/wikipedia/en/thumb/8/80/R-Type_arcade_flyer.jpg/250px-R-Type_arcade_flyer.jpg) | ![R-Type Gameplay](https://upload.wikimedia.org/wikipedia/en/thumb/9/90/ARC_R-Type.png/250px-ARC_R-Type.png) |
| [**Xenon II Megablast**](https://en.wikipedia.org/wiki/Xenon_2:_Megablast) | ![Xenon II Cover](https://upload.wikimedia.org/wikipedia/en/thumb/d/d8/Xenon_2_Megablast_Amiga_cover.jpg/250px-Xenon_2_Megablast_Amiga_cover.jpg) | ![Xenon II Gameplay](https://upload.wikimedia.org/wikipedia/en/thumb/9/92/Xenon_II_Megablast_in-game_screenshot_%28Atari_ST%29.png/250px-Xenon_II_Megablast_in-game_screenshot_%28Atari_ST%29.png) |
| [**Blood Money**](https://en.wikipedia.org/wiki/Blood_Money_(video_game)) | ![Blood Money Cover](https://upload.wikimedia.org/wikipedia/en/thumb/7/71/Blood_Money_Coverart.png/250px-Blood_Money_Coverart.png) | ![Blood Money Gameplay](https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Blood_Money_gameplay_screenshot.jpg/250px-Blood_Money_gameplay_screenshot.jpg) |
| [**Katakis**](https://en.wikipedia.org/wiki/Katakis) | ![Katakis Cover](https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/Katakis_Coverart.png/250px-Katakis_Coverart.png) | ![Katakis Gameplay](https://upload.wikimedia.org/wikipedia/en/thumb/5/59/KatakisC64_01.png/250px-KatakisC64_01.png) |

## Technical Overview

**Laser Phaser** is a modern web-based shoot 'em up built with robust technologies to ensure high performance and a smooth development experience.

*   **Engine**: [Phaser 3](https://phaser.io/) - A fast, free, and fun open-source HTML5 game framework.
*   **Language**: [TypeScript](https://www.typescriptlang.org/) - For type-safe, maintainable code.
*   **Build Tool**: [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling for lightning-fast development servers and optimized builds.
*   **Testing**: [Vitest](https://vitest.dev/) - Blazing fast unit test framework.

### Game Entities & Architecture

```mermaid
graph TD
    PlanetMapScene --> |Navigates to| ShootEmUpScene
    PlanetMapScene --> |Navigates to| TraderScene
    PlanetMapScene --> |Navigates to| ShipyardScene
    
    subgraph ShootEmUp Architecture
        ShootEmUpScene --> |Contains| Level
        Level --> |Contains| Wave
        Wave --> |Uses| WaveType(WaveType<br/>e.g. Sinus)
        Wave --> |Uses| ShipConfig(ShipConfig<br/>e.g. BloodHunter2L)
        WaveType --> |Spawns| Ship
        Ship --> |Configured by| ShipConfig
        Ship --> |Has| Mount
        Mount --> |Equips| Weapon
    end

    subgraph PlanetMap Architecture
        PlanetMapScene --> |Uses| PlanetRegistry(Data)
        PlanetMapScene --> |Uses| PlanetVisuals(Visuals)
        PlanetMapScene --> |Uses| MapInteractionManager(UI)
        PlanetVisuals --> |Manages| EarthVisual
        PlanetVisuals --> |Manages| RingWorldVisual
        PlanetVisuals --> |Manages| AdjustableMoonVisual
    end
```

### Directory Structure

The project follows a domain-driven structure for scenes:

*   `src/scenes/planet-map-scene.ts`: The main hub.
*   `src/scenes/shoot-em-ups/`: Contains active gameplay levels (e.g., `blood-hunters.ts`).
*   `src/scenes/traders/`: Trading interfaces.
*   `src/scenes/shipyards/`: Upgrade interfaces.
*   `src/scenes/tower-defenses/`: Future tower defense modes.

### Getting Started

To fire up the engines and start developing:

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start the development server:**
    ```bash
    npm run dev
    ```

3.  **Build for production:**
    ```bash
    npm run build
    ```

4.  **Run tests:**
    ```bash
    npm test
    ```
