import type { IPathSegment, PathSegmentContext } from './types';

export class CoordinateSegment implements IPathSegment {
    constructor(private widthPercent: number, private heightPercent: number) { }

    resolve(context: PathSegmentContext): { x: number, y: number } | null {
        return {
            x: context.scene.scale.width * this.widthPercent,
            y: context.scene.scale.height * this.heightPercent
        };
    }
}
