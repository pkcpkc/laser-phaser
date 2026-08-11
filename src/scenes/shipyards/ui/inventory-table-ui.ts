import Phaser from 'phaser';
import { GameStatus } from '../../../logic/game-status';
import { ModuleRegistry, calculateSellPrice } from '../../../ships/modules/module-registry';
import { MerchantAnimator } from '../merchant-animator';
import { LootType } from '../../../ships/types';
import { MountIconComponent } from './components/mount-icon-component';
import { LocaleManager } from '../../../config/locale-manager';
import { getText } from '../../../generated/merchant/merchant';

export class InventoryTableUI {
    private unifiedInvContainer!: Phaser.GameObjects.Container;
    private leftX: number = 0;
    private y: number = 0;
    private panelWidth: number = 0;

    constructor(
        private scene: Phaser.Scene,
        private merchantAnimator: MerchantAnimator | null,
        leftX: number,
        _rightX: number,
        y: number,
        panelWidth: number,
        _panelHeight: number,
        _isDesktop: boolean,
        private onMountCleared: () => void,
        private onRefreshUI: () => void,
        private setDialogue: (text: string) => void,
        private onHoverModule: (moduleId: string | null) => void
    ) {
        this.leftX = leftX;
        this.y = y;
        this.panelWidth = panelWidth;
    }

    public create() {
        this.unifiedInvContainer = this.scene.add.container(0, 0);
    }

    public updatePosition(leftX: number, _rightX: number, y: number, panelWidth: number, _panelHeight: number, _isDesktop: boolean) {
        this.leftX = leftX;
        this.y = y;
        this.panelWidth = panelWidth;
    }

    public render(selectedMountIndex: number | null, selectedMountType: string | null, activeTab: 'shop' | 'hangar') {
        this.unifiedInvContainer.removeAll(true);
        const gameStatus = GameStatus.getInstance();

        const playerInv = gameStatus.getModuleInventory();
        const merchantStock = gameStatus.getMerchantInventory();
        const availableModules = Object.entries(ModuleRegistry);

        const modules: Array<{ moduleId: string; entry: any; count: number }> = [];

        if (activeTab === 'shop') {
            for (const [moduleId, entry] of availableModules) {
                const mCount = merchantStock[moduleId] || 0;
                if (mCount > 0) {
                    modules.push({ moduleId, entry, count: mCount });
                }
            }
            this.renderPanelList(modules, this.leftX + 10, this.y, false, selectedMountIndex, selectedMountType);
        } else {
            for (const [moduleId, entry] of availableModules) {
                const pCount = playerInv[moduleId] || 0;
                if (pCount > 0) {
                    modules.push({ moduleId, entry, count: pCount });
                }
            }
            this.renderPanelList(modules, this.leftX + 10, this.y, true, selectedMountIndex, selectedMountType);
        }
    }

    private renderPanelList(
        modules: Array<{ moduleId: string; entry: any; count: number }>,
        panelX: number,
        listY: number,
        isPlayer: boolean,
        selectedMountIndex: number | null,
        selectedMountType: string | null
    ) {
        const locale = LocaleManager.getInstance().getLocale();
        const gameStatus = GameStatus.getInstance();
        const maxWidth = this.panelWidth - 20;

        const headerY = listY;
        const headerStyle = { 
            fontFamily: 'Oswald, sans-serif', 
            fontSize: '10px', 
            color: '#888888',
            fontStyle: 'bold'
        };

        const isEquipMode = selectedMountIndex !== null;

        // 2. Table Headers
        const headers = [
            this.scene.add.text(panelX, headerY, (getText('merchant', 'module', locale) || 'Module').toUpperCase(), headerStyle),
            this.scene.add.text(panelX + maxWidth * 0.38, headerY, (getText('merchant', 'dmg', locale) || 'Dmg').toUpperCase(), headerStyle).setOrigin(0.5, 0),
            this.scene.add.text(panelX + maxWidth * 0.48, headerY, (getText('merchant', 'rate', locale) || 'Rate').toUpperCase(), headerStyle).setOrigin(0.5, 0),
            this.scene.add.text(panelX + maxWidth * 0.58, headerY, (getText('merchant', 'thr', locale) || 'Thr').toUpperCase(), headerStyle).setOrigin(0.5, 0),
            this.scene.add.text(panelX + maxWidth * 0.68, headerY, (isPlayer ? 'OWNED' : 'STOCK').toUpperCase(), headerStyle).setOrigin(0.5, 0),
        ];

        if (isPlayer) {
            if (isEquipMode) {
                headers.push(
                    this.scene.add.text(panelX + maxWidth * 0.76, headerY, (getText('merchant', 'sell', locale) || 'Sell').toUpperCase(), headerStyle).setOrigin(0.5, 0),
                    this.scene.add.text(panelX + maxWidth * 0.91, headerY, (getText('merchant', 'mount', locale) || 'Mount').toUpperCase(), headerStyle).setOrigin(0.5, 0)
                );
            } else {
                headers.push(this.scene.add.text(panelX + maxWidth * 0.85, headerY, (getText('merchant', 'sell', locale) || 'Sell').toUpperCase(), headerStyle).setOrigin(0.5, 0));
            }
        } else {
            headers.push(this.scene.add.text(panelX + maxWidth * 0.85, headerY, (getText('merchant', 'buy', locale) || 'Buy').toUpperCase(), headerStyle).setOrigin(0.5, 0));
        }

        this.unifiedInvContainer.add(headers);

        let yPos = headerY + 18;

        for (const { moduleId, entry, count } of modules) {
            // Equip compatibility checks
            const isCompatible = selectedMountType ? moduleId.includes(selectedMountType) : true;
            const isDimmed = isPlayer && isEquipMode && !isCompatible;

            const cardAlpha = isDimmed ? 0.35 : 0.8;
            const textColor = isDimmed ? '#444444' : '#ffffff';

            // 3. Card Background
            const cardBg = this.scene.add.rectangle(
                panelX + maxWidth / 2, 
                yPos + 18, 
                maxWidth, 
                34, 
                0x121e30, 
                cardAlpha
            )
            .setStrokeStyle(1.5, 0x1f3454, isDimmed ? 0.4 : 1)
            .setOrigin(0.5);

            this.unifiedInvContainer.add(cardBg);

            // Card Hover
            if (!isDimmed) {
                cardBg.setInteractive({ useHandCursor: true });
                cardBg.on('pointerover', () => {
                    cardBg.setFillStyle(0x192d47, 0.95);
                    cardBg.setStrokeStyle(1.5, isPlayer ? 0x00bfff : 0x00ff88, 1);
                    
                    this.onHoverModule(moduleId);
                    
                    // Dialogue update on hover
                    if (isPlayer && isEquipMode) {
                        this.setDialogue(getText('merchant', 'dialogue_slot_select', locale) || 'Select a compatible module from inventory to install.');
                    } else if (!isPlayer) {
                        const price = entry.buyPrice;
                        const buyHoverText = (getText('merchant', 'dialogue_buy_hover', locale) || 'This module costs {cost}. Interested?')
                            .replace('{cost}', `${price.amount} ${price.type}`);
                        this.setDialogue(buyHoverText);
                    } else {
                        const sellPrice = calculateSellPrice(moduleId);
                        if (sellPrice) {
                            const sellHoverText = (getText('merchant', 'dialogue_sell_hover', locale) || 'I can buy this module for {cost}.')
                                .replace('{cost}', `${sellPrice.amount} ${sellPrice.type}`);
                            this.setDialogue(sellHoverText);
                        }
                    }
                });

                cardBg.on('pointerout', () => {
                    cardBg.setFillStyle(0x121e30, 0.8);
                    cardBg.setStrokeStyle(1.5, 0x1f3454, 1);
                    this.onHoverModule(null);
                    this.setDialogue(getText('merchant', 'dialogue_welcome', locale) || 'Welcome, pilot! Upgrade your ship with my high-tech modules.');
                });
            }

            // 4. Stats values
            const nameText = this.scene.add.text(panelX + 10, yPos + 18, entry.name, {
                fontFamily: 'Oswald, sans-serif', 
                fontSize: '11px', 
                color: textColor, 
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);

            const stats = entry.stats || {};
            const dmgStr = stats.damage ? `🎯${stats.damage}` : '-';
            const dmgText = this.scene.add.text(panelX + maxWidth * 0.38, yPos + 18, dmgStr, {
                fontFamily: 'Oswald, sans-serif', 
                fontSize: '11px', 
                color: isDimmed ? '#444444' : (stats.damage ? '#ff5533' : '#888888')
            }).setOrigin(0.5);

            const shotsPerSecond = stats.fireRate ? (1000 / stats.fireRate) : 0;
            const rateStr = shotsPerSecond > 0 ? `${shotsPerSecond.toFixed(1)}/s` : '-';
            const frText = this.scene.add.text(panelX + maxWidth * 0.48, yPos + 18, rateStr, {
                fontFamily: 'Oswald, sans-serif', 
                fontSize: '10px', 
                color: isDimmed ? '#444444' : (shotsPerSecond > 0 ? '#ffcc00' : '#888888')
            }).setOrigin(0.5);

            const thrustStr = stats.thrust ? `${Math.round(stats.thrust * 100)}` : '-';
            const thrustText = this.scene.add.text(panelX + maxWidth * 0.58, yPos + 18, thrustStr, {
                fontFamily: 'Oswald, sans-serif', 
                fontSize: '11px', 
                color: isDimmed ? '#444444' : (stats.thrust ? '#00e1ff' : '#888888')
            }).setOrigin(0.5);

            const countText = this.scene.add.text(panelX + maxWidth * 0.68, yPos + 18, `x${count}`, {
                fontFamily: 'Oswald, sans-serif', 
                fontSize: '11px', 
                color: isDimmed ? '#444444' : '#ffffff'
            }).setOrigin(0.5);

            this.unifiedInvContainer.add([nameText, dmgText, frText, thrustText, countText]);

            // 5. Actions (Interactive Mount/Trade Buttons)
            if (!isPlayer) {
                // BUY ACTION (Merchant Panel)
                const price = entry.buyPrice;
                const currentLoot = gameStatus.getLoot();
                const canAfford = currentLoot[price.type as LootType] >= price.amount;
                const priceColor = canAfford ? '#00ff88' : '#ff4444';
                const buyBtnX = panelX + maxWidth * 0.85;
                const buyBtnWidth = maxWidth * 0.22;

                const buyBtn = this.scene.add.rectangle(
                    buyBtnX, 
                    yPos + 18, 
                    buyBtnWidth, 
                    24, 
                    0x00ff88, 
                    canAfford ? 0.15 : 0.05
                )
                .setStrokeStyle(1, 0x00ff88, canAfford ? 0.8 : 0.2)
                .setOrigin(0.5);

                const buyText = this.scene.add.text(
                    buyBtnX, 
                    yPos + 18, 
                    `${price.amount}${price.type}`, 
                    {
                        fontFamily: 'Oswald, sans-serif', 
                        fontSize: '10px', 
                        color: priceColor, 
                        fontStyle: 'bold'
                    }
                ).setOrigin(0.5);

                if (canAfford) {
                    buyBtn.setInteractive({ useHandCursor: true });
                    buyBtn.on('pointerover', () => {
                        buyBtn.setFillStyle(0x00ff88, 0.35);
                        buyBtn.setStrokeStyle(1.5, 0x00ff88, 1);
                    });
                    buyBtn.on('pointerout', () => {
                        buyBtn.setFillStyle(0x00ff88, 0.15);
                        buyBtn.setStrokeStyle(1, 0x00ff88, 0.8);
                    });
                    buyBtn.on('pointerdown', () => {
                        gameStatus.updateLoot(price.type as LootType, -price.amount);
                        gameStatus.addModule(moduleId, 1);
                        gameStatus.removeMerchantStock(moduleId, 1);
                        
                        this.setDialogue(getText('merchant', 'dialogue_buy_success', locale) || 'Excellent purchase! That will serve you well.');
                        this.onRefreshUI();
                    });
                } else {
                    buyBtn.setInteractive({ useHandCursor: true });
                    buyBtn.on('pointerdown', () => {
                        this.setDialogue(getText('merchant', 'dialogue_buy_fail', locale) || "You don't have enough resources for this module.");
                    });
                }

                this.unifiedInvContainer.add([buyBtn, buyText]);
            } else {
                // PLAYER ACTIONS (Player Inventory Panel)
                const sellPrice = calculateSellPrice(moduleId);
                const hasMountOption = isEquipMode && isCompatible;

                // 1. Sell button
                const sellBtnX = hasMountOption ? (panelX + maxWidth * 0.76) : (panelX + maxWidth * 0.85);
                const sellBtnWidth = hasMountOption ? (maxWidth * 0.16) : (maxWidth * 0.22);

                if (sellPrice) {
                    const sellBtn = this.scene.add.rectangle(
                        sellBtnX, 
                        yPos + 18, 
                        sellBtnWidth, 
                        24, 
                        0xff7700, 
                        0.15
                    )
                    .setStrokeStyle(1, 0xff7700, 0.8)
                    .setOrigin(0.5)
                    .setInteractive({ useHandCursor: true });

                    const sellText = this.scene.add.text(
                        sellBtnX, 
                        yPos + 18, 
                        `${sellPrice.amount}${sellPrice.type}`, 
                        {
                            fontFamily: 'Oswald, sans-serif', 
                            fontSize: '10px', 
                            color: '#ff7700', 
                            fontStyle: 'bold'
                        }
                    ).setOrigin(0.5);

                    let confirmSell = false;
                    let confirmTimer: Phaser.Time.TimerEvent | null = null;

                    const clearConfirmation = () => {
                        if (confirmSell && sellBtn.active) {
                            confirmSell = false;
                            sellText.setText(`${sellPrice.amount}${sellPrice.type}`);
                            sellText.setColor('#ff7700');
                            sellBtn.setFillStyle(0xff7700, 0.15);
                            sellBtn.setStrokeStyle(1, 0xff7700, 0.8);
                        }
                        if (confirmTimer) {
                            confirmTimer.destroy();
                            confirmTimer = null;
                        }
                    };

                    sellBtn.on('pointerover', () => {
                        if (!confirmSell) {
                            sellBtn.setFillStyle(0xff7700, 0.35);
                            sellBtn.setStrokeStyle(1.5, 0xff7700, 1);
                        }
                    });
                    sellBtn.on('pointerout', () => {
                        if (!confirmSell) {
                            sellBtn.setFillStyle(0xff7700, 0.15);
                            sellBtn.setStrokeStyle(1, 0xff7700, 0.8);
                        }
                    });

                    sellBtn.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
                        event.stopPropagation();
                        if (!confirmSell) {
                            confirmSell = true;
                            sellText.setText(getText('merchant', 'sell_confirm', locale) || 'Sell?');
                            sellText.setColor('#ffffff');
                            sellBtn.setFillStyle(0xff3333, 0.65);
                            sellBtn.setStrokeStyle(1.5, 0xff3333, 1);
                            confirmTimer = this.scene.time.delayedCall(3000, clearConfirmation);
                        } else {
                            clearConfirmation();
                            gameStatus.removeModule(moduleId, 1);
                            gameStatus.updateLoot(sellPrice.type as LootType, sellPrice.amount);
                            gameStatus.addMerchantStock(moduleId, 1);
                            this.setDialogue(getText('merchant', 'dialogue_sell_success', locale) || 'Pleasure doing business with you, pilot!');
                            this.onRefreshUI();
                        }
                    });

                    this.unifiedInvContainer.add([sellBtn, sellText]);
                }

                // 2. Mount button (only if slot selected & compatible)
                if (hasMountOption) {
                    const mountPoint = new MountIconComponent({
                        scene: this.scene,
                        x: panelX + maxWidth * 0.91,
                        y: yPos + 18,
                        type: 'plus',
                        interactive: true,
                        blink: true,
                        color: 0x00bfff
                    });

                    mountPoint.on('pointerdown', () => {
                        this.merchantAnimator?.speak();
                        gameStatus.setShipLoadout(selectedMountIndex!, moduleId);
                        gameStatus.removeModule(moduleId, 1);
                        this.setDialogue(getText('merchant', 'dialogue_install_success', locale) || 'Module installed and ready for action!');
                        this.onMountCleared();
                        this.onRefreshUI();
                    });

                    this.unifiedInvContainer.add(mountPoint.container);
                }
            }

            yPos += 38;
        }
    }
}
