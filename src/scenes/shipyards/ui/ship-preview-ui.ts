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
    private shipBobContainer!: Phaser.GameObjects.Container;
    private mountIconsContainer!: Phaser.GameObjects.Container;
    private statsGraphics!: Phaser.GameObjects.Graphics;

    private selectedMountIndex: number | null = null;
    private selectedMountType: string | null = null;
    private showMountIcons: boolean = true;
    private hoveredModuleId: string | null = null;
    private statsTextElements: Phaser.GameObjects.Text[] = [];

    constructor(
        private scene: Phaser.Scene,
        private merchantAnimator: MerchantAnimator | null,
        private x: number,
        private y: number,
        _panelWidth: number,
        private isDesktop: boolean,
        private onMountSelectionChanged: (index: number | null, type: string | null) => void,
        private refreshUI: () => void
    ) { }

    public create() {
        this.centerContainer = this.scene.add.container(this.x, this.y);
        this.statsGraphics = this.scene.add.graphics();
        this.centerContainer.add(this.statsGraphics);
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

    public updatePosition(x: number, y: number, _panelWidth: number, isDesktop: boolean) {
        this.x = x;
        this.y = y;
        this.isDesktop = isDesktop;
        if (this.centerContainer) {
            this.centerContainer.setPosition(x, y);
        }
    }

    public setHoveredModule(moduleId: string | null) {
        this.hoveredModuleId = moduleId;
        this.renderStats();
    }

    public render() {
        // Clear all except background graphics which we manually draw on
        this.centerContainer.removeAll(true);
        this.statsGraphics = this.scene.add.graphics();
        this.centerContainer.add(this.statsGraphics);
        this.statsTextElements = [];

        const gameStatus = GameStatus.getInstance();
        const loadout = gameStatus.getShipLoadout();

        // 1. Ship Bob Container (groups hull, particles, slots to float together)
        this.shipBobContainer = this.scene.add.container(0, -35);
        this.centerContainer.add(this.shipBobContainer);

        // Player Ship Hull
        const hull = this.scene.add.image(0, 0, 'ships', 'big-cruiser').setAngle(-90).setScale(1.2);
        this.shipBobContainer.add(hull);

        // Float Animation
        this.scene.tweens.add({
            targets: this.shipBobContainer,
            y: { from: -39, to: -31 },
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 2. Engine and Laser particles (inside bob container so they float with ship)
        this.createEngineEffects(hull, loadout);

        // 3. Mount Slot Reticles
        const markers = BigCruiserDefinition.markers;
        const originMarker = markers.find(m => m.type === 'origin');
        const originX = originMarker ? originMarker.x : (hull.width * 0.5);
        const originY = originMarker ? originMarker.y : (hull.height * 0.5);

        this.mountIconsContainer = this.scene.add.container(0, 0);
        this.mountIconsContainer.setVisible(this.showMountIcons);
        this.shipBobContainer.add(this.mountIconsContainer);

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
            
            // Choose colors based on slot types
            let slotColor = 0x00bfff; // cyan for drive
            if (marker.type === 'laser') slotColor = 0x00ff88; // green for laser
            if (marker.type === 'rocket') slotColor = 0xff8800; // orange for rocket

            const mountPoint = new MountIconComponent({
                scene: this.scene,
                x: rotatedX,
                y: rotatedY,
                type: currentlyEquippedId ? 'minus' : 'plus',
                interactive: true,
                blink: isSelected && !currentlyEquippedId,
                color: slotColor
            });

            // Extra pulsing ring if selected
            if (isSelected) {
                const selectRing = this.scene.add.graphics();
                selectRing.lineStyle(1.5, 0xffffff, 0.8);
                selectRing.strokeCircle(rotatedX, rotatedY, 15);
                this.mountIconsContainer.add(selectRing);
                
                this.scene.tweens.add({
                    targets: selectRing,
                    scale: 1.15,
                    alpha: 0.2,
                    duration: 850,
                    repeat: -1,
                    yoyo: true
                });
            }

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
                        
                        const locale = LocaleManager.getInstance().getLocale();
                        this.scene.events.emit('merchant_dialogue', getText('merchant', 'dialogue_uninstall_success', locale) || 'Module returned to your inventory.');
                        this.clearMountSelection();
                    }
                }
                this.onMountSelectionChanged(this.selectedMountIndex, this.selectedMountType);
                this.refreshUI();
            });

            this.mountIconsContainer.add(mountPoint.container);
        });

        // 4. Toggle Mounts UI Button (Drawn vertically on the right side of the ship)
        const locale = LocaleManager.getInstance().getLocale();
        const hideLabel = getText('merchant', 'hide_mounts', locale) || '[ HIDE MOUNTS ]';
        const showLabel = getText('merchant', 'show_mounts', locale) || '[ SHOW MOUNTS ]';
        const toggleLabel = this.showMountIcons ? hideLabel : showLabel;

        const toggleBtn = this.scene.add.text(50, -35, toggleLabel, {
            fontFamily: 'Oswald, sans-serif',
            fontSize: '11px',
            color: '#888888',
            fontStyle: 'bold',
            padding: { x: 6, y: 4 }
        }).setOrigin(0.5, 0.5).setAngle(-90).setInteractive({ useHandCursor: true });

        toggleBtn.on('pointerover', () => toggleBtn.setColor('#00bfff'));
        toggleBtn.on('pointerout', () => toggleBtn.setColor('#888888'));
        toggleBtn.on('pointerdown', () => {
            this.showMountIcons = !this.showMountIcons;
            this.refreshUI();
        });

        this.centerContainer.add(toggleBtn);

        // Render Stats Dashboard
        this.renderStats();
    }

    private renderStats() {
        if (!this.statsGraphics) return;

        this.statsGraphics.clear();
        
        // Clean up old stats text elements
        this.statsTextElements.forEach(el => el.destroy());
        this.statsTextElements = [];

        const gameStatus = GameStatus.getInstance();
        const loadout = gameStatus.getShipLoadout();

        // 1. Current Stats
        const currentStats = this.calculateLoadoutStats(loadout);

        // 2. Projected Stats (if hovering a module in the shop)
        let projFirepower: number | null = null;
        let projThrust: number | null = null;

        if (this.hoveredModuleId && this.selectedMountIndex !== null) {
            const tempLoadout = { ...loadout };
            tempLoadout[this.selectedMountIndex] = this.hoveredModuleId;
            const projected = this.calculateLoadoutStats(tempLoadout);
            projFirepower = projected.firepower;
            projThrust = projected.thrust;
        }

        // Draw vertical progress bars side-by-side on the right of the ship
        // Firepower bar at relative X = 135, Thrust bar at relative X = 205
        this.drawStatBar(this.statsGraphics, 'FIREPOWER', currentStats.firepower, projFirepower, 40, 135);
        this.drawStatBar(this.statsGraphics, 'THRUST', currentStats.thrust, projThrust, 30, 205);
    }

    private drawStatBar(
        graphics: Phaser.GameObjects.Graphics, 
        label: string, 
        current: number, 
        projected: number | null, 
        maxVal: number, 
        x: number
    ) {
        const barY = this.isDesktop ? -40 : -65;
        const barW = 12;
        const barH = 85; 
        const bottomY = barY + barH; // 45
        
        // Value text
        const currentTextStr = projected !== null && projected !== current 
            ? `${current.toFixed(1)} -> ${projected.toFixed(1)}` 
            : `${current.toFixed(1)}`;
        
        const valColor = projected !== null && projected !== current
            ? (projected > current ? '#00ff88' : '#ff3333')
            : '#ffffff';

        // Draw label text horizontally below the bars, directly on top of the inventory panel
        const labelText = this.scene.add.text(x + barW / 2, bottomY + 8, label, {
            fontFamily: 'Oswald, sans-serif', 
            fontSize: '9px', 
            color: '#00bfff', 
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        const valText = this.scene.add.text(x + barW / 2, bottomY + 20, currentTextStr, {
            fontFamily: 'Oswald, sans-serif', 
            fontSize: '9px', 
            color: valColor, 
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        this.centerContainer.add([labelText, valText]);
        this.statsTextElements.push(labelText, valText);

        // Draw track
        graphics.fillStyle(0x131f31, 0.95);
        graphics.fillRoundedRect(x, barY, barW, barH, barW / 2);
        graphics.lineStyle(1, 0x223652, 1);
        graphics.strokeRoundedRect(x, barY, barW, barH, barW / 2);

        // Current fill height
        const currentFillH = Math.min(barH, (current / maxVal) * barH);
        
        if (projected === null || projected === current) {
            // Draw current fill (cyan)
            graphics.fillStyle(0x00d2ff, 1);
            graphics.fillRoundedRect(x, bottomY - currentFillH, barW, currentFillH, barW / 2);
        } else if (projected > current) {
            // Stats improve! Draw current fill (cyan) and projected change (green)
            graphics.fillStyle(0x00d2ff, 1);
            graphics.fillRoundedRect(x, bottomY - currentFillH, barW, currentFillH, barW / 2);
            
            const projFillH = Math.min(barH, (projected / maxVal) * barH);
            graphics.fillStyle(0x00ff88, 1);
            graphics.fillRect(x, bottomY - projFillH, barW, projFillH - currentFillH);
        } else {
            // Stats decrease! Draw current fill up to projected (cyan), then red loss segment
            const projFillH = Math.min(barH, (projected / maxVal) * barH);
            graphics.fillStyle(0x00d2ff, 1);
            graphics.fillRoundedRect(x, bottomY - projFillH, barW, projFillH, barW / 2);
            
            graphics.fillStyle(0xff3333, 1);
            graphics.fillRect(x, bottomY - currentFillH, barW, currentFillH - projFillH);
        }
    }

    private calculateLoadoutStats(loadout: Record<number, string | null>) {
        let firepower = 0;
        let thrust = 0;
        for (const [_indexStr, moduleId] of Object.entries(loadout)) {
            if (!moduleId) continue;
            const entry = ModuleRegistry[moduleId];
            if (!entry) continue;
            if (entry.stats) {
                if (entry.stats.damage && entry.stats.fireRate) {
                    firepower += entry.stats.damage * (1000 / entry.stats.fireRate);
                }
                if (entry.stats.thrust) {
                    thrust += entry.stats.thrust * 100;
                }
            }
        }
        return { firepower, thrust };
    }

    private createEngineEffects(hull: Phaser.GameObjects.Image, loadout: Record<number, string | null>) {
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

            // Compute rotated slot coordinates relative to bob container center
            const rotatedX = (moduleX * cos - moduleY * sin) * 1.2;
            const rotatedY = (moduleX * sin + moduleY * cos) * 1.2;

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

        this.shipBobContainer.add(particlesArr);
    }
}
