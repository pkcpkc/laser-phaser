
export namespace MarkerConfig {
    export const colors = {
        drive: 0xFFA500FF,       // Orange
        laser: 0x00FF00FF,       // Green
        armor: 0x000000FF,       // Black
        rocket: 0xFFFFFFFF,      // White
        orientation: 0xFF0000FF, // Red - used for orientation markers
    } as const;

    export type Type = keyof typeof colors;

    /**
     * Convert RGBA values to hex color value.
     */
    export function rgbaToHex(r: number, g: number, b: number, a: number): number {
        return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
    }

    /**
     * Convert pixel index to RGBA hex value.
     */
    export function idxToRGBA(idx: number, png: { data: Buffer }): number {
        return ((png.data[idx] << 24) | (png.data[idx + 1] << 16) | (png.data[idx + 2] << 8) | png.data[idx + 3]) >>> 0;
    }

    /**
     * Get marker type from a hex color value.
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
     * Get marker type from a pixel index in a PNG image.
     */
    export function getTypeIdx(idx: number, png: { data: Buffer }): Type | null {
        const hex = idxToRGBA(idx, png);
        // Skip transparent pixels (alpha = 0)
        if ((hex & 0xFF) === 0) return null;
        return getTypeHex(hex);
    }

    /**
     * Alias for getTypeHex.
     */
    export const getType = getTypeHex;
}

export type MarkerType = MarkerConfig.Type;

export type ShipMarker = {
    type: MarkerType;
    x: number;
    y: number;
    angle: number; // in degrees
};
