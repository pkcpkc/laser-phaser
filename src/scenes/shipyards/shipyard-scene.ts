import Phaser from 'phaser';
import { setupDebugKey } from '../../logic/debug-utils';
import { GameStatus } from '../../logic/game-status';
import { BigCruiserDefinition } from '../../ships/definitions/big-cruiser';
import { MerchantAnimator } from './merchant-animator';
import { CurrencyHeaderUI } from './ui/currency-header-ui';
import { MerchantPortraitUI } from './ui/merchant-portrait-ui';
import { InventoryTableUI } from './ui/inventory-table-ui';
import { ShipPreviewUI } from './ui/ship-preview-ui';
import { LocaleManager } from '../../config/locale-manager';
import { getText } from '../../generated/merchant/merchant';

interface LayoutMetrics {
    isDesktop: boolean;
    panelWidth: number;
    panelHeight: number;
    leftPanelX: number;
    rightPanelX: number;
    panelY: number;
    merchantX: number;
    merchantY: number;
    inventoryX: number;
    inventoryY: number;
    shipX: number;
    shipY: number;
}

export default class ShipyardScene extends Phaser.Scene {
    private gameStatus!: GameStatus;

    private currencyHeaderUI!: CurrencyHeaderUI;
    private merchantPortraitUI!: MerchantPortraitUI;
    private inventoryTableUI!: InventoryTableUI;
    private shipPreviewUI!: ShipPreviewUI;

    private merchantAnimator: MerchantAnimator | null = null;

    private sourceGalaxyId?: string;
    private sourcePlanetId?: string;
    private shipyardConfig?: { image: string; goods: Record<string, number> };

    private panelBgGraphics!: Phaser.GameObjects.Graphics;
    private layoutMetrics!: LayoutMetrics;
    private activeTab: 'shop' | 'hangar' = 'shop';
    private tabButtons: Phaser.GameObjects.GameObject[] = [];

    constructor() {
        super('ShipyardScene');
    }

    init(data: any) {
        this.sourceGalaxyId = data.galaxyId;
        this.sourcePlanetId = data.planetId;
        this.shipyardConfig = data.shipyardConfig;
    }

    private getLayoutMetrics(): LayoutMetrics {
        const { width, height } = this.scale;
        const isDesktop = width >= 768;

        if (isDesktop) {
            const panelY = 301; // Panel and tabs moved down to 301
            const panelWidth = Math.min(370, (width - 60) / 2);
            const panelHeight = Math.min(500, height - panelY - 30);
            
            const totalW = panelWidth * 2 + 20;
            const leftPanelX = (width - totalW) / 2;
            const rightPanelX = leftPanelX + panelWidth + 20;

            return {
                isDesktop: true,
                panelWidth,
                panelHeight,
                leftPanelX,
                rightPanelX,
                panelY,
                merchantX: leftPanelX + 50,
                merchantY: 150, // Kept at top position
                inventoryX: leftPanelX,
                inventoryY: panelY + 15,
                shipX: rightPanelX + 90,
                shipY: 150 // Kept at top position
            };
        } else {
            // Mobile (vertical stack)
            const panelWidth = width - 40;
            const panelHeight = Math.min(160, (height - 430) / 2);
            const panelY = 386; // Shifted 46px down from 340

            const leftPanelX = 20;
            const rightPanelX = 20;

            return {
                isDesktop: false,
                panelWidth,
                panelHeight,
                leftPanelX,
                rightPanelX,
                panelY,
                merchantX: 60,
                merchantY: 116, // Shifted 46px down from 70
                inventoryX: leftPanelX,
                inventoryY: panelY + 15,
                shipX: 80,
                shipY: 291 // Shifted 46px down from 245
            };
        }
    }

    create() {
        this.gameStatus = GameStatus.getInstance();
        const locale = LocaleManager.getInstance().getLocale();
        const { width, height } = this.scale;

        // Background
        this.add.tileSprite(0, 0, width, height, 'metal-bg').setOrigin(0).setTint(0x444455);

        // Panel backgrounds graphics
        this.panelBgGraphics = this.add.graphics();

        // Back Button
        const backButton = this.add.text(20, 20, getText('merchant', 'back', locale) || '◀ Back', {
            fontFamily: 'Oswald, sans-serif',
            fontSize: '20px',
            color: '#00ff00',
            padding: { x: 5, y: 5 }
        }).setOrigin(0, 0.5).setInteractive();

        backButton.on('pointerdown', () => {
            this.scene.start('GalaxyScene', {
                galaxyId: this.sourceGalaxyId,
                planetId: this.sourcePlanetId
            });
        });

        // Initialize layout metrics
        this.layoutMetrics = this.getLayoutMetrics();

        // Components
        this.currencyHeaderUI = new CurrencyHeaderUI(this);
        this.merchantPortraitUI = new MerchantPortraitUI(this, this.layoutMetrics.merchantX, this.layoutMetrics.merchantY, this.layoutMetrics.panelWidth, this.shipyardConfig);

        const onRefreshUI = () => this.refreshUI();

        // Pass a wrapper to update local selected mount state and re-render
        const onMountSelectionChanged = (index: number | null, _type: string | null) => {
            if (index !== null) {
                this.activeTab = 'hangar';
                this.refreshUI();
            }
        };

        const onMountCleared = () => {
            if (this.shipPreviewUI) {
                this.shipPreviewUI.clearMountSelection();
            }
        };

        // Initialize state
        this.populateDefaultLoadout();
        this.initializeMerchantStock();

        // Initial render
        this.currencyHeaderUI.create();
        this.currencyHeaderUI.update();

        this.merchantPortraitUI.create();
        this.merchantAnimator = this.merchantPortraitUI.getAnimator();

        const setDialogue = (text: string) => this.merchantPortraitUI.setDialogueText(text);
        const onHoverModule = (moduleId: string | null) => this.shipPreviewUI.setHoveredModule(moduleId);

        // Listen for internal shipyard custom events
        this.events.on('merchant_dialogue', (text: string) => {
            setDialogue(text);
        });

        // Update components that need the animator
        const initialUnifiedW = this.layoutMetrics.isDesktop ? (this.layoutMetrics.panelWidth * 2 + 20) : this.layoutMetrics.panelWidth;
        this.inventoryTableUI = new InventoryTableUI(
            this, 
            this.merchantAnimator, 
            this.layoutMetrics.leftPanelX,
            this.layoutMetrics.leftPanelX,
            this.layoutMetrics.inventoryY,
            initialUnifiedW,
            this.layoutMetrics.panelHeight,
            this.layoutMetrics.isDesktop,
            onMountCleared,
            onRefreshUI,
            setDialogue,
            onHoverModule
        );

        this.shipPreviewUI = new ShipPreviewUI(
            this, 
            this.merchantAnimator, 
            this.layoutMetrics.shipX, 
            this.layoutMetrics.shipY, 
            this.layoutMetrics.panelWidth,
            this.layoutMetrics.isDesktop,
            onMountSelectionChanged, 
            onRefreshUI
        );

        this.inventoryTableUI.create();
        this.shipPreviewUI.create();

        // Set default welcome dialogue
        const welcomeText = getText('merchant', 'dialogue_welcome', locale) || 'Welcome, pilot! Upgrade your ship with my high-tech modules.';
        setDialogue(welcomeText);

        this.refreshUI();

        // Debug Mode
        setupDebugKey(this);
    }

    private populateDefaultLoadout() {
        const loadout = this.gameStatus.getShipLoadout();
        if (Object.keys(loadout).length === 0) {
            const markers = BigCruiserDefinition.markers;
            markers.forEach((m, index) => {
                if (m.type === 'laser' && m.x < 50) {
                    this.gameStatus.setShipLoadout(index, 'laser-white');
                } else if (m.type === 'drive') {
                    this.gameStatus.setShipLoadout(index, 'drive-ion');
                }
            });
        }
    }

    private initializeMerchantStock() {
        if (this.shipyardConfig) {
            this.gameStatus.clearMerchantInventory();
            for (const [moduleId, count] of Object.entries(this.shipyardConfig.goods)) {
                this.gameStatus.setMerchantStock(moduleId, count);
            }
        }
    }

    private refreshUI() {
        const { width } = this.scale;
        this.layoutMetrics = this.getLayoutMetrics();

        // 1. Position currency header
        this.currencyHeaderUI.updatePosition(width - 270);
        this.currencyHeaderUI.update();

        // 3. Draw panel frames and tab buttons
        this.drawPanelBackgrounds();
        this.renderTabButtons();

        // 4. Update coordinates of inner components
        this.merchantPortraitUI.updatePosition(this.layoutMetrics.merchantX, this.layoutMetrics.merchantY, this.layoutMetrics.panelWidth, this.layoutMetrics.isDesktop);
        
        const unifiedW = this.layoutMetrics.isDesktop ? (this.layoutMetrics.panelWidth * 2 + 20) : this.layoutMetrics.panelWidth;
        this.inventoryTableUI.updatePosition(
            this.layoutMetrics.leftPanelX,
            this.layoutMetrics.leftPanelX,
            this.layoutMetrics.inventoryY, 
            unifiedW,
            this.layoutMetrics.panelHeight,
            this.layoutMetrics.isDesktop
        );
        this.shipPreviewUI.updatePosition(this.layoutMetrics.shipX, this.layoutMetrics.shipY, this.layoutMetrics.panelWidth, this.layoutMetrics.isDesktop);

        // 5. Always show components in tabless redesign
        this.merchantPortraitUI.setVisible(true);
        
        if ((this.inventoryTableUI as any).unifiedInvContainer) {
            (this.inventoryTableUI as any).unifiedInvContainer.setVisible(true);
        }
        if ((this.shipPreviewUI as any).centerContainer) {
            (this.shipPreviewUI as any).centerContainer.setVisible(true);
        }

        this.renderAll();
    }

    private drawPanelBackgrounds() {
        this.panelBgGraphics.clear();
        const metrics = this.layoutMetrics;
        const unifiedW = metrics.isDesktop ? (metrics.panelWidth * 2 + 20) : metrics.panelWidth;
        const activeColor = this.activeTab === 'shop' ? 0x00ff88 : 0x00bfff;

        this.panelBgGraphics.fillStyle(0x0c121e, 0.85);
        this.panelBgGraphics.fillRoundedRect(metrics.leftPanelX, metrics.panelY, unifiedW, metrics.panelHeight, 10);
        this.panelBgGraphics.lineStyle(2, activeColor, 0.9);
        this.panelBgGraphics.strokeRoundedRect(metrics.leftPanelX, metrics.panelY, unifiedW, metrics.panelHeight, 10);
    }

    private renderTabButtons() {
        this.tabButtons.forEach(btn => btn.destroy());
        this.tabButtons = [];

        const metrics = this.layoutMetrics;
        const locale = LocaleManager.getInstance().getLocale();

        const leftText = getText('merchant', 'merchant_wares', locale) || 'MERCHANT WARES';
        const rightText = getText('merchant', 'player_inventory', locale) || 'PLAYER INVENTORY';

        const tabW = 150;
        const tabH = 32;

        const tabs = [
            { key: 'shop', label: leftText, x: metrics.leftPanelX, color: 0x00ff88 },
            { key: 'hangar', label: rightText, x: metrics.leftPanelX + 155, color: 0x00bfff }
        ];

        tabs.forEach(tab => {
            const isActive = this.activeTab === tab.key;
            
            // Tab Background Rectangle (entire area is interactive/clickable!)
            const bg = this.add.rectangle(
                tab.x + tabW / 2, 
                metrics.panelY - tabH / 2 + 1, 
                tabW, 
                tabH, 
                isActive ? 0x121e30 : 0x0a111e, 
                0.9
            )
            .setStrokeStyle(1.5, isActive ? tab.color : 0x1f3454, 0.9)
            .setInteractive({ useHandCursor: true });

            bg.on('pointerdown', () => {
                this.activeTab = tab.key as 'shop' | 'hangar';
                this.refreshUI();
            });

            // Text Label
            const txt = this.add.text(tab.x + tabW / 2, metrics.panelY - tabH / 2 + 1, tab.label, {
                fontFamily: 'Oswald, sans-serif',
                fontSize: '11px',
                color: isActive ? '#ffffff' : '#888888',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

            txt.on('pointerdown', () => {
                this.activeTab = tab.key as 'shop' | 'hangar';
                this.refreshUI();
            });

            this.tabButtons.push(bg, txt);
        });
    }

    private renderAll() {
        this.inventoryTableUI.render(
            this.shipPreviewUI.getSelectedMountIndex() || null, 
            this.shipPreviewUI.getSelectedMountType() || null,
            this.activeTab
        );
        this.shipPreviewUI.render();
    }
}
