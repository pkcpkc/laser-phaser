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

    constructor() {
        super('ShipyardScene');
    }

    init(data: any) {
        this.sourceGalaxyId = data.galaxyId;
        this.sourcePlanetId = data.planetId;
        this.shipyardConfig = data.shipyardConfig;
    }

    private getLayoutMetrics() {
        const { width } = this.scale;

        // Allow table to be up to 480px wide if space permits
        const panelWidth = Math.min(width - 20, 480);

        // Center table horizontally
        const inventoryX = (width - panelWidth) / 2;

        // Base Y coordinate (originally 50, now 70px lower = 120)
        const merchantY = 120;
        const shipY = merchantY;

        // Table directly below merchant with 5px margin.
        // Assuming the Alien image is ~120px tall, center is at merchantY.
        // Bottom of Alien is merchantY + 60. Margin 5 => +65.
        const inventoryY = merchantY + 65;

        // Merchant is centered over the "MERCHANT WARES" text.
        // The text starts at inventoryX. At 24px Oswald font, it's roughly 150px wide.
        // So the center of the text is roughly inventoryX + 75.
        const merchantX = inventoryX + 75;

        // Ship is top-right of the table
        const shipX = inventoryX + panelWidth - 80;

        return { merchantX, merchantY, shipX, shipY, inventoryX, inventoryY, panelWidth };
    }

    create() {
        this.gameStatus = GameStatus.getInstance();
        const locale = LocaleManager.getInstance().getLocale();
        const { width, height } = this.scale;

        // Background
        this.add.tileSprite(0, 0, width, height, 'metal-bg').setOrigin(0).setTint(0x444455);

        // Back Button
        const backButton = this.add.text(10, 30, getText('merchant', 'back', locale) || '◀ Back', {
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

        const metrics = this.getLayoutMetrics();

        // Components
        this.currencyHeaderUI = new CurrencyHeaderUI(this);
        this.merchantPortraitUI = new MerchantPortraitUI(this, metrics.merchantX, metrics.merchantY, this.shipyardConfig);

        const onRefreshUI = () => this.refreshUI();

        // Pass a wrapper to update local selected mount state and re-render
        const onMountSelectionChanged = (_index: number | null, _type: string | null) => {
            // refresh happens automatically in shipPreviewUI when it calls onRefreshUI
        };

        // Initialize state
        this.populateDefaultLoadout();
        this.initializeMerchantStock();

        // Initial render
        this.currencyHeaderUI.create();
        this.currencyHeaderUI.update();

        this.merchantPortraitUI.create();
        // Extract animator from component to pass it to others
        this.merchantAnimator = this.merchantPortraitUI.getAnimator();

        // Update components that need the animator
        this.inventoryTableUI = new InventoryTableUI(this, this.merchantAnimator, metrics.inventoryX, metrics.inventoryY, metrics.panelWidth, () => {
            if (this.shipPreviewUI) {
                this.shipPreviewUI.clearMountSelection();
            }
        }, onRefreshUI);

        this.shipPreviewUI = new ShipPreviewUI(this, this.merchantAnimator, metrics.shipX, metrics.shipY, onMountSelectionChanged, onRefreshUI);

        this.inventoryTableUI.create();
        this.shipPreviewUI.create();

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
        this.currencyHeaderUI.update();
        this.renderAll();
    }

    private renderAll() {
        this.inventoryTableUI.render(this.shipPreviewUI.getSelectedMountIndex() || null, this.shipPreviewUI.getSelectedMountType() || null);
        this.shipPreviewUI.render();
    }
}
