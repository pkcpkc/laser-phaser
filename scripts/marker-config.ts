import { PNG } from 'pngjs';

export namespace MarkerConfig {
    export const colors = {
        thruster: 0xFFA500FF,    // Orange
        laser: 0x00FF00FF,       // Green
        armor: 0x000000FF,       // Black
        rocket: 0xFFFFFFFF,      // White
        orientation: 0xFF0000FF, // Red - used for orientation markers
    } as const;

    export type Type = keyof typeof colors;

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

    /**
     * Remove a marker color at the given index in the PNG by replacing it with a similar non-marker color.
     * Updates the PNG in place.
     * @param idx Index in PNG data buffer (points to R value)
     * @param png PNG image
     */
    export function removeAllMarkers(png: PNG): void {
        for (let y = 0; y < png.height; y++) {
            for (let x = 0; x < png.width; x++) {
                const idx = (png.width * y + x) << 2;
                // Skip transparent pixels
                if (png.data[idx + 3] === 0) continue;

                const origRGBA = MarkerConfig.idxToRGBA(idx, png);
                // Extract RGBA from 0xRRGGBBAA
                const origR = (origRGBA >> 24) & 0xFF;
                const origG = (origRGBA >> 16) & 0xFF;
                const origB = (origRGBA >> 8) & 0xFF;
                const origA = origRGBA & 0xFF;

                // Try incrementing and decrementing each channel one by one, always check hex only
                for (const channel of [0, 1, 2]) {
                    for (const delta of [1, -1, 2, -2]) {
                        let newR = origR, newG = origG, newB = origB;
                        if (channel === 0) newR = Math.max(0, Math.min(255, origR + delta));
                        if (channel === 1) newG = Math.max(0, Math.min(255, origG + delta));
                        if (channel === 2) newB = Math.max(0, Math.min(255, origB + delta));
                        const hex = ((newR << 24) | (newG << 16) | (newB << 8) | origA) >>> 0;
                        if (MarkerConfig.getTypeHex(hex) === null) {
                            png.data[idx] = newR;
                            png.data[idx + 1] = newG;
                            png.data[idx + 2] = newB;
                            return;
                        }
                    }
                }
                // Fallback: just add 2 to each channel and check hex
                const fallbackR = Math.min(255, origR + 2);
                const fallbackG = Math.min(255, origG + 2);
                const fallbackB = Math.min(255, origB + 2);
                const fallbackHex = ((fallbackR << 24) | (fallbackG << 16) | (fallbackB << 8) | origA) >>> 0;
                if (MarkerConfig.getTypeHex(fallbackHex) === null) {
                    png.data[idx] = fallbackR;
                    png.data[idx + 1] = fallbackG;
                    png.data[idx + 2] = fallbackB;
                }
            }
        }
    }
}

export type MarkerType = MarkerConfig.Type;

export type ShipMarker = {
    type: MarkerType;
    x: number;
    y: number;
    angle: number; // in degrees
};

export const SOURCE_SHIPS_DIR = 'public/res/ships';
export const DEST_SHIPS_DIR = 'public/res/ships';
