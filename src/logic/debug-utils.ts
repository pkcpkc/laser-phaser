import Phaser from 'phaser';
import { GameStatus } from './game-status';

/**
 * Recursively logs all children from a game object, including nested containers.
 */
function logChildRecursive(obj: Phaser.GameObjects.GameObject, depth: number = 0): void {
    const gameObj = obj as any;
    const indent = '  '.repeat(depth);
    const typeName = gameObj.type || gameObj.constructor?.name || 'Unknown';
    const name = gameObj.name ? ` "${gameObj.name}"` : '';

    // Create a label for the group
    const label = `${indent}${typeName}${name}`;

    // Log the object with expandable details
    console.groupCollapsed(label);
    console.log('Object:', gameObj);
    console.log('Position:', { x: gameObj.x, y: gameObj.y });
    console.log('State:', { active: gameObj.active, visible: gameObj.visible, alpha: gameObj.alpha });

    if (gameObj.texture?.key) {
        console.log('Texture:', gameObj.texture.key, gameObj.frame?.name || '');
    }

    if (gameObj.body) {
        console.log('Body:', gameObj.body);
    }

    // Recurse into container children
    if (gameObj.list && Array.isArray(gameObj.list) && gameObj.list.length > 0) {
        console.group('Children:');
        for (const child of gameObj.list) {
            logChildRecursive(child, 0);
        }
        console.groupEnd();
    }

    console.groupEnd();
}

/**
 * Sets up the debug key listener ("B") for a scene.
 * When pressed in debug mode, pauses the physics world and dumps the full scene tree.
 */
export function setupDebugKey(scene: Phaser.Scene): void {
    if (import.meta.env.MODE !== 'debug') {
        return;
    }

    scene.input.keyboard?.on('keydown-B', () => {
        // Pause physics if available
        if (scene.matter?.world) {
            scene.matter.world.pause();
        }

        console.log('--- DEBUG STATE DUMP ---');
        console.log('Scene: ' + scene.scene.key);

        // Log full rendering tree
        console.group('🌳 Render Tree (' + scene.children.list.length + ' root objects)');
        for (const child of scene.children.list) {
            logChildRecursive(child);
        }
        console.groupEnd();

        // Log GameStatus as raw object
        console.group('📊 GameStatus');
        console.log(GameStatus.getInstance());
        console.groupEnd();

        console.log('--- END DEBUG STATE DUMP ---');
    });
}

