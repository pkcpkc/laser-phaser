import Phaser from 'phaser';
console.log('Main.ts: initializing game...');
import BootScene from './scenes/boot-scene';
import PreloadScene from './scenes/preload-scene';
import BloodHuntersScene from './scenes/shoot-em-ups/blood-hunters-scene';
import PlanetMapScene from './scenes/planet-map-scene';
import ShipDemoScene from './scenes/shoot-em-ups/ship-demo-scene';
import TraderScene from './scenes/traders/trader-scene';
import ShipyardScene from './scenes/shipyards/shipyard-scene';
import TowerDefenseScene from './scenes/tower-defenses/tower-defense-scene';

import './style.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'app',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%'
  },
  pixelArt: false,
  input: {
    activePointers: 3
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 0 },
      debug: false // Set to true if you want to see physics bodies
    }
  },
  scene: [BootScene, PreloadScene, PlanetMapScene, BloodHuntersScene, ShipDemoScene, TraderScene, ShipyardScene, TowerDefenseScene]
};

// Clean up existing game instance if it exists (HMR)
const existingGame = (window as any).game;
if (existingGame) {
  existingGame.destroy(true);
}

const game = new Phaser.Game(config);
(window as any).game = game;

export default game;
