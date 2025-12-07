import Phaser from 'phaser';
import BootScene from './scenes/boot-scene';
import PreloadScene from './scenes/preload-scene';
import BloodHuntersScene from './scenes/blood-hunters';
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
  pixelArt: true,
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
  scene: [BootScene, PreloadScene, BloodHuntersScene]
};

// Clean up existing game instance if it exists (HMR)
const existingGame = (window as any).game;
if (existingGame) {
  existingGame.destroy(true);
}

const game = new Phaser.Game(config);
(window as any).game = game;

export default game;
