# Sky Bowling — Final Project (Interactive Graphics)

Play the project online:
<br>
<a href="https://sapienzainteractivegraphicscourse.github.io/final-project-acsai_reborn/">Click to play</a> 


**Repository:** `final-project-acsai_reborn`

**Authors:** Francesca Cinelli, Abduazizkhon Shomansurov

**Course:** Interactive Graphics 

---

**Short description**
- Sky Bowling is an interactive WebGL game built with Three.js that combines procedural levels, physics-driven interactions, hierarchical animated models, and an expressive UI. The player controls a ball that moves forward through stages, smashes pins, collects power-ups, and faces environmental hazards. The project contains lights, multiple texture types, user interaction, and animations.

**Play online**
- The project is hosted on GitHub Pages: `https://sapienzainteractivegraphicscourse.github.io/final-project-acsai_reborn/`,
  open the link in a browser (Chrome/Firefox/Edge/Safari).

---

**Mapping to course requirements**
- **Hierarchical models:** The player character contains hierarchical components (aura, wings, animated wing joints) that are animated programmatically to show jointed motion; additional scene objects (windmills, gates) use parent-child relationships for coordinated animation.
- **At least one complex model:** The wings + shoulder + joint system is a complex hierarchical model that performs coordinated flapping and transforms based on game state.
- **Lights and textures:** Scene uses ambient, directional, and auxiliary lights (sun/moon) with shadows enabled. Textures include color/albedo maps for materials; normal/specular-like physical response is achieved via `MeshPhysicalMaterial` settings and texture maps. Stage-specific floor textures and power-up emblems are included in the `textures/` folder.
- **User interaction:** Keyboard and mouse controls are implemented: lane movement, jump, swap ball, pause/resume, menu navigation, and texture/settings UI. The pause menu and settings let the user toggle music and sfx.
- **Animations (hand-coded):** All animations are implemented in JavaScript (no imported animations). Examples: wing flapping from hierarchical transforms, rotating windmills, gate animation, and procedural chunk generation that moves/animates objects as the player progresses.

---

**Technical summary**
- Rendering: `Three.js` (WebGL) — scene, materials, geometries, lights, textures.
- Physics: `Cannon.js` — rigid bodies, contact materials for ball/ground/obstacles.
- Audio: Web Audio API (synthesized tones & background loops).
- Assets: All in-repo assets are under `textures/`.
- Language: JavaScript (ES6), delivered as a static site.

**External libraries & third-party assets**
- Three.js — rendering (bundled via CDN or included in the project source)
- Cannon.js — physics
- No animation files were imported — all animations are authored in code (requirement compliance).
- Textures used are included in `textures/` (if any external textures were used, they must be listed here with license details in the project report).

---

**Controls**
- Move Left/Right: `A` / `D` or Left / Right arrow keys
- Jump: `W` / `Space` or Up arrow
- Swap Ball (stone <-> beach ball): `2`
- Pause / Resume: `9` or Mouse Click
- Menus: On-screen buttons or keyboard shortcuts as displayed in the in-game UI.

**User interface elements**
- Main menu with Play / How to Play / Textures / Settings
- HUD for score/time/power-ups
- Pause overlay with resume and abandon options
- Stage text and new high score animations

---

**Project structure (top-level)**
- `index.html` — main page and entry
- `main.js` — full application logic (rendering, physics, gameplay, UI)
- `textures/` — texture assets used by the project
- `README.md` — this document

---

**How to run locally**
Open a terminal in the project folder and run a static HTTP server. Examples (macOS / zsh):

```bash
# Using Python 3 built-in HTTP server (simple)
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

Notes: WebGL content and the AudioContext may be blocked until a user gesture (click/keydown), so interact with the page if audio is silent initially.

---

**Development & implementation notes (for graders)**
- The main scene is built in `main.js`. Key modules implemented in the single monolithic script:
	- Scene setup (camera, renderer, fog)
	- Lighting and day/night handling
	- Procedural chunk & obstacle spawning
	- Player object & hierarchical wing model
	- Physics integration with Cannon.js
	- UI: menus, HUD, modals
	- Audio synthesized via Web Audio API
	- Texture loading using `THREE.TextureLoader`

- Animations: hierarchical transforms are applied every frame in the main animation loop. Wing joint rotations and aura visibility are controlled by game state variables.


