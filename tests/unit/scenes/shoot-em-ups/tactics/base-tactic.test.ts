import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseTactic } from '../../../../../src/scenes/shoot-em-ups/tactics/base-tactic';
import type { IFormation } from '../../../../../src/scenes/shoot-em-ups/formations/types';

class TestTactic extends BaseTactic {
    public updateFormationCalledWith: any[] = [];
    protected updateFormation(formation: IFormation, time: number, delta: number): void {
        this.updateFormationCalledWith.push({ formation, time, delta });
    }
    // Expose protected formations for testing
    public getFormations() { return this.formations; }
}

describe('BaseTactic', () => {
    let tactic: TestTactic;
    let mockScene: any;
    let mockFormation: any;
    let mockFormationType: any;

    beforeEach(() => {
        tactic = new TestTactic();
        mockScene = {
            add: {
                existing: vi.fn(),
            }
        };
        mockFormation = {
            spawn: vi.fn(),
            update: vi.fn(),
            destroy: vi.fn(),
            isComplete: vi.fn().mockReturnValue(false),
        };
        mockFormationType = vi.fn().mockImplementation(function (this: any) {
            return mockFormation;
        });
    });

    it('should initialize with data', () => {
        const shipConfigs = [{}] as any;
        const collisionConfig = {} as any;
        tactic.initialize(mockScene, mockFormationType, { spacing: 10 }, class { }, shipConfigs, collisionConfig);

        expect((tactic as any).initData).toEqual({
            scene: mockScene,
            formationType: mockFormationType,
            formationConfig: { spacing: 10 },
            shipClass: expect.any(Function),
            shipConfigs,
            collisionConfig
        });
    });

    it('should warn and return if spawn called before initialize', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        tactic.spawn();
        expect(spy).toHaveBeenCalledWith('Tactic spawn called before initialize');
        spy.mockRestore();
    });

    it('should spawn formation and add it', () => {
        tactic.initialize(mockScene, mockFormationType, {}, class { }, [], {} as any);
        tactic.spawn();

        expect(mockFormationType).toHaveBeenCalled();
        expect(mockFormation.spawn).toHaveBeenCalled();
        expect(tactic.getFormations()).toContain(mockFormation);
    });

    it('should update all formations and call updateFormation', () => {
        tactic.addFormation(mockFormation);
        tactic.update(100, 16);

        expect(mockFormation.update).toHaveBeenCalledWith(100, 16);
        expect(tactic.updateFormationCalledWith[0]).toEqual({ formation: mockFormation, time: 100, delta: 16 });
    });

    it('should clean up completed formations during update', () => {
        tactic.addFormation(mockFormation);
        mockFormation.isComplete.mockReturnValue(true);

        tactic.update(100, 16);

        expect(tactic.getFormations()).toHaveLength(0);
        expect(tactic.isComplete()).toBe(true);
    });

    it('should destroy all formations', () => {
        tactic.addFormation(mockFormation);
        tactic.destroy();

        expect(mockFormation.destroy).toHaveBeenCalled();
        expect(tactic.getFormations()).toHaveLength(0);
    });
});
