```markdown
# Sky Bowling — Final Project (Interactive Graphics)

Play the game online:
<br>
<a href="https://sapienzainteractivegraphicscourse.github.io/final-project-acsai_reborn/">Click to play</a> 

**Repository:** `final-project-acsai_reborn`

**Authors:** Francesca Cinelli (2046606), Abduazizkhon Shomansurov (2052124)

**Course:** Interactive Graphics 

---

## Short description
Sky Bowling is an interactive WebGL game built with Three.js that combines procedural levels, physics-driven interactions, hierarchical animated models, and an expressive UI. The player controls a ball that moves forward through stages, smashes pins, collects power-ups, and faces environmental hazards. The project contains lights, multiple texture types, user interaction, and code-driven animations.

## Play online
The project is hosted on GitHub Pages: `https://sapienzainteractivegraphicscourse.github.io/final-project-acsai_reborn/`
Open the link in any modern browser (Chrome / Firefox / Edge / Safari) to play. Wait for all the textures to load, this might take a few seconds or minutes depending on your browser. 

---

## Mapping to course requirements
- **Hierarchical models & at least one complex model:** The player character contains hierarchical components (aura, wings, animated wing joints) that are animated programmatically to show jointed motion; additionally, the fairy orbit and scene objects (gates) use parent-child relationships for coordinated animation. The wings + shoulder + joint system is a complex hierarchical model that performs coordinated flapping and transforms based on the game state (flying power-up). The fairy model also uses complex joint rotations.
- **Lights and textures:** The scene uses ambient, directional, and auxiliary lights (sun/moon) with shadows enabled. Textures include color/albedo maps for materials, and dynamic canvas-generated textures for UI/Gate signs. Stage-specific floor textures and power-up emblems are included.
- **User interaction:** Keyboard and mouse controls are implemented: lane movement, jump, swap ball, pause/resume, menu navigation, and texture/settings UI. The pause menu and settings let the user toggle music and SFX.
- **Animations (hand-coded):** All animations are implemented in JavaScript (no imported animations). Examples: wing flapping from hierarchical transforms, fairy orbiting, gate opening animations, splash/wind particle systems, and procedural chunk generation that moves/animates objects as the player progresses.

---

## Technical summary
- **Rendering:** `Three.js` (WebGL) — scene, materials, geometries, lights, textures.
- **Physics:** `Cannon-es` — rigid bodies, contact materials for ball/ground/obstacles.
- **Audio:** Web Audio API (synthesized tones & seamless background stage loops).
- **Architecture:** Modular ES6 JavaScript.
- **Assets:** External texture assets are located under `textures/`.

## External libraries & third-party assets
- **Three.js** — rendering (imported via ES modules)
- **Cannon-es** — physics engine
- No animation files were imported — all animations are authored entirely in code.

---

## Controls
- **Move Left/Right:** `A` / `D` or Left / Right arrow keys
- **Jump:** `W` / `Space` or Up arrow key
- **Swap Ball** (Stone <-> Beach Ball): `2`
- **Pause / Resume:** `9` or Mouse Click
- **Menus:** On-screen buttons or keyboard shortcuts as displayed in the in-game UI.

## User interface elements
- Main menu with Play, How to Play, Textures, and Settings modals.
- Real-time HUD tracking score, time, distance, speed multiplier, and power-up timers.
- Pause overlay with resume/abandon options and audio toggles.
- Dynamic stage transition text and "New High Score" flash animations.

---

## Project structure (Top-Level)
The project utilizes a clean, decoupled ES6 module architecture:

- `index.html` — Main page and application entry point.
- `main.js` — Core game loop (`animate`), physics stepping, chunk spawning orchestration, and input event listeners.
- `state.js` — Centralized game state management and object pools (for performance optimization).
- `config.js` — Data configurations for stages (colors, notes, roughness) and dynamic canvas texture generators.
- `environment.js` — Initialization of the Three.js scene, Cannon-es world, cameras, lights, environment (sun/moon/clouds), and texture loading.
- `level.js` — Procedural generation logic for gates, track chunks, obstacles, power-ups, and scenery.
- `player.js` — Player mesh/physics body setup and the complex hierarchical models (Wings, Fairy, Aura).
- `audio.js` — Web Audio API wrapper for sound effects and background music generation.
- `ui.js` — DOM manipulation, HUD setup, modals, and text animations.
- `textures/` — Image assets for floor maps and stone balls.

---

## How to run locally
Because the project uses ES6 Modules (`type="module"`), it must be run over a local HTTP server (opening `index.html` directly via `file://` will result in CORS errors).

Open a terminal in the project folder and run a static HTTP server. Example (Python 3):

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

*Note: Web Audio context requires a user gesture to start. Interact with the page (click anywhere or press a key) to enable audio.*

---

## Development & implementation notes

* **Performance (Object Pooling):** To handle high speeds and procedural generation without memory leaks or garbage collection stutter, arrays in `state.js` (e.g., `pools.trackTiles`, `pools.obstacles`) are used to manage active objects. Objects are safely removed from both the Three.js scene and Cannon-es world once they pass behind the camera.
* **Physics Synchronization:** In the main render loop, `world.step()` is called immediately before updating the `playerMesh` transform. This strict ordering prevents 1-frame delays between physics and rendering, eliminating camera/environment jitter at high speeds.

```

```