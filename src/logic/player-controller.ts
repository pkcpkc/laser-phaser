import Phaser from 'phaser';
import { Ship } from '../ships/ship';
import VirtualJoystick from 'phaser3-rex-plugins/plugins/virtualjoystick.js';
import { BigCruiser } from '../ships/big-cruiser';

export class PlayerController {
    private scene: Phaser.Scene;
    private ship: Ship;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private joystick: VirtualJoystick;
    private fireButton: Phaser.GameObjects.Text | null = null;
    private isFiring: boolean = false;
    private lastFired: number = 0;

    constructor(scene: Phaser.Scene, ship: Ship, cursors: Phaser.Types.Input.Keyboard.CursorKeys, joystick: VirtualJoystick) {
        this.scene = scene;
        this.ship = ship;
        this.cursors = cursors;
        this.joystick = joystick;
    }

    public setFireButton(fireButton: Phaser.GameObjects.Text) {
        this.fireButton = fireButton;
        this.fireButton.on('pointerdown', () => { this.isFiring = true; })
            .on('pointerup', () => { this.isFiring = false; })
            .on('pointerout', () => { this.isFiring = false; });
    }

    public update(time: number) {
        if (!this.ship.sprite.active) return;

        const { width, height } = this.scene.scale;

        // Movement
        if (this.cursors.left.isDown || this.joystick.left) {
            this.ship.sprite.thrustLeft(BigCruiser.gameplay.thrust || 0.1);
        } else if (this.cursors.right.isDown || this.joystick.right) {
            this.ship.sprite.thrustRight(BigCruiser.gameplay.thrust || 0.1);
        }

        if (this.cursors.up.isDown || this.joystick.up) {
            this.ship.sprite.thrust(BigCruiser.gameplay.thrust || 0.1);
        } else if (this.cursors.down.isDown || this.joystick.down) {
            this.ship.sprite.thrustBack(BigCruiser.gameplay.thrust || 0.1);
        }

        // Fire
        if (this.scene.input.keyboard!.checkDown(this.cursors.space, 250)) {
            this.fireLaser();
        }

        if (this.isFiring) {
            if (time > this.lastFired + 250) {
                this.fireLaser();
                this.lastFired = time;
            }
        }

        // Keep ship within game boundaries
        const margin = 30;
        const clampedX = Phaser.Math.Clamp(this.ship.sprite.x, margin, width - margin);
        const clampedY = Phaser.Math.Clamp(this.ship.sprite.y, margin, height - margin);

        if (this.ship.sprite.x !== clampedX || this.ship.sprite.y !== clampedY) {
            this.ship.sprite.setPosition(clampedX, clampedY);
            if (this.ship.sprite.x === clampedX) {
                this.ship.sprite.setVelocityX(0);
            }
            if (this.ship.sprite.y === clampedY) {
                this.ship.sprite.setVelocityY(0);
            }
        }
    }

    private fireLaser() {
        if (!this.ship.sprite.active) return;
        this.ship.fireLasers();
    }
}
