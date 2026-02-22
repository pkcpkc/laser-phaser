import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('phaser', () => {
    return {
        default: {
            Scene: class { },
            GameObjects: {}
        },
        Math: {
            DegToRad: vi.fn((deg: number) => deg * Math.PI / 180),
            Between: vi.fn().mockReturnValue(0)
        }
    };
});

vi.mock('../../../../../src/logic/game-status', () => ({
    GameStatus: {
        getInstance: vi.fn().mockReturnValue({
            getShipLoadout: vi.fn().mockReturnValue({ 1: 'laser-white', 3: 'drive-ion' }),
            setShipLoadout: vi.fn(),
            addModule: vi.fn()
        })
    }
}));

vi.mock('../../../../../src/ships/definitions/big-cruiser', () => ({
    BigCruiserDefinition: {
        markers: [
            { type: 'origin', x: 50, y: 50 },
            { type: 'laser', x: 10, y: 10 },
            { type: 'laser', x: 90, y: 10 },
            { type: 'drive', x: 50, y: 90 }
        ]
    }
}));

// Mock ModuleRegistry
vi.mock('../../../../../src/ships/modules/module-registry', () => ({
    ModuleRegistry: {
        'laser-white': {
            moduleClass: class { COLOR = 0xffffff; reloadTime = 100; }
        },
        'drive-ion': {
            moduleClass: class { }
        }
    }
}));

import { ShipPreviewUI } from '../../../../../src/scenes/shipyards/ui/ship-preview-ui';

describe('ShipPreviewUI', () => {
    let scene: any;
    let mockGameObject: any;
    let mockContainer: any;
    let refreshUI: any;
    let onMountSelectionChanged: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockGameObject = {
            setOrigin: vi.fn().mockReturnThis(),
            setAngle: vi.fn().mockReturnThis(),
            setScale: vi.fn().mockReturnThis(),
            setInteractive: vi.fn().mockReturnThis(),
            setColor: vi.fn().mockReturnThis(),
            setSize: vi.fn().mockReturnThis(),
            on: vi.fn().mockReturnThis(),
            width: 100,
            height: 100,
            active: true,
            emitParticle: vi.fn()
        };

        mockContainer = {
            add: vi.fn(),
            removeAll: vi.fn(),
            setVisible: vi.fn().mockReturnThis(),
            setSize: vi.fn().mockReturnThis(),
            setInteractive: vi.fn().mockReturnThis(),
            on: vi.fn().mockReturnThis()
        };

        scene = {
            add: {
                image: vi.fn().mockReturnValue(mockGameObject),
                text: vi.fn().mockReturnValue(mockGameObject),
                container: vi.fn().mockReturnValue(mockContainer),
                particles: vi.fn().mockReturnValue(mockGameObject)
            },
            make: {
                graphics: vi.fn().mockReturnValue({
                    fillStyle: vi.fn(),
                    fillRect: vi.fn(),
                    generateTexture: vi.fn(),
                    destroy: vi.fn()
                })
            },
            textures: {
                exists: vi.fn().mockReturnValue(false)
            },
            tweens: {
                add: vi.fn()
            },
            time: {
                delayedCall: vi.fn()
            }
        };

        refreshUI = vi.fn();
        onMountSelectionChanged = vi.fn();
    });

    it('should create layout properly', () => {
        const ui = new ShipPreviewUI(scene, null, 10, 300, onMountSelectionChanged, refreshUI);
        ui.create();

        expect(scene.add.container).toHaveBeenCalledWith(10, 300);
    });

    it('should render ship hull and effects based on loadout', () => {
        const ui = new ShipPreviewUI(scene, null, 10, 300, onMountSelectionChanged, refreshUI);
        ui.create();
        ui.render();

        expect(scene.add.image).toHaveBeenCalledWith(0, 0, 'ships', 'big-cruiser');
        expect(scene.add.particles).toHaveBeenCalledWith(0, 0, 'flare-white', expect.any(Object));
        expect(scene.add.particles).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), 'pixel', expect.any(Object));

        // Ensure delayed fire logic was called
        expect(scene.time.delayedCall).toHaveBeenCalled();
    });

    it('should select mount point properly', () => {
        const ui = new ShipPreviewUI(scene, null, 10, 300, onMountSelectionChanged, refreshUI);
        ui.create();
        ui.render();

        const mountPointContainers = mockContainer.on.mock.calls.filter((c: any) => c[0] === 'pointerdown');
        // mount icons are created for each of the 3 markers (laser, laser, drive) + the toggle button.
        // We trigger the second laser pointerdown (index 2 of markers)
        const pointerdownCb = mountPointContainers[1][1];
        pointerdownCb();

        expect(ui.getSelectedMountIndex()).toBe(2);
        expect(ui.getSelectedMountType()).toBe('laser');
        expect(onMountSelectionChanged).toHaveBeenCalledWith(2, 'laser');
        expect(refreshUI).toHaveBeenCalled();
    });
});
