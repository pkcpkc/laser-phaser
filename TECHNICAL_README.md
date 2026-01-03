# Laser Phaser - Technical Documentation

This document provides technical details for developers working on **Laser Phaser**.

> Everything in the universe—from galaxies and star systems to planet visuals and effects—is **procedurally created**. The only exceptions are the **ships**, which are hand-drawn by the kids (Leopold & Thaddeus) and then "pimped" for the digital realm by [**Nano Banana**](https://gemini.google/overview/image-generation/).

## 1. Tech Stack

**Laser Phaser** is a modern web-based shoot 'em up built with robust technologies to ensure high performance and a smooth development experience.

### Core Technologies
*   **Engine**: [Phaser 3](https://phaser.io/) - A fast, free, and fun open-source HTML5 game framework.
    *   **Physics**: Uses the integrated **Matter.js** engine for complex collision detection and body simulations.
*   **Language**: [TypeScript](https://www.typescriptlang.org/) - For type-safe, maintainable code.
*   **Build Tool**: [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling for lightning-fast development servers and optimized builds.



## 2. Testing Stack

We maintain a high standard of code quality through a comprehensive testing suite.

### Testing Frameworks
*   **Unit Testing**: [Vitest](https://vitest.dev/) - Blazing fast unit test framework. Used for core logic, managers, and utility functions.
    *   **Environment**: Uses `jsdom` to simulate a browser environment for DOM-related tests.
*   **End-to-End (E2E) Testing**: [Playwright](https://playwright.dev/) - Reliable testing for modern web apps. Used to verify game interactions and scene transitions across different browsers.

### Test Integrity & Automation
*   **Test Check Script**: `scripts/check-tests.ts` - Ensures that every source file in `src/` has a corresponding test file in `tests/`, maintaining 100% file coverage.
*   **Linter**: `tsc --noEmit` - Used for static type checking across the entire codebase.

## 3. Architecture

The game follows a modular, domain-driven architecture. The flow starts with asset preloading and transitions through a centralized map-based navigation system to various gameplay modes.

### Scene Flow & Transitions

```mermaid
graph TD
    %% Global Initial Flow
    BootScene --> PreloadScene
    PreloadScene --> GalaxyScene
    
    %% Main Navigation
    GalaxyScene <--> |"Explore / Mission Select"| ShootEmUpScene
    GalaxyScene <--> |"Customize Ship"| ShipyardScene
    GalaxyScene <--> |"Tactical Defense"| TowerDefenseScene
    
    %% Warp Mechanics
    ShootEmUpScene --> |"Victory Warp"| WormholeScene
    WormholeScene --> |"Transition"| GalaxyScene
    
    subgraph "Galaxy Navigation Architecture"
        GalaxyScene --> |"Configures"| GalaxyFactory
        GalaxyFactory --> |"Creates"| Galaxy
        GalaxyScene --> |"Visualizes"| PlanetVisual
        PlanetVisual --> |"Has many"| PlanetEffect
        GalaxyScene --> |"Manages"| GalaxyInteractionManager
        GalaxyScene --> |"UI"| LootUI
        GalaxyInteractionManager --> |"Triggers"| PlanetIntroOverlay
        PlanetIntroOverlay --> |"Fetches Text"| StorylineManager
    end

    subgraph "Shoot 'Em Up Logic"
        ShootEmUpScene --> |"Executes"| Level
        Level --> |"Spawns"| WaveRunner
        WaveRunner --> |"Instantiates"| Tactic
        Tactic --> |"Instantiates"| Formation
        Tactic --> |"Drives"| Formation
        Formation --> |"Positions"| Ships
        Ships --> |"Equipped with"| ShipModule
        ShipModule -.-> Drive
        ShipModule -.-> Weapon
        Weapon -.-> Laser
        Weapon -.-> Rocket
        Ships --> |"Explode into"| Loot
    end
```

### Key Components

*   **Galaxy System**: A modular configuration-driven map. Each galaxy (e.g., *Blood Hunters*) defines its own physics, backgrounds, and planet layouts.
*   **Wormhole Transition**: A cinematic transition scene used when jumping between galaxies, ensuring a smooth visual bridge.
*   **Storyline & Intros**: Managed by `StorylineManager` (parsing markdown data) and visualized via `PlanetIntroOverlay` to provide immersive briefings.
*   **Module System**: Ships are dynamically built using category-based modules (Drives, Lasers, Rockets), allowing for deep customization in the Shipyard.
*   **Tactic & Formation System**: Decouples enemy movement logic (`Tactics`) from spawn patterns (`Formations`). `WaveRunner` manages the lifecycle of a `Tactic`, which in turn instantiates and drives one or more `Formations`.

## 4. Asset Pipeline & Tooling

We use a custom asset pipeline and various tools to optimize game performance and help with asset creation:

*   **[Nano Banana](https://gemini.google/overview/image-generation/)**: The creative engine behind pimping hand-drawn ship assets for the digital realm.
*   **Meta SAM 3**: [Segment Anything Model](https://aidemos.meta.com/segment-anything/gallery) - Used for high-precision image segmentation during asset preparation.
*   **Texture Atlases**: Automatically generated from `public/assets` folders using `free-tex-packer-core`.
*   **Marker Generation**: Ship attachment points (markers) are extracted from ship PNGs to define where thrusters, lasers, and rockets attached.
*   **Custom Build Scripts**: Written in TypeScript/JavaScript, executed via `tsx` or `node`:
    *   `scripts/generate-markers.ts`: Extracts marker data from ship PNGs.
    *   `scripts/generate-atlases.js`: Orchestrates texture packing.
    *   `scripts/generate-color-palette.ts`: Analyzes assets for UI color matching.
*   **Image Processing**: Uses `pngjs` for low-level pixel analysis during marker and palette generation.

## 5. Storyline Management

Planet intro texts are managed in `res/storylines/storylines.md`. Grouped by galaxy and planet ID.

**Format:**
```markdown
## [galaxy-id]
### [planet-id]
Text content...
```

## 6. Markers Setup

Markers are special pixels defined directly in the ship's source image (`res/ships/*.png`) to define attachment points.

| Type | Color (Hex) | RGB | Description |
| :--- | :--- | :--- | :--- |
| **Thruster** | `#FFA500` | `255, 165, 0` | Positioning for engine trails. |
| **Laser** | `#00FF00` | `0, 255, 0` | Attachment point for laser cannons. |
| **Rocket** | `#FFFFFF` | `255, 255, 255` | Attachment point for rocket launchers. |
| **Origin** | `#0000FF` | `0, 0, 255` | Center point definition/Pivot. |

### Setting Orientation

To define the rotation (angle) of a marker, place a **Red Pixel** (`#FF0000`) adjacent to the marker pixel. The generator calculates the angle from the vector `(Marker -> Red Pixel)`.

### Color Palette Analysis

![Module Color Palette](./module-color-palette.png)

## 7. Getting Started

To fire up the engines and start developing, use the following commands:

### 7.1 NPM Scripts

#### Development Commands
*   `npm install`: Install project dependencies.
*   `npm run dev`: Start the development server at `http://localhost:5173`.
*   `npm run debug`: Start in debug mode (shows physics bodies and enables 'B' key state dump).
*   `npm run preview`: Preview the production build locally.

#### Build & Asset Commands
*   `npm run build`: Full production build (generates atlases, markers, and bundles the app).
*   `npm run build:atlases`: Manually regenerate texture atlases from `public/assets`.
*   `npm run build:markers`: Manually extract marker data from ship PNGs.
*   `npm run build:storylines`: Convert markdown storylines in `res/storylines/` to JSON in `public/assets/storylines/`.
*   `npm run build:colors`: Analyze assets for UI color matching.

#### Testing & Quality Commands
*   `npm test`: Run all unit tests with Vitest.
*   `npm run test:watch`: Run unit tests in watch mode.
*   `npm run test:check`: Verify that every source file has a corresponding test file.
*   `npm run test:e2e`: Run end-to-end tests with Playwright.
*   `npm run test:e2e-ui`: Run E2E tests with the Playwright UI.
*   `npm run lint`: Static type checking with TypeScript (`tsc --noEmit`).

### 7.2 Antigravity Workflows

We use **Antigravity** workflows to automate complex agentic tasks. These are defined in `.agent/workflows/`.

*   **/translate_storylines**: Automates the translation of the default English storyline (`storylines.md`) into all supported locales found in `res/storylines/`. Preserves markdown structure and proper nouns.

---

*Keep flying, keep shooting, and may the Force be with your phasers!*
