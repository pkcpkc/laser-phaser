import Phaser from 'phaser';
import { GameStatus } from '../../../logic/game-status';
import { ModuleRegistry, calculateSellPrice } from '../../../ships/modules/module-registry';
import { MerchantAnimator } from '../merchant-animator';
import { LootType } from '../../../ships/types';

export class InventoryTableUI {
    private unifiedInvContainer!: Phaser.GameObjects.Container;

    constructor(
        private scene: Phaser.Scene,
        private merchantAnimator: MerchantAnimator | null,
        private x: number,
        private y: number,
        private maxWidth: number,
        private onMountCleared: () => void,
        private refreshUI: () => void
    ) { }

    public create() {
        this.unifiedInvContainer = this.scene.add.container(0, 0);
    }

    public render(selectedMountIndex: number | null, selectedMountType: string | null) {
        this.unifiedInvContainer.removeAll(true);
        const gameStatus = GameStatus.getInstance();

        const title = this.scene.add.text(this.x, this.y, 'MERCHANT WARES', {
            fontFamily: 'Oswald, sans-serif', fontSize: '24px', color: '#aaa', fontStyle: 'bold'
        });
        this.unifiedInvContainer.add(title);

        const headerY = this.y + 35;
        const headerStyle = { fontFamily: 'Oswald, sans-serif', fontSize: '12px', color: '#aaaaaa' };

        const isEquipMode = selectedMountIndex !== null;

        const headers = [
            this.scene.add.text(this.x + 5, headerY, 'Module', headerStyle),
            this.scene.add.text(this.x + 95, headerY, 'Dmg', headerStyle),
            this.scene.add.text(this.x + 130, headerY, 'Rate', headerStyle),
            this.scene.add.text(this.x + 170, headerY, 'Thr', headerStyle),
        ];

        if (isEquipMode) {
            headers.push(this.scene.add.text(this.x + 250, headerY, 'Mount', headerStyle).setOrigin(0.5, 0));
        } else {
            headers.push(
                this.scene.add.text(this.x + 225, headerY, 'Buy', headerStyle),
                this.scene.add.text(this.x + 285, headerY, 'Sell', headerStyle)
            );
        }

        this.unifiedInvContainer.add(headers);

        let yPos = headerY + 25;

        const playerInv = gameStatus.getModuleInventory();
        const merchantStock = gameStatus.getMerchantInventory();
        const availableModules = Object.entries(ModuleRegistry);

        for (const [moduleId, entry] of availableModules) {
            const pCount = playerInv[moduleId] || 0;
            const mCount = merchantStock[moduleId] || 0;

            if (pCount === 0 && mCount === 0) continue;

            const isCompatible = selectedMountType ? moduleId.includes(selectedMountType) : true;

            const color = isEquipMode && !isCompatible ? '#444444' : '#ffffff';

            const rowBg = this.scene.add.rectangle(this.x, yPos, this.maxWidth, 35, 0x000000, 0).setOrigin(0);

            const nameText = this.scene.add.text(this.x + 5, yPos + 10, entry.name, {
                fontFamily: 'Oswald, sans-serif', fontSize: '14px', color: color, wordWrap: { width: 85 }
            });

            const stats = entry.stats || {};
            const dmgText = this.scene.add.text(this.x + 95, yPos + 10, stats.damage ? stats.damage.toString() : '-', {
                fontFamily: 'Oswald, sans-serif', fontSize: '13px', color: color
            });
            const frText = this.scene.add.text(this.x + 130, yPos + 10, stats.fireRate ? (stats.fireRate / 10).toString() : '-', {
                fontFamily: 'Oswald, sans-serif', fontSize: '13px', color: color
            });
            const thrustText = this.scene.add.text(this.x + 170, yPos + 10, stats.thrust ? (stats.thrust * 100).toString() : '-', {
                fontFamily: 'Oswald, sans-serif', fontSize: '13px', color: color
            });

            this.unifiedInvContainer.add([rowBg, nameText, dmgText, frText, thrustText]);

            if (isEquipMode) {
                if (isCompatible && pCount > 0) {
                    const iconX = this.x + 250; // Center of the Buy column
                    const iconY = yPos + 17;

                    const iconLabel = this.scene.add.text(0, 0, '⚫️', {
                        fontSize: '24px',
                        padding: { x: 5, y: 5 },
                        shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, stroke: false, fill: true }
                    }).setOrigin(0.5);

                    const plusLabel = this.scene.add.text(0, -2, '+', {
                        fontFamily: 'Oswald, sans-serif',
                        fontSize: '28px',
                        color: '#ffffff',
                        fontStyle: 'bold',
                        align: 'center',
                        shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 3, stroke: false, fill: true }
                    }).setOrigin(0.5);

                    const mountPoint = this.scene.add.container(iconX, iconY, [iconLabel, plusLabel])
                        .setSize(30, 30)
                        .setInteractive({ useHandCursor: true });

                    this.scene.tweens.add({
                        targets: mountPoint,
                        alpha: 0.2,
                        duration: 400,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });

                    mountPoint.on('pointerdown', () => {
                        this.merchantAnimator?.speak();
                        gameStatus.setShipLoadout(selectedMountIndex!, moduleId);
                        gameStatus.removeModule(moduleId, 1);
                        this.onMountCleared();
                        this.refreshUI();
                    });

                    this.unifiedInvContainer.add(mountPoint);
                }
            } else {
                if (mCount > 0) {
                    const price = entry.buyPrice;
                    const currentLoot = gameStatus.getLoot();
                    const canAfford = currentLoot[price.type as LootType] >= price.amount;

                    const priceColor = canAfford ? '#ffffff' : '#ff4444';
                    const hoverBgColor = 0x444444;

                    const buyBoxX = this.x + 225;
                    const buyBox = this.scene.add.rectangle(buyBoxX, yPos, 50, 35)
                        .setOrigin(0);

                    // Ensure it is interactive even if transparent
                    buyBox.isFilled = false;

                    if (canAfford) buyBox.setInteractive({ useHandCursor: true });

                    const buyText = this.scene.add.text(buyBoxX + 25, yPos + 17, `${price.amount} ${price.type}`, {
                        fontFamily: 'Oswald, sans-serif', fontSize: '13px', color: priceColor, align: 'center'
                    }).setOrigin(0.5);

                    buyBox.on('pointerdown', () => {
                        if (canAfford) {
                            this.merchantAnimator?.speak();
                            gameStatus.updateLoot(price.type as LootType, -price.amount);
                            gameStatus.addModule(moduleId, 1);
                            gameStatus.removeMerchantStock(moduleId, 1);
                            this.refreshUI();
                        }
                    });

                    buyBox.on('pointerover', () => { if (canAfford) { buyBox.isFilled = true; buyBox.setFillStyle(hoverBgColor); } });
                    buyBox.on('pointerout', () => { if (canAfford) { buyBox.isFilled = false; } });

                    this.unifiedInvContainer.add([buyBox, buyText]);
                }

                if (pCount > 0) {
                    const sellBoxX = this.x + 285;
                    const hoverBgColor = 0x444444;

                    const sellPrice = calculateSellPrice(moduleId);
                    if (sellPrice) {
                        const sellBox = this.scene.add.rectangle(sellBoxX, yPos, 50, 35)
                            .setOrigin(0).setInteractive({ useHandCursor: true });
                        sellBox.isFilled = false;

                        const sellText = this.scene.add.text(sellBoxX + 25, yPos + 17, `${sellPrice.amount} ${sellPrice.type}`, {
                            fontFamily: 'Oswald, sans-serif', fontSize: '13px', color: '#ffffff', align: 'center'
                        }).setOrigin(0.5);

                        let confirmSell = false;
                        let cancelListener: (() => void) | null = null;
                        let confirmTimer: Phaser.Time.TimerEvent | null = null;

                        const clearConfirmation = () => {
                            if (confirmSell && sellBox.active) {
                                confirmSell = false;
                                sellText.setText(`${sellPrice.amount} ${sellPrice.type}`);
                                sellText.setColor(color);
                                sellBox.setStrokeStyle();
                                sellBox.isFilled = false;
                            }
                            if (cancelListener) {
                                this.scene.input.off('pointerdown', cancelListener);
                                cancelListener = null;
                            }
                            if (confirmTimer) {
                                confirmTimer.destroy();
                                confirmTimer = null;
                            }
                        };

                        sellBox.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
                            event.stopPropagation();

                            if (!confirmSell) {
                                confirmSell = true;
                                sellText.setText('Sell?');
                                sellText.setColor('#ff4444');
                                sellBox.setStrokeStyle(1, 0xff0000);
                                sellBox.setFillStyle(0x551111);

                                confirmTimer = this.scene.time.delayedCall(3000, clearConfirmation);

                                this.scene.time.delayedCall(1, () => {
                                    cancelListener = () => clearConfirmation();
                                    this.scene.input.once('pointerdown', cancelListener);
                                });
                            } else {
                                clearConfirmation();
                                this.merchantAnimator?.speak();
                                gameStatus.removeModule(moduleId, 1);
                                gameStatus.updateLoot(sellPrice.type as LootType, sellPrice.amount);
                                gameStatus.addMerchantStock(moduleId, 1);
                                this.refreshUI();
                            }
                        });
                        sellBox.on('pointerover', () => { if (!confirmSell) { sellBox.isFilled = true; sellBox.setFillStyle(hoverBgColor); } });
                        sellBox.on('pointerout', () => { if (!confirmSell) { sellBox.isFilled = false; } });

                        this.unifiedInvContainer.add([sellBox, sellText]);
                    }
                }
            }

            yPos += 45;
        }
    }
}
