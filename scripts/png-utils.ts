import { PNG } from 'pngjs';
import { MarkerConfig } from './marker-config';

type Type = MarkerConfig.Type;
const colors = MarkerConfig.colors;

export function idxToRGBA(idx: number, png: PNG): number {
    return ((png.data[idx] << 24) | (png.data[idx + 1] << 16) | (png.data[idx + 2] << 8) | png.data[idx + 3]) >>> 0;
}

/**
 * Get marker type from a pixel index in a PNG image.
 * @param idx Index in PNG data buffer (points to R value)
 * @param png PNG image
 * @returns MarkerType if color matches a marker, null otherwise
 */
export function getTypeIdx(idx: number, png: PNG): Type | null {
    const hex = idxToRGBA(idx, png);
    // Skip transparent pixels (alpha = 0)
    if ((hex & 0xFF) === 0) return null;
    return getTypeHex(hex);
}

export function rgbaToHex(r: number, g: number, b: number, a: number): number {
    return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
}

export const getType = getTypeHex;

/**
 * Get marker type from a hex color value.
 * @param hex Hex color value in format 0xRRGGBBAA
 * @returns MarkerType if color matches a marker, null otherwise
 */
export function getTypeHex(hex: number): Type | null {
    // Skip transparent pixels (alpha = 0)
    if ((hex & 0xFF) === 0) return null;
    for (const [type, color] of Object.entries(colors)) {
        if (color === hex) {
            return type as Type;
        }
    }
    return null;
}