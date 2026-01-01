import { describe, it, expect, vi } from 'vitest';

vi.mock('phaser', () => ({
    default: {
        Game: class { },
        Scene: class { },
        GameObjects: {
            Image: class { },
            Sprite: class { }
        },
        Physics: {
            Matter: {
                Image: class { },
                Sprite: class { }
            }
        }
    }
}));

import { GreenRocketCarrierDefinition } from '../../../../src/ships/definitions/green-rocket-carrier';
import { GreenRocketCarrierGreenRocketConfig } from '../../../../src/ships/configurations/green-rocket-carrier-green-rocket';

describe('GreenRocketCarrier Configuration', () => {
    it('should have static properties defined in definition', () => {
        expect(GreenRocketCarrierDefinition.assetKey).toBeDefined();
        expect(GreenRocketCarrierDefinition.assetPath).toBeDefined();
        expect(GreenRocketCarrierDefinition.gameplay).toBeDefined();
    });

    it('should use correct definition in config', () => {
        const config = GreenRocketCarrierGreenRocketConfig;
        expect(config.definition).toBe(GreenRocketCarrierDefinition);
    });
});
