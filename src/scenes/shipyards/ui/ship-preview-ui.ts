import Phaser from 'phaser';
import { GameStatus } from '../../../logic/game-status';
import { BigCruiserDefinition } from '../../../ships/definitions/big-cruiser';
import { ModuleRegistry } from '../../../ships/modules/module-registry';
import { MerchantAnimator } from '../merchant-animator';

import { MountIconComponent } from './components/mount-icon-component';
import { LocaleManager } from '../../../config/locale-manager';
import { getText } from '../../../generated/merchant/merchant';

export class ShipPreviewUI {
    private centerContainer!: Phaser.GameObjects.Container;
    private mountIconsContainer!: Phaser.GameObjects.Container;

    private selectedMountIndex: number | null = null;
    private selectedMountType: string | null = null;
    private showMountIcons: boolean = true;

    constructor(
        private scene: Phaser.Scene,
        private merchantAnimator: MerchantAnimator | null,
        private x: number,
        private y: number,
        private onMountSelectionChanged: (index: number | null, type: string | null) => void,
        private refreshUI: () => void
    ) { }

    public create() {
        this.centerContainer = this.scene.add.container(this.x, this.y);
    }

    public getSelectedMountIndex(): number | null {
        return this.selectedMountIndex;
    }

    public getSelectedMountType(): string | null {
        return this.selectedMountType;
    }

    public clearMountSelection() {
        this.selectedMountIndex = null;
        this.selectedMountType = null;
    }

    public render() {
        this.centerContainer.removeAll(true);
        const gameStatus = GameStatus.getInstance();

        // Player Ship Hull
        const shipYOffset = 0;
        const hull = this.scene.add.image(0, shipYOffset, 'ships', 'big-cruiser').setAngle(-90).setScale(1.2);

        const loadout = gameStatus.getShipLoadout();

        this.centerContainer.add(hull);
        this.createEngineEffects(hull, shipYOffset, loadout);

        const markers = BigCruiserDefinition.markers;
        const originMarker = markers.find(m => m.type === 'origin');
        const originX = originMarker ? originMarker.x : (hull.width * 0.5);
        const originY = originMarker ? originMarker.y : (hull.height * 0.5);

        this.mountIconsContainer = this.scene.add.container(0, 0);
        this.mountIconsContainer.setVisible(this.showMountIcons);

        markers.forEach((marker, index) => {
            if (marker.type === 'origin') return;

            const moduleX = marker.x - originX;
            const moduleY = marker.y - originY;

            const cos = Math.cos(-Math.PI / 2);
            const sin = Math.sin(-Math.PI / 2);
            const rotatedX = (moduleX * cos - moduleY * sin) * 1.2;
            const rotatedY = (moduleX * sin + moduleY * cos) * 1.2;

            const isSelected = this.selectedMountIndex === index;
            const currentlyEquippedId = loadout[index];

            const mountPoint = new MountIconComponent({
                scene: this.scene,
                x: rotatedX,
                y: rotatedY,
                type: currentlyEquippedId ? 'minus' : 'plus',
                interactive: true,
                blink: isSelected && !currentlyEquippedId
            });

            mountPoint.on('pointerdown', () => {
                this.merchantAnimator?.speak();
                if (isSelected) {
                    this.clearMountSelection();
                } else {
                    this.selectedMountIndex = index;
                    this.selectedMountType = marker.type;

                    if (currentlyEquippedId) {
                        gameStatus.setShipLoadout(index, null);
                        gameStatus.addModule(currentlyEquippedId, 1);
                        this.clearMountSelection();
                    }
                }
                this.onMountSelectionChanged(this.selectedMountIndex, this.selectedMountType);
                this.refreshUI();
            });

            this.mountIconsContainer.add(mountPoint.container);
        });

        this.centerContainer.add(this.mountIconsContainer);

        const shipHalfWidth = hull.height * 1.2 / 2;
        const textHalfHeight = (13 + 4 * 2) / 2;
        const toggleX = shipHalfWidth + 5 + textHalfHeight;
        const locale = LocaleManager.getInstance().getLocale();
        const hideLabel = getText('merchant', 'hide_mounts', locale) || '[ HIDE MOUNTS ]';
        const showLabel = getText('merchant', 'show_mounts', locale) || '[ SHOW MOUNTS ]';
        const toggleLabel = this.showMountIcons ? hideLabel : showLabel;
        const toggleBtn = this.scene.add.text(toggleX, 0, toggleLabel, {
            fontFamily: 'Oswald, sans-serif',
            fontSize: '13px',
            color: '#666666',
            padding: { x: 6, y: 4 }
        }).setOrigin(0.5, 0.5).setAngle(-90).setInteractive({ useHandCursor: true });

        toggleBtn.on('pointerover', () => toggleBtn.setColor('#aaaaaa'));
        toggleBtn.on('pointerout', () => toggleBtn.setColor('#666666'));
        toggleBtn.on('pointerdown', () => {
            this.showMountIcons = !this.showMountIcons;
            this.refreshUI();
        });

        this.centerContainer.add(toggleBtn);
    }

    private createEngineEffects(hull: Phaser.GameObjects.Image, shipYOffset: number, loadout: Record<number, string | null>) {
        if (!this.scene.textures.exists('pixel')) {
            const graphics = this.scene.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(0, 0, 1, 1);
            graphics.generateTexture('pixel', 1, 1);
            graphics.destroy();
        }

        const markers = BigCruiserDefinition.markers;
        const originMarker = markers.find(m => m.type === 'origin');

        const originX = originMarker ? originMarker.x : ((hull.width || 100) * 0.5);
        const originY = originMarker ? originMarker.y : ((hull.height || 100) * 0.5);

        const cos = Math.cos(-Math.PI / 2);
        const sin = Math.sin(-Math.PI / 2);

        const particlesArr: Phaser.GameObjects.Particles.ParticleEmitter[] = [];

        markers.forEach((marker, index) => {
            if (marker.type === 'origin') return;

            const moduleX = marker.x - originX;
            const moduleY = marker.y - originY;

            const rotatedX = (moduleX * cos - moduleY * sin) * 1.2;
            const rotatedY = (moduleX * sin + moduleY * cos) * 1.2 + shipYOffset;

            const equippedId = loadout[index];
            const entry = equippedId ? ModuleRegistry[equippedId] : null;

            if (marker.type === 'drive') {
                if (!entry) return;

                const createCallback = (minSpeed: number, maxSpeed: number, spreadDeg: number, angleOffset: number = 90) => {
                    return (particle: Phaser.GameObjects.Particles.Particle) => {
                        const emitAngleRad = Phaser.Math.DegToRad(angleOffset);
                        const spreadRad = Phaser.Math.DegToRad(Phaser.Math.Between(-spreadDeg, spreadDeg));
                        const finalAngle = emitAngleRad + spreadRad;
                        const speed = Phaser.Math.Between(minSpeed, maxSpeed);
                        particle.velocityX = Math.cos(finalAngle) * speed;
                        particle.velocityY = Math.sin(finalAngle) * speed;
                    };
                };

                const engine = this.scene.add.particles(0, 0, 'flare-white', {
                    x: rotatedX,
                    y: rotatedY,
                    color: [0x00ffff, 0x0000ff],
                    alpha: { start: 1, end: 0 },
                    scale: { start: 0.25, end: 0.05 },
                    lifespan: { min: 300, max: 500 },
                    blendMode: 'ADD',
                    quantity: 1,
                    frequency: 20,
                    emitting: true,
                    emitCallback: createCallback(200, 300, 5)
                });
                particlesArr.push(engine);

            } else if (marker.type === 'laser') {
                if (!entry) return;

                const mod = new entry.moduleClass() as any;
                const particleColor = mod.COLOR || 0xff0000;
                let isRandom = false;
                let firingDelayMin = 200;
                let firingDelayMax = 200;
                const reloadTime = mod.reloadTime || 200;

                if (mod.firingDelay) {
                    isRandom = true;
                    firingDelayMin = mod.firingDelay.min;
                    firingDelayMax = mod.firingDelay.max;
                }

                const fire = this.scene.add.particles(rotatedX, rotatedY, 'pixel', {
                    angle: -90,
                    speed: 500,
                    scale: { start: 4, end: 2 },
                    alpha: { start: 1, end: 0 },
                    lifespan: 800,
                    tint: particleColor,
                    blendMode: 'ADD',
                    frequency: -1
                });

                const emitFire = () => {
                    if (!fire || !fire.active) return;
                    fire.emitParticle(1);

                    const nextTime = isRandom ? Phaser.Math.Between(firingDelayMin, firingDelayMax) : reloadTime;
                    this.scene.time.delayedCall(nextTime, emitFire);
                };
                emitFire();

                particlesArr.push(fire);
            }
        });

        this.centerContainer.add(particlesArr);
    }
}
