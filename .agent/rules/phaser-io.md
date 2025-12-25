# Phaser.io Guidelines

- **Scene Lifecycle & Memory Management**:
  - **Cleanup**: ALWAYS implement the `shutdown` or `destroy` method in Scenes/Prefabs to clean up:
    - Event listeners (`this.events.off`, `input.off`)
    - Timers (`time.addEvent`)
    - Tweens
  - Prevent "Ghost" Logic: Ensure `update()` methods check if the object/scene is active before running logic.
- **Performance Optimization**:
  - **Object Pooling**: Use `Phaser.GameObjects.Group` with `classType` and `runChildUpdate` for high-frequency entities (bullets, particles, enemies). Reuse objects (`setActive(true).setVisible(true)`) instead of destroying and recreating them.
  - **Texture Atlases**: Prefer Texture Atlases over individual image loads to reduce draw calls and manage memory better.
- **Architecture**:
  - **Prefabs**: Encapsulate logic in custom Game Object classes (Prefabs) extending `Phaser.GameObjects.Sprite` or `Container`, rather than bloating the Scene's `update` loop.
  - **Separation of Concerns**: Use "Managers" or "Systems" (plain classes) for verifying collisions, inputs, or game states that don't need to be strictly coupled to a visual GameObject.
  - **Events**: Use the Event Emitter pattern (`scene.events.emit`) to decouple unrelated systems (e.g., UI updates vs. Player health changes).
