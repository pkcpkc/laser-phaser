import Phaser from 'phaser';
import type { ShipDefinition, ShipMarker } from '../types';

/**
 * Generates irregular polygon vertices for an asteroid shape
 */
export function generateAsteroidVertices(radius: number, vertexCount: number = 10): { x: number; y: number }[] {
    const vertices: { x: number; y: number }[] = [];
    const angleStep = (Math.PI * 2) / vertexCount;

    for (let i = 0; i < vertexCount; i++) {
        // Vary angle slightly for irregularity
        const angle = i * angleStep + (Math.random() - 0.5) * 0.2;
        // Larger radius variation for potato shape
        const radiusVariation = radius * (0.7 + Math.random() * 0.5);
        vertices.push({
            x: Math.cos(angle) * radiusVariation,
            y: Math.sin(angle) * radiusVariation
        });
    }

    return vertices;
}

/**
 * Creates a procedural asteroid texture
 */
// Mud/Rock Texture Generator (Reference inspired)
export function createAsteroidTexture(
    scene: Phaser.Scene,
    textureKey: string,
    radius: number,
    colors: { fill: number; stroke: number; fissure: number; highlight: number }
): void {
    if (scene.textures.exists(textureKey)) return;

    const size = radius * 2 + 8;
    const graphics = scene.add.graphics();
    const cx = size / 2;
    const cy = size / 2;

    // 1. Irregular Base Shape (Lumpy Rock)
    // 8-12 vertices for a "clump" look
    const vertices = generateAsteroidVertices(radius, 8 + Math.floor(Math.random() * 5));

    // Create Polygon for masking checks
    const polyPoints = vertices.map(v => new Phaser.Geom.Point(v.x + cx, v.y + cy));
    const polygon = new Phaser.Geom.Polygon(polyPoints);

    // Draw Base
    graphics.fillStyle(colors.fill);
    graphics.lineStyle(2, colors.fill);
    graphics.beginPath();
    graphics.moveTo(polyPoints[0].x, polyPoints[0].y);
    for (let i = 1; i < polyPoints.length; i++) {
        graphics.lineTo(polyPoints[i].x, polyPoints[i].y);
    }
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();

    // 2. Heavy Surface Noise (Grain) - MASKED
    // Generate lots of noise, but only draw if inside polygon
    graphics.fillStyle(0x000000, 0.2);
    for (let i = 0; i < radius * 40; i++) { // Massive density
        const nx = cx + (Math.random() - 0.5) * radius * 2.2;
        const ny = cy + (Math.random() - 0.5) * radius * 2.2;
        if (polygon.contains(nx, ny)) {
            graphics.fillRect(nx, ny, 1, 1);
        }
    }

    // 3. Deep Crevices / Fissures
    const fissureCount = Math.floor(radius / 5) + 3;
    graphics.fillStyle(colors.fissure, 1);
    for (let i = 0; i < fissureCount; i++) {
        const dist = Math.random() * radius * 0.8;
        const angle = Math.random() * Math.PI * 2;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;

        // Skip if center of fissure is outside (keeps them mostly inside)
        if (!polygon.contains(x, y)) continue;

        const fissureSize = radius * (0.15 + Math.random() * 0.2);

        graphics.beginPath();
        let fx = x + fissureSize;
        let fy = y;
        graphics.moveTo(fx, fy);
        for (let j = 0; j < 6; j++) {
            const fa = (j / 6) * Math.PI * 2;
            const fr = fissureSize * (0.4 + Math.random() * 0.9);
            const px = x + Math.cos(fa) * fr;
            const py = y + Math.sin(fa) * fr;
            graphics.lineTo(px, py);
        }
        graphics.closePath();
        graphics.fillPath();
    }

    // 4. Rock Highlights (Tan patches) - MASKED
    graphics.fillStyle(colors.highlight, 0.4);
    for (let i = 0; i < 8; i++) {
        const dist = Math.random() * radius * 0.7;
        const angle = Math.random() * Math.PI * 2 - (Math.PI / 4);
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;

        if (!polygon.contains(x, y)) continue;

        const patchRadius = radius * (0.1 + Math.random() * 0.2);

        // Use multiple points to simulate irregular patch
        for (let k = 0; k < 5; k++) {
            const px = x + (Math.random() - 0.5) * patchRadius * 2;
            const py = y + (Math.random() - 0.5) * patchRadius * 2;
            if (polygon.contains(px, py)) {
                graphics.fillCircle(px, py, 1.5);
            }
        }
    }

    // 5. Hard Edge Highlights (Rim)
    // Only where polygon edge is top-left facing? 
    // Simplify: Just redraw stroke with lighter color on top half? 
    // Or scan vertices.
    graphics.lineStyle(2, 0xffffff, 0.15);
    graphics.beginPath();
    // Trace top-left vertices roughly?
    // Doing a full light stroke is safer
    graphics.strokePoints(polyPoints, true, false);

    graphics.generateTexture(textureKey, size, size);
    graphics.destroy();
}

/**
 * Creates a raw surface texture for masking (rectangular block of asteroid details)
 */
export function generateAsteroidSurfaceTexture(
    scene: Phaser.Scene,
    textureKey: string,
    size: number,
    colors: { fill: number; stroke: number; fissure: number; highlight: number }
): void {
    if (scene.textures.exists(textureKey)) return;

    const graphics = scene.add.graphics();


    // Fill background
    graphics.fillStyle(colors.fill);
    graphics.fillRect(0, 0, size, size);

    // 1. Heavy Surface Noise (Grain)
    graphics.fillStyle(0x000000, 0.2);
    for (let i = 0; i < size * size * 0.5; i++) {
        const nx = Math.random() * size;
        const ny = Math.random() * size;
        graphics.fillRect(nx, ny, 1, 1);
    }

    // 2. Deep Crevices / Fissures (Randomly placed)
    const fissureCount = Math.floor(size / 3);
    graphics.fillStyle(colors.fissure, 1);
    for (let i = 0; i < fissureCount; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const width = size * (0.05 + Math.random() * 0.1);
        const height = size * (0.05 + Math.random() * 0.1);
        graphics.fillEllipse(x, y, width, height);
    }

    // 3. Highlights
    graphics.fillStyle(colors.highlight, 0.3);
    for (let i = 0; i < size / 2; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        graphics.fillCircle(x, y, size * 0.05);
    }

    // 4. Directional Feature (Large Crater) - Irregular & Organic
    const craterX = size * 0.3;
    const craterY = size * 0.3;
    const craterRadius = size * 0.15;

    // Create irregular crater shape
    const craterPoints: { x: number, y: number }[] = [];
    const craterSegments = 8;
    for (let i = 0; i < craterSegments; i++) {
        const angle = (i / craterSegments) * Math.PI * 2;
        const r = craterRadius * (0.8 + Math.random() * 0.4);
        craterPoints.push({
            x: craterX + Math.cos(angle) * r,
            y: craterY + Math.sin(angle) * r
        });
    }

    // Shadow (Bottom/Right heavy)
    graphics.fillStyle(0x000000, 0.5);
    graphics.beginPath();
    graphics.moveTo(craterPoints[0].x, craterPoints[0].y);
    for (let i = 1; i < craterPoints.length; i++) {
        graphics.lineTo(craterPoints[i].x, craterPoints[i].y);
    }
    graphics.closePath();
    graphics.fillPath();

    // Inner Highlight (Rim - Top/Left heavy)
    graphics.fillStyle(colors.highlight, 0.4);
    graphics.beginPath();
    // Offset slightly top-left for rim effect
    const rimOffsetX = -size * 0.02;
    const rimOffsetY = -size * 0.02;

    graphics.moveTo(craterPoints[0].x + rimOffsetX, craterPoints[0].y + rimOffsetY);
    for (let i = 1; i < craterPoints.length; i++) {
        graphics.lineTo(craterPoints[i].x + rimOffsetX, craterPoints[i].y + rimOffsetY);
    }
    graphics.closePath();
    // Only draw rim if not overlapping main shadow too much? 
    // Actually just drawing a separate smaller rim arc might be better.
    // Let's just draw small irregular highlights on the rim.
    graphics.fillPath();

    // Redraw inner shadow to cut out the "rim" fill from the center, keeping only the edge?
    // Simpler: Draw irregular dark center again, slightly smaller/offset
    graphics.fillStyle(0x000000, 0.6);
    graphics.beginPath();
    for (let i = 0; i < craterPoints.length; i++) {
        // Shrink towards center
        const p = craterPoints[i];
        const dx = p.x - craterX;
        const dy = p.y - craterY;
        graphics.lineTo(craterX + dx * 0.7, craterY + dy * 0.7);
    }
    graphics.closePath();
    graphics.fillPath();

    // 5. Directional Feature (Stripe/Ridge)
    graphics.lineStyle(size * 0.05, colors.fissure, 0.6);
    graphics.beginPath();
    graphics.moveTo(size * 0.7, size * 0.2);
    graphics.lineTo(size * 0.8, size * 0.8);
    graphics.strokePath();

    graphics.generateTexture(textureKey, size, size);
    graphics.destroy();
}

// Standard drive marker for all asteroids (center position, pointing down)
export const asteroidDriveMarker: ShipMarker = {
    type: 'drive',
    x: 8, // Rear position (Up on screen when falling)
    y: 16, // Center position (Centered horizontally)
    angle: 0
};

export const SmallAsteroidDefinition: ShipDefinition = {
    id: 'asteroid-small',
    assetKey: 'asteroid-small-texture',
    assetPath: '',
    markers: [asteroidDriveMarker],
    physics: {
        frictionAir: 0.05,
        fixedRotation: false,
        mass: 10
    },
    gameplay: {
        health: 5,
        speed: 1.5,
        thrust: 15
    },
    explosion: {
        type: 'dust',
        lifespan: 2000,
        scale: { start: 1.2, end: 0.4 },
        speed: { min: 10, max: 25 },
        color: 0x2C2C2C, // Dark Granite
        particleCount: 15
    }
};

// Generate texture for this asteroid type
export function generateSmallAsteroidTexture(scene: Phaser.Scene): void {
    for (let i = 0; i < 5; i++) {
        createAsteroidTexture(scene, `asteroid-small-texture-${i}`, 12, { // Reduced radius 15 -> 12
            fill: 0x2C2C2C,      // Dark Granite
            stroke: 0x252525,
            fissure: 0x151515,   // Near Black
            highlight: 0x454545  // Grey Highlight
        });
    }
}
