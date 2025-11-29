"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEST_SHIPS_DIR = exports.SOURCE_SHIPS_DIR = exports.MarkerConfig = void 0;
var MarkerConfig;
(function (MarkerConfig) {
    MarkerConfig.colors = {
        thruster: 0xFFA500FF, // Orange
        laser: 0x00FF00FF, // Green
        armor: 0x000000FF, // Black
        rocket: 0xFFFFFFFF, // White
        orientation: 0xFF0000FF, // Red - used for orientation markers
    };
    function idxToRGBA(idx, png) {
        return ((png.data[idx] << 24) | (png.data[idx + 1] << 16) | (png.data[idx + 2] << 8) | png.data[idx + 3]) >>> 0;
    }
    MarkerConfig.idxToRGBA = idxToRGBA;
    /**
     * Get marker type from a pixel index in a PNG image.
     * @param idx Index in PNG data buffer (points to R value)
     * @param png PNG image
     * @returns MarkerType if color matches a marker, null otherwise
     */
    function getTypeIdx(idx, png) {
        var hex = idxToRGBA(idx, png);
        // Skip transparent pixels (alpha = 0)
        if ((hex & 0xFF) === 0)
            return null;
        return getTypeHex(hex);
    }
    MarkerConfig.getTypeIdx = getTypeIdx;
    function rgbaToHex(r, g, b, a) {
        return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
    }
    MarkerConfig.rgbaToHex = rgbaToHex;
    MarkerConfig.getType = getTypeHex;
    /**
     * Get marker type from a hex color value.
     * @param hex Hex color value in format 0xRRGGBBAA
     * @returns MarkerType if color matches a marker, null otherwise
     */
    function getTypeHex(hex) {
        // Skip transparent pixels (alpha = 0)
        if ((hex & 0xFF) === 0)
            return null;
        for (var _i = 0, _a = Object.entries(MarkerConfig.colors); _i < _a.length; _i++) {
            var _b = _a[_i], type = _b[0], color = _b[1];
            if (color === hex) {
                return type;
            }
        }
        return null;
    }
    MarkerConfig.getTypeHex = getTypeHex;
    /**
     * Remove a marker color at the given index in the PNG by replacing it with a similar non-marker color.
     * Updates the PNG in place.
     * @param idx Index in PNG data buffer (points to R value)
     * @param png PNG image
     */
    function removeAllMarkers(png) {
        for (var y = 0; y < png.height; y++) {
            for (var x = 0; x < png.width; x++) {
                var idx = (png.width * y + x) << 2;
                // Skip transparent pixels
                if (png.data[idx + 3] === 0)
                    continue;
                var origRGBA = MarkerConfig.idxToRGBA(idx, png);
                // Extract RGBA from 0xRRGGBBAA
                var origR = (origRGBA >> 24) & 0xFF;
                var origG = (origRGBA >> 16) & 0xFF;
                var origB = (origRGBA >> 8) & 0xFF;
                var origA = origRGBA & 0xFF;
                // Try incrementing and decrementing each channel one by one, always check hex only
                for (var _i = 0, _a = [0, 1, 2]; _i < _a.length; _i++) {
                    var channel = _a[_i];
                    for (var _b = 0, _c = [1, -1, 2, -2]; _b < _c.length; _b++) {
                        var delta = _c[_b];
                        var newR = origR, newG = origG, newB = origB;
                        if (channel === 0)
                            newR = Math.max(0, Math.min(255, origR + delta));
                        if (channel === 1)
                            newG = Math.max(0, Math.min(255, origG + delta));
                        if (channel === 2)
                            newB = Math.max(0, Math.min(255, origB + delta));
                        var hex = ((newR << 24) | (newG << 16) | (newB << 8) | origA) >>> 0;
                        if (MarkerConfig.getTypeHex(hex) === null) {
                            png.data[idx] = newR;
                            png.data[idx + 1] = newG;
                            png.data[idx + 2] = newB;
                            return;
                        }
                    }
                }
                // Fallback: just add 2 to each channel and check hex
                var fallbackR = Math.min(255, origR + 2);
                var fallbackG = Math.min(255, origG + 2);
                var fallbackB = Math.min(255, origB + 2);
                var fallbackHex = ((fallbackR << 24) | (fallbackG << 16) | (fallbackB << 8) | origA) >>> 0;
                if (MarkerConfig.getTypeHex(fallbackHex) === null) {
                    png.data[idx] = fallbackR;
                    png.data[idx + 1] = fallbackG;
                    png.data[idx + 2] = fallbackB;
                }
            }
        }
    }
    MarkerConfig.removeAllMarkers = removeAllMarkers;
})(MarkerConfig || (exports.MarkerConfig = MarkerConfig = {}));
exports.SOURCE_SHIPS_DIR = 'res/ships';
exports.DEST_SHIPS_DIR = 'public/res/ships';
