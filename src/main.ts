import Phaser from 'phaser';
import BloodHuntersScene from './scenes/blood-hunters';
import './style.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'app',
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 0 },
      debug: false // Set to true if you want to see physics bodies
    }
  },
  scene: [BloodHuntersScene]
};

export default new Phaser.Game(config);
