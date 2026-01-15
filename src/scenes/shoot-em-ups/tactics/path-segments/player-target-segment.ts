import type { IPathSegment, PathSegmentContext } from './types';

export class PlayerTargetSegment implements IPathSegment {
    constructor(private approach: number = 1.0) { }

    resolve(context: PathSegmentContext): { x: number, y: number } | null {
        const player = (context.scene as any).ship?.sprite as Phaser.GameObjects.Sprite | undefined;
        if (player && player.active) {
            const dx = player.x - context.currentAnchorX;
            const dy = player.y - context.currentAnchorY;

            return {
                x: context.currentAnchorX + dx * this.approach,
                y: context.currentAnchorY + dy * this.approach
            };
        }

        // Fallback if no player
        return {
            x: context.scene.scale.width * 0.5,
            y: context.scene.scale.height + 200 // Exit screen
        };
    }
}
