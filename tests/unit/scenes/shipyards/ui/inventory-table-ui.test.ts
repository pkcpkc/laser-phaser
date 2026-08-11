import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            GameObjects: {}
        }
    };
});

const { mockInstance, mockUpdateLoot, mockAddModule } = vi.hoisted(() => {
    const defaultUpdateLoot = vi.fn();
    const defaultAddModule = vi.fn();
    return {
        mockUpdateLoot: defaultUpdateLoot,
        mockAddModule: defaultAddModule,
        mockInstance: {
            getModuleInventory: vi.fn().mockReturnValue({ 'laser-white': 1 }),
            getMerchantInventory: vi.fn().mockReturnValue({ 'drive-ion': 1 }),
            getLoot: vi.fn().mockReturnValue({ '🌕': 100, '🪙': 100, '💎': 100, '📦': 0 }),
            setShipLoadout: vi.fn(),
            removeModule: vi.fn(),
            updateLoot: defaultUpdateLoot,
            addModule: defaultAddModule,
            removeMerchantStock: vi.fn(),
            addMerchantStock: vi.fn()
        }
    };
});

vi.mock('../../../../../src/logic/game-status', () => {
    return {
        GameStatus: {
            getInstance: vi.fn().mockReturnValue(mockInstance)
        }
    };
});

vi.mock('../../../../../src/ships/modules/module-registry', () => ({
    ModuleRegistry: {
        'drive-ion': {
            name: 'Drive',
            buyPrice: { amount: 20, type: '🌕' },
            stats: { thrust: 0.5 }
        },
        'laser-white': {
            name: 'Laser',
            buyPrice: { amount: 10, type: '🪙' },
            stats: { damage: 10 }
        }
    },
    calculateSellPrice: vi.fn().mockReturnValue({ amount: 5, type: '🪙' })
}));

import { InventoryTableUI } from '../../../../../src/scenes/shipyards/ui/inventory-table-ui';

describe('InventoryTableUI', () => {
    let scene: any;
    let mockGameObject: any;
    let mockContainer: any;
    let refreshUI: any;
    let onMountCleared: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUpdateLoot.mockClear();
        mockAddModule.mockClear();

        mockGameObject = {
            setOrigin: vi.fn().mockReturnThis(),
            setStrokeStyle: vi.fn().mockReturnThis(),
            setInteractive: vi.fn().mockReturnThis(),
            setFillStyle: vi.fn().mockReturnThis(),
            setColor: vi.fn().mockReturnThis(),
            on: vi.fn().mockReturnThis(),
            setText: vi.fn(),
            active: true
        };

        mockContainer = {
            add: vi.fn(),
            removeAll: vi.fn()
        };

        scene = {
            add: {
                container: vi.fn().mockReturnValue(mockContainer),
                text: vi.fn().mockReturnValue(mockGameObject),
                rectangle: vi.fn().mockReturnValue(mockGameObject)
            },
            input: {
                off: vi.fn(),
                once: vi.fn()
            },
            time: {
                delayedCall: vi.fn().mockReturnValue({ destroy: vi.fn() })
            }
        };

        refreshUI = vi.fn();
        onMountCleared = vi.fn();
    });

    it('should create layout properly', () => {
        const ui = new InventoryTableUI(scene, null, 10, 410, 10, 370, 310, true, onMountCleared, refreshUI, vi.fn(), vi.fn());
        ui.create();

        expect(scene.add.container).toHaveBeenCalledWith(0, 0);
    });

    it('should render items for merchant and player', () => {
        const ui = new InventoryTableUI(scene, null, 10, 410, 10, 370, 310, true, onMountCleared, refreshUI, vi.fn(), vi.fn());
        ui.create();
        ui.render(null, null, 'shop');

        // Table headers should be drawn
        expect(scene.add.text).toHaveBeenCalledWith(expect.any(Number), 10, 'MODULE', expect.any(Object));
    });

    it('should allow buying if affordable', () => {
        const ui = new InventoryTableUI(scene, null, 10, 410, 10, 370, 310, true, onMountCleared, refreshUI, vi.fn(), vi.fn());
        ui.create();
        ui.render(null, null, 'shop');

        // Find the "pointerdown" callback for buy button. It's bound to a rectangle object in render().
        const pointerdownCalls = mockGameObject.on.mock.calls.filter((c: any) => c[0] === 'pointerdown');

        // pointerdownCalls index 0 should be buy Box for drive-ion.
        const buyCallback = pointerdownCalls[0][1];

        // We'll call it with dummy arguments to fulfill the signature
        const dummyEvent = { stopPropagation: vi.fn() };
        buyCallback({}, 0, 0, dummyEvent);

        expect(mockUpdateLoot).toHaveBeenCalledWith('🌕', -20);
        expect(mockAddModule).toHaveBeenCalledWith('drive-ion', 1);
        expect(refreshUI).toHaveBeenCalled();
    });
});
