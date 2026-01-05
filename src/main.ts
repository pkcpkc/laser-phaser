import 'reflect-metadata';
import Phaser from 'phaser';
console.log('Main.ts: initializing game...');
import BootScene from './scenes/boot-scene';
import PreloadScene from './scenes/preload-scene';
import { ShootEmUpScene } from './scenes/shoot-em-ups/shoot-em-up-scene';
import GalaxyScene from './scenes/galaxies/galaxy-scene';
import ShipyardScene from './scenes/shipyards/shipyard-scene';
import TowerDefenseScene from './scenes/tower-defenses/tower-defense-scene';
import WormholeScene from './scenes/wormhole-scene';

import './style.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 900,
  height: 1200,
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
      debug: import.meta.env.MODE === 'debug' // Set to true if you want to see physics bodies
    }
  },
  scene: [BootScene, PreloadScene, GalaxyScene, ShootEmUpScene, ShipyardScene, TowerDefenseScene, WormholeScene]
};

// Clean up existing game instance if it exists (HMR)
const existingGame = (window as any).game;
if (existingGame) {
  existingGame.destroy(true);
}

const game = new Phaser.Game(config);
(window as any).game = game;

// Prevent game from pausing when window loses focus (critical for background e2e tests)
game.events.off('blur');
game.events.off('focus');

export default game;
