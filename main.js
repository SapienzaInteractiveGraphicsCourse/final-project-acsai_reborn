import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Reflector } from 'https://unpkg.com/three@0.160.0/examples/jsm/objects/Reflector.js';

// ==========================================
// 1. SCENE & PHYSICS SETUP
// ==========================================
const scene = new THREE.Scene();

const dayColor = new THREE.Color(0x87CEEB);
const nightColor = new THREE.Color(0x000011);
scene.background = dayColor.clone(); 
scene.fog = new THREE.Fog(scene.background, 100, 500);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 600);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; 
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -30, 0) });

// ==========================================
// 2. LIGHTING & SKY SETUP
// ==========================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 50; dirLight.shadow.camera.bottom = -50;
dirLight.shadow.camera.left = -30; dirLight.shadow.camera.right = 30;
dirLight.shadow.mapSize.width = 2048; dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

const moonLight = new THREE.DirectionalLight(0xaaccff, 0.0);
moonLight.castShadow = true;
moonLight.shadow.camera.top = 50; moonLight.shadow.camera.bottom = -50;
moonLight.shadow.camera.left = -30; moonLight.shadow.camera.right = 30;
moonLight.shadow.mapSize.width = 2048; moonLight.shadow.mapSize.height = 2048;
scene.add(moonLight);

const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(15, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffea00, fog: false }));
scene.add(sunMesh);

const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 32), new THREE.MeshBasicMaterial({ color: 0xdddddd, fog: false }));
scene.add(moonMesh);

// Stars with Occlusion Fix
const starsGeo = new THREE.BufferGeometry();
const starsCount = 1500;
const posArray = new Float32Array(starsCount * 3);
for(let i = 0; i < starsCount; i++) {
    let x, y, z;
    do {
        x = (Math.random() - 0.5) * 800;
        y = (Math.random() - 0.5) * 800;
    } while (Math.abs(x) < 40 && Math.abs(y) < 40); 
    
    z = (Math.random() - 0.5) * 800;
    posArray[i*3] = x; posArray[i*3+1] = y; posArray[i*3+2] = z;
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const starsMat = new THREE.PointsMaterial({ size: 1.5, color: 0xffffff, transparent: true, opacity: 0, fog: false });
const starsPoints = new THREE.Points(starsGeo, starsMat);
scene.add(starsPoints);

// --- CLOUDS SETUP ---
const cloudsGroup = new THREE.Group();
const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, flatShading: true, fog: true });
const cloudGeo = new THREE.SphereGeometry(1, 8, 8); 

for (let i = 0; i < 150; i++) {
    const cloudCluster = new THREE.Group();
    const puffs = 3 + Math.floor(Math.random() * 4); 
    for(let j = 0; j < puffs; j++) {
        const puff = new THREE.Mesh(cloudGeo, cloudMat);
        puff.position.set((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 15);
        puff.scale.set(6 + Math.random() * 8, 4 + Math.random() * 4, 6 + Math.random() * 8);
        cloudCluster.add(puff);
    }
    
    let yPos = i < 30 ? 70 + Math.random() * 40 : -80 + Math.random() * 70; 
    cloudCluster.position.set((Math.random() - 0.5) * 800, yPos, (Math.random() - 0.5) * 800);
    cloudsGroup.add(cloudCluster);
}
scene.add(cloudsGroup);

// ==========================================
// 3. TEXTURES, UI, STAGES & GAME STATE
// ==========================================
let gameState = 'MENU'; 
let currentForm = 'beachBall'; 
let isSinking = false;
let sinkTarget = null;
let isPaused = false; 
let playerName = "Player";

let survivalTime = 0;
let pinsSmashed = 0;
let distanceTraveled = 0;
let gameOverTimer = 0;
let gatesPassed = 0; 
let gameElapsedTime = 0; 

let nextSpawnZ = -40; 
let nextGateZ = -1000; 
let wasGap = false;

// Power-Up State
let activePowerUp = null;
let powerUpTimer = 0;
const powerups = [];

const windParticles = []; 
const windGeo = new THREE.BoxGeometry(0.1, 0.1, 1.5);
const windMat = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.5});

// Floor Particles
const floorParticles = [];
const fpGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);

// High Score Variables
let highScore = { score: 0, time: 0, distance: 0, pins: 0, player: "" };
let currentScore = 0;
let hasReachedNewHighScore = false;

let isModalOpen = false;

const mainMenu = document.getElementById('main-menu');
const playBtn = document.getElementById('play-btn');
const latestScoreText = document.getElementById('latest-score');

let oldUiHUD = document.getElementById('ui');
if (oldUiHUD) oldUiHUD.remove(); 

const uiHUD = document.createElement('div');
uiHUD.id = 'ui';
uiHUD.style.position = 'absolute';
uiHUD.style.top = '10px';
uiHUD.style.left = '10px';
uiHUD.style.color = '#fff';
uiHUD.style.background = 'rgba(0,0,0,0.7)';
uiHUD.style.padding = '15px';
uiHUD.style.borderRadius = '8px';
uiHUD.style.fontFamily = 'sans-serif';
uiHUD.style.display = 'none';
uiHUD.style.zIndex = '500';
uiHUD.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 10px; color: #ffeb3b;">Sky Bowling</h3>
    <p id="status" style="font-weight:bold; color:#33ccff; margin: 0;">Current Form: Beach Ball (Floaty)</p>
`;
document.body.appendChild(uiHUD);
const UI_Status = document.getElementById('status');

// --- CSS FOR FLASHING "NEW!" BADGE ---
const flashStyle = document.createElement('style');
flashStyle.innerHTML = `
    @keyframes flashNewBadge {
        0%, 100% { opacity: 1; transform: scale(1) rotate(-5deg); }
        50% { opacity: 0.6; transform: scale(1.1) rotate(5deg); }
    }
    .new-score-badge {
        color: #00ccff;
        font-family: "Arial Black", Arial, sans-serif;
        text-shadow: 0px 0px 15px rgba(0, 204, 255, 0.8);
        display: inline-block;
        animation: flashNewBadge 0.6s infinite ease-in-out;
        margin-left: 15px;
        font-size: 1.8rem;
        vertical-align: middle;
    }
`;
document.head.appendChild(flashStyle);

// --- MAIN MENU HIGH SCORE DISPLAY ---
const highScoreMenuText = document.createElement('div');
highScoreMenuText.innerHTML = `High Score: <span style="color:#00ccff">0</span> | <span style="color:#00e676">0.0s</span> | <span style="color:#00e676">0m</span> | <span style="color:#ffcc00">0</span> Pins`;
highScoreMenuText.style.fontSize = '1.5rem';
highScoreMenuText.style.marginBottom = '10px';
highScoreMenuText.style.color = '#fff';
highScoreMenuText.style.textShadow = '1px 1px 5px rgba(0,0,0,1)';
if (latestScoreText && latestScoreText.parentNode) {
    latestScoreText.parentNode.insertBefore(highScoreMenuText, latestScoreText);
} else {
    mainMenu.appendChild(highScoreMenuText);
}

// HUD for scores
const scoreHud = document.createElement('div');
scoreHud.style.position = 'absolute'; scoreHud.style.top = '10px'; scoreHud.style.right = '10px';
scoreHud.style.color = '#fff';
scoreHud.style.background = 'rgba(0,0,0,0.7)';
scoreHud.style.padding = '15px'; scoreHud.style.borderRadius = '8px';
scoreHud.style.fontFamily = 'sans-serif'; scoreHud.style.fontSize = '18px';
scoreHud.style.fontWeight = 'bold'; scoreHud.style.textAlign = 'right'; scoreHud.style.display = 'none';
scoreHud.style.zIndex = '500';
document.body.appendChild(scoreHud);

// --- POWER-UP TIMER UI ---
const timerUI = document.createElement('div');
timerUI.style.position = 'absolute';
timerUI.style.top = '20px';
timerUI.style.left = '50%';
timerUI.style.transform = 'translateX(-50%)';
timerUI.style.display = 'none';
timerUI.style.alignItems = 'center';
timerUI.style.justifyContent = 'center';
timerUI.style.zIndex = '1000';
timerUI.innerHTML = `
    <svg width="60" height="60" style="transform: rotate(-90deg);">
        <circle cx="30" cy="30" r="25" fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="6" />
        <circle id="timer-circle" cx="30" cy="30" r="25" fill="none" stroke="#00ff00" stroke-width="6" stroke-dasharray="157" stroke-dashoffset="0" style="transition: stroke-dashoffset 0.1s linear;" />
    </svg>
    <div id="timer-text" style="position:absolute; font-family:'Arial Black', sans-serif; font-size:24px; font-weight:900; text-shadow:0px 0px 10px rgba(0,0,0,0.8); color:#00ff00;">10</div>
`;
document.body.appendChild(timerUI);


// ==========================================
// 4. AUDIO SYSTEM (Synthesized)
// ==========================================
let audioCtx = null;
let sfxEnabled = true;
let musicEnabled = true;

// Lazy initialize AudioContext on user interaction
function getAudioCtx() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

const resumeAudio = () => { getAudioCtx(); };
window.addEventListener('mousedown', resumeAudio);
window.addEventListener('keydown', resumeAudio);
window.addEventListener('touchstart', resumeAudio);
window.addEventListener('focus', resumeAudio);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) resumeAudio();
});

function playTone(freq, type, duration, vol=0.2) {
    if(!sfxEnabled) return;
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    
    gain.gain.setValueAtTime(vol, t);
    gain.gain.linearRampToValueAtTime(0.01, t + duration); 
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
}

// Background Music Loop (Smooth Crossfade handling inside animate block below)
let bgmNoteIdx = 0;
setInterval(() => {
    if (!musicEnabled || isPaused || gameState !== 'PLAYING') return;
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') return;
    
    const t = ctx.currentTime;
    let sOld = stagesInfo[oldStageIdx];
    let sNew = stagesInfo[currentStageIdx];
    
    let freqOld = sOld.notes[bgmNoteIdx % sOld.notes.length];
    let freqNew = sNew.notes[bgmNoteIdx % sNew.notes.length];
    
    let gainOld = (1.0 - transitionProgress) * 0.12;
    let gainNew = transitionProgress * 0.12;

    if (gainOld > 0.005) {
        let oscOld = ctx.createOscillator();
        let gOld = ctx.createGain();
        oscOld.type = sOld.wave;
        oscOld.frequency.setValueAtTime(freqOld, t);
        gOld.gain.setValueAtTime(gainOld, t);
        gOld.gain.linearRampToValueAtTime(0.01, t + 0.3);
        oscOld.connect(gOld);
        gOld.connect(ctx.destination);
        oscOld.start(t);
        oscOld.stop(t + 0.3);
    }
    
    if (gainNew > 0.005) {
        let oscNew = ctx.createOscillator();
        let gNew = ctx.createGain();
        oscNew.type = sNew.wave;
        oscNew.frequency.setValueAtTime(freqNew, t);
        gNew.gain.setValueAtTime(gainNew, t);
        gNew.gain.linearRampToValueAtTime(0.01, t + 0.3);
        oscNew.connect(gNew);
        gNew.connect(ctx.destination);
        oscNew.start(t);
        oscNew.stop(t + 0.3);
    }
    
    bgmNoteIdx++;
}, 300);

// --- PAUSE OVERLAY ---
const pauseOverlay = document.createElement('div');
pauseOverlay.id = 'pause-overlay';
pauseOverlay.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:none; flex-direction:column; justify-content:center; align-items:center; z-index:2000; font-family:sans-serif;";
pauseOverlay.innerHTML = `
    <div style="position:absolute; top:10px; left:10px; background:rgba(0,0,0,0.7); padding:15px; border-radius:8px; color:white; text-align:left;">
        <h3 style="margin-top: 0; color: #ffeb3b;">Sky Bowling</h3>
        <p id="pause-status" style="font-weight:bold; color:#33ccff; margin-bottom: 10px;">Current Form: Beach Ball (Floaty)</p>
        <hr style="border-color: #555; margin: 10px 0;">
        <h3 style="margin-top:0; color:#ffeb3b; font-size:1.2rem;">Commands</h3>
        <p style="margin:5px 0;"><b>[A]/[D]</b> or <b>Arrows</b>: Move</p>
        <p style="margin:5px 0;"><b>[W]/[Space]</b>: Jump</p>
        <p style="margin:5px 0;"><b>[2]</b>: Swap Ball</p>
        <p style="margin:5px 0;"><b>[9]</b> or <b>Click</b>: Pause</p>
    </div>
    <div id="pause-stats" style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.7); padding:15px; border-radius:8px; color:white; text-align:right; font-size:18px; font-weight:bold;">
        </div>
    <h1 style="color:#ffcc00; font-size:5rem; margin-bottom:40px; font-family:'Arial Black', sans-serif; text-shadow:0px 0px 20px rgba(255,204,0,0.8);">GAME PAUSED</h1>
    <div style="display:flex; gap:20px; margin-bottom:30px;">
        <button id="resume-btn" style="padding:15px 40px; font-size:1.5rem; cursor:pointer; background:#00e676; border:none; border-radius:50px; color:#111; font-weight:900; box-shadow:0 6px 20px rgba(0,230,118,0.4); transition:all 0.2s ease;">RESUME GAME</button>
        <button id="abandon-btn" style="padding:15px 40px; font-size:1.5rem; cursor:pointer; background:#ff3333; border:none; border-radius:50px; color:#111; font-weight:900; box-shadow:0 6px 20px rgba(255,51,51,0.4); transition:all 0.2s ease;">ABANDON GAME</button>
    </div>
    <div style="display:flex; gap:15px;">
        <button id="pmusic-btn" style="padding:10px 20px; font-size:1rem; cursor:pointer; background:#00ccff; border:none; border-radius:30px; color:#111; font-weight:bold; box-shadow:0 4px 15px rgba(0,204,255,0.4); transition:all 0.2s ease;">MUSIC: ON</button>
        <button id="psfx-btn" style="padding:10px 20px; font-size:1rem; cursor:pointer; background:#00ccff; border:none; border-radius:30px; color:#111; font-weight:bold; box-shadow:0 4px 15px rgba(0,204,255,0.4); transition:all 0.2s ease;">SFX: ON</button>
    </div>
`;
document.body.appendChild(pauseOverlay);

const resumeBtn = document.getElementById('resume-btn');
const abandonBtn = document.getElementById('abandon-btn');
const pMusicBtn = document.getElementById('pmusic-btn');
const pSfxBtn = document.getElementById('psfx-btn');

function addHover(btn) {
    btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.05)');
    btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
    btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.95)');
    btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1.05)');
}
addHover(resumeBtn); addHover(abandonBtn); addHover(pMusicBtn); addHover(pSfxBtn);

resumeBtn.addEventListener('click', togglePause);
abandonBtn.addEventListener('click', () => {
    togglePause();
    gameState = 'GAMEOVER';
    gameOverTimer = 999; 
});

function updatePauseStats() {
    const pStats = document.getElementById('pause-stats');
    pStats.innerHTML = scoreHud.innerHTML;
}

function togglePause() {
    if (gameState !== 'PLAYING') return;
    isPaused = !isPaused;
    if (isPaused) {
        uiHUD.style.display = 'none';
        scoreHud.style.display = 'none';
        pauseOverlay.style.display = 'flex';
        updatePauseStats();
        
        // Sync pause left panel with actual status
        const pStatus = document.getElementById('pause-status');
        pStatus.innerText = UI_Status.innerText;
        pStatus.style.color = UI_Status.style.color;
    } else {
        uiHUD.style.display = 'block';
        scoreHud.style.display = 'block';
        pauseOverlay.style.display = 'none';
    }
}

// --- PLAYER NAME INPUT ---
const playerNameInput = document.createElement('input');
playerNameInput.type = 'text';
playerNameInput.placeholder = 'Enter Player Name';
playerNameInput.style.padding = "10px 20px";
playerNameInput.style.fontSize = "1.2rem";
playerNameInput.style.marginBottom = "20px";
playerNameInput.style.borderRadius = "25px";
playerNameInput.style.border = "2px solid #00ccff";
playerNameInput.style.textAlign = "center";
playerNameInput.style.fontFamily = "sans-serif";
playerNameInput.style.fontWeight = "bold";
playerNameInput.style.background = "rgba(0,0,0,0.6)";
playerNameInput.style.color = "#fff";

// Hide input on Enter to confirm
playerNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        playerName = playerNameInput.value.trim() || 'Player';
        playerNameInput.style.display = 'none';
        playerNameInput.blur();
    }
});


// --- MAIN MENU BUTTONS (3 ROWS LAYOUT) ---
const howToPlayBtn = document.createElement('button');
howToPlayBtn.innerText = "HOW TO PLAY";
const texturesBtn = document.createElement('button');
texturesBtn.innerText = "TEXTURES";
const settingsBtn = document.createElement('button');
settingsBtn.innerText = "SETTINGS";

[howToPlayBtn, texturesBtn, settingsBtn].forEach(btn => {
    btn.style.padding = "10px 25px";
    btn.style.fontSize = "1.2rem";
    btn.style.cursor = "pointer";
    btn.style.background = "#00e676";
    btn.style.border = "none";
    btn.style.borderRadius = "50px";
    btn.style.color = "#111";
    btn.style.fontWeight = "900";
    btn.style.letterSpacing = "1px";
    btn.style.boxShadow = "0 6px 20px rgba(0, 230, 118, 0.4)";
    btn.style.transition = "all 0.2s ease";
    btn.style.display = "block";
    btn.style.margin = "15px auto 0 auto";
    
    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'scale(1.05)';
        btn.style.background = '#00c853';
        btn.style.boxShadow = '0 8px 25px rgba(0, 230, 118, 0.6)';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'scale(1)';
        btn.style.background = '#00e676';
        btn.style.boxShadow = '0 6px 20px rgba(0, 230, 118, 0.4)';
    });
    btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.95)');
    btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1.05)');
});

// Configure horizontal container for Textures & Settings
texturesBtn.style.margin = "0";
settingsBtn.style.margin = "0";

const row3Container = document.createElement('div');
row3Container.style.display = 'flex';
row3Container.style.justifyContent = 'center';
row3Container.style.gap = '20px';
row3Container.style.marginTop = '15px';
row3Container.appendChild(texturesBtn);
row3Container.appendChild(settingsBtn);

const startHintText = document.createElement('div');
startHintText.innerText = "Press the play button, space bar or enter key to start the game";
startHintText.style.color = "#fff";
startHintText.style.fontFamily = '"Arial Black", Arial, sans-serif';
startHintText.style.fontSize = "14px";
startHintText.style.fontWeight = "normal";
startHintText.style.marginBottom = "20px";
startHintText.style.opacity = "0.8";

if (playBtn && playBtn.parentNode) {
    playBtn.parentNode.insertBefore(playerNameInput, playBtn);
    playBtn.parentNode.insertBefore(startHintText, playBtn);
    playBtn.parentNode.insertBefore(howToPlayBtn, playBtn.nextSibling);
    howToPlayBtn.parentNode.insertBefore(row3Container, howToPlayBtn.nextSibling);
} else {
    mainMenu.appendChild(playerNameInput);
    mainMenu.appendChild(startHintText);
    mainMenu.appendChild(howToPlayBtn);
    mainMenu.appendChild(row3Container);
}


function createModal(id, titleHtml, innerHtml) {
    const mod = document.createElement('div');
    mod.id = id;
    mod.style.position = 'absolute';
    mod.style.top = '50%';
    mod.style.left = '50%';
    mod.style.transform = 'translate(-50%, -50%) scale(0)';
    mod.style.width = '400px';
    mod.style.background = 'rgba(0, 0, 0, 0.9)';
    mod.style.border = '3px solid #00ccff';
    mod.style.borderRadius = '15px';
    mod.style.padding = '30px';
    mod.style.color = '#fff';
    mod.style.fontFamily = 'sans-serif';
    mod.style.textAlign = 'center';
    mod.style.zIndex = '3000';
    mod.style.transition = 'transform 0.3s ease-in-out';
    
    mod.innerHTML = `<h2 style="color:#00ccff; margin-top:0;">${titleHtml}</h2>${innerHtml}`;
    
    const cBtn = document.createElement('button');
    cBtn.innerText = "CLOSE";
    cBtn.style.marginTop = "20px";
    cBtn.style.padding = "10px 25px";
    cBtn.style.fontSize = "1.2rem";
    cBtn.style.fontWeight = "900";
    cBtn.style.cursor = "pointer";
    cBtn.style.borderRadius = "50px";
    cBtn.style.border = "none";
    cBtn.style.background = "#00ccff";
    cBtn.style.color = "#111"; 
    cBtn.style.boxShadow = "0 6px 20px rgba(0, 204, 255, 0.4)";
    cBtn.style.transition = "all 0.2s ease";
    mod.appendChild(cBtn);

    cBtn.addEventListener('mouseenter', () => {
        cBtn.style.transform = 'scale(1.05)';
        cBtn.style.boxShadow = '0 8px 25px rgba(0, 204, 255, 0.6)';
    });
    cBtn.addEventListener('mouseleave', () => {
        cBtn.style.transform = 'scale(1)';
        cBtn.style.boxShadow = '0 6px 20px rgba(0, 204, 255, 0.4)';
    });
    cBtn.addEventListener('mousedown', () => cBtn.style.transform = 'scale(0.95)');
    cBtn.addEventListener('mouseup', () => cBtn.style.transform = 'scale(1.05)');

    cBtn.addEventListener('click', () => {
        isModalOpen = false;
        mod.style.transform = 'translate(-50%, -50%) scale(0)';
    });
    
    document.body.appendChild(mod);
    return { modal: mod, closeBtn: cBtn };
}

const rulesObj = createModal('rules-modal', 'HOW TO PLAY', `
    <p style="font-size:16px; line-height:1.6; text-align:left;">
        <b>[A] / [D] or [Left] / [Right]:</b> Change lanes<br><br>
        <b>[W] / [Space] or [Up]:</b> Jump<br><br>
        <b>[2]:</b> Swap Stone (Heavy) & Beach Ball (Floaty)<br><br>
        <b>[9] or [Mouse Click]:</b> Pause / Resume Game<br><br>
        <em>You can smash pins with the Stone ball! The Beach ball is floaty on water and jumps high!</em><br><br>
        <b>Power-ups (Stage 1+):</b><br>
        🟢 <b>Green (💪):</b> Invincibility (Crush anything, don't sink!)<br>
        🟣 <b>Purple (🪽):</b> Flying (Soar above all obstacles!)<br><br>
        <b> The objective is to survive for the longest amount of time possible and hit as many pins as you can!</b>
    </p>
`);

howToPlayBtn.addEventListener('click', () => {
    isModalOpen = true;
    rulesObj.modal.style.transform = 'translate(-50%, -50%) scale(1)';
});

const texObj = createModal('tex-modal', 'CHOOSE TEXTURES', `
    <div style="text-align:left; margin-bottom: 20px;">
        <label style="display:block; margin-bottom:5px; font-weight:bold;">Stone Ball Texture:</label>
        <select id="stone-tex-select" style="width:100%; padding:10px; font-size:16px; border-radius:5px; border:none;">
            <option value="textures/bricks_color.png">Default (Bricks)</option>
            <option value="textures/granite_color.jpg">Granite</option>
            <option value="textures/marble_color.jpg">Marble</option>
            <option value="textures/concrete_color.png">Concrete</option>
        </select>
    </div>
    <div style="text-align:left; margin-bottom: 20px;">
        <label style="display:block; margin-bottom:5px; font-weight:bold;">Beach Ball Color:</label>
        <select id="beach-col-select" style="width:100%; padding:10px; font-size:16px; border-radius:5px; border:none;">
            <option value="0xaa0000">Default (Red)</option>
            <option value="0x0000aa">Blue</option>
            <option value="0x00aa00">Green</option>
            <option value="0xaa00aa">Purple</option>
        </select>
    </div>
`);
texObj.closeBtn.innerText = "SAVE & CLOSE";
texturesBtn.addEventListener('click', () => {
    isModalOpen = true;
    texObj.modal.style.transform = 'translate(-50%, -50%) scale(1)';
});

const setObj = createModal('set-modal', 'SETTINGS', `
    <div style="display:flex; justify-content:space-around; margin: 30px 0;">
        <button id="mmusic-btn" style="padding:10px 20px; font-size:1.2rem; cursor:pointer; background:#00ccff; border:none; border-radius:30px; color:#111; font-weight:bold; box-shadow:0 4px 15px rgba(0,204,255,0.4); transition:all 0.2s ease;">MUSIC: ON</button>
        <button id="msfx-btn" style="padding:10px 20px; font-size:1.2rem; cursor:pointer; background:#00ccff; border:none; border-radius:30px; color:#111; font-weight:bold; box-shadow:0 4px 15px rgba(0,204,255,0.4); transition:all 0.2s ease;">SFX: ON</button>
    </div>
`);
settingsBtn.addEventListener('click', () => {
    isModalOpen = true;
    setObj.modal.style.transform = 'translate(-50%, -50%) scale(1)';
});

const toggleM = () => { 
    musicEnabled = !musicEnabled; 
    document.getElementById('mmusic-btn').innerText = `MUSIC: ${musicEnabled?'ON':'OFF'}`;
    pMusicBtn.innerText = `MUSIC: ${musicEnabled?'ON':'OFF'}`;
};
const toggleS = () => { 
    sfxEnabled = !sfxEnabled; 
    document.getElementById('msfx-btn').innerText = `SFX: ${sfxEnabled?'ON':'OFF'}`;
    pSfxBtn.innerText = `SFX: ${sfxEnabled?'ON':'OFF'}`;
};
document.getElementById('mmusic-btn').addEventListener('click', toggleM);
pMusicBtn.addEventListener('click', toggleM);
document.getElementById('msfx-btn').addEventListener('click', toggleS);
pSfxBtn.addEventListener('click', toggleS);

// --- CREDITS UI (MENU ONLY) ---
const creditLeft = document.createElement('div');
creditLeft.innerHTML = 'Interactive graphics final project';
creditLeft.style.position = 'absolute';
creditLeft.style.bottom = '15px';
creditLeft.style.left = '15px';
creditLeft.style.color = '#ffeb3b';
creditLeft.style.fontFamily = '"Arial Black", Arial, sans-serif';
creditLeft.style.fontSize = '16px';
creditLeft.style.fontWeight = 'bold';
creditLeft.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
creditLeft.style.zIndex = '1000';
document.body.appendChild(creditLeft);

const creditRight = document.createElement('div');
creditRight.innerHTML = 'Coded by Francesca Cinelli and Abduazizkhon Shomansurov';
creditRight.style.position = 'absolute';
creditRight.style.bottom = '15px';
creditRight.style.right = '15px';
creditRight.style.color = '#ffeb3b';
creditRight.style.fontFamily = '"Arial Black", Arial, sans-serif';
creditRight.style.fontSize = '16px';
creditRight.style.fontWeight = 'bold';
creditRight.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
creditRight.style.zIndex = '1000';
document.body.appendChild(creditRight);

// --- STAGES CONFIGURATION ---
const stagesInfo = [
    { name: 'Sky', bgDay: 0x87CEEB, bgNight: 0x000011, floorCol: 0xffffff, floorRough: 0.9, pinCol: 0xffffff, puddleCol: 0x1ca3ec, gateFrame: 0x00ccff, gateDoor: 0xffaa00, gateHandle: 0xff00ff, trail: false, trailCol: 0x000000, emoji: '☁️', notes: [261.6, 329.6, 392.0, 523.3, 392.0, 329.6, 261.6, 392.0, 440.0, 392.0, 349.2, 329.6, 293.7, 329.6, 392.0, 523.3, 261.6, 329.6, 392.0, 659.3, 523.3, 392.0, 261.6, 392.0, 440.0, 523.3, 587.3, 523.3, 440.0, 392.0, 349.2, 293.7, 261.6, 329.6, 392.0, 523.3, 392.0, 329.6, 261.6, 329.6, 392.0, 440.0, 392.0, 329.6, 261.6, 196.0, 261.6, 329.6], wave: 'sine' },
    { name: 'Neon City', bgDay: 0x87CEEB, bgNight: 0x000011, floorCol: 0xffffff, floorRough: 0.7, pinCol: 0xffff00, puddleCol: 0xFF00EA, gateFrame: 0xff00ff, gateDoor: 0x00ffff, gateHandle: 0xffff00, trail: true, trailCol: 0x27EEF5, emoji: '🏙️', notes: [220.0, 261.6, 329.6, 220.0, 440.0, 329.6, 261.6, 329.6, 196.0, 246.9, 293.7, 196.0, 392.0, 293.7, 246.9, 293.7, 220.0, 261.6, 329.6, 440.0, 523.3, 440.0, 329.6, 261.6, 174.6, 220.0, 261.6, 349.2, 440.0, 349.2, 261.6, 220.0, 220.0, 261.6, 329.6, 220.0, 440.0, 329.6, 261.6, 329.6, 196.0, 246.9, 293.7, 196.0, 392.0, 293.7, 246.9, 293.7], wave: 'square' },
    { name: 'Forest', bgDay: 0x87CEEB, bgNight: 0x000011, floorCol: 0xffffff, floorRough: 0.95, pinCol: 0x5c4033, puddleCol: 0xa67b5b, gateFrame: 0x3d2817, gateDoor: 0x228b22, gateHandle: 0x8b4513, trail: true, trailCol: 0x3b7a33, emoji: '🌲', notes: [220.0, 261.6, 329.6, 440.0, 329.6, 261.6, 220.0, 261.6, 174.6, 220.0, 261.6, 349.2, 261.6, 220.0, 174.6, 261.6, 220.0, 329.6, 440.0, 523.3, 440.0, 329.6, 220.0, 329.6, 196.0, 293.7, 392.0, 440.0, 392.0, 293.7, 196.0, 293.7, 220.0, 261.6, 329.6, 440.0, 329.6, 261.6, 220.0, 261.6, 174.6, 220.0, 261.6, 349.2, 261.6, 220.0, 174.6, 261.6], wave: 'sine' },
    { name: 'Snow', bgDay: 0x87CEEB, bgNight: 0x000011, floorCol: 0xffffff, floorRough: 0.8, pinCol: 0x00bfff, puddleCol: 0xaaddff, gateFrame: 0xffffff, gateDoor: 0x88ccff, gateHandle: 0x0000ff, trail: true, trailCol: 0xeeeeee, emoji: '⛄', notes: [392.0, 440.0, 523.3, 587.3, 659.3, 587.3, 523.3, 440.0, 392.0, 329.6, 392.0, 440.0, 523.3, 440.0, 392.0, 329.6, 392.0, 523.3, 783.9, 523.3, 392.0, 329.6, 261.6, 329.6, 349.2, 440.0, 523.3, 440.0, 349.2, 261.6, 196.0, 261.6, 392.0, 329.6, 261.6, 196.0, 164.8, 196.0, 261.6, 329.6, 261.6, 196.0, 164.8, 146.8, 130.8, 146.8, 164.8, 196.0], wave: 'triangle' },
    { name: 'Volcano', bgDay: 0x87CEEB, bgNight: 0x000011, floorCol: 0xffffff, floorRough: 0.7, pinCol: 0x595959, puddleCol: 0x6E0000, gateFrame: 0x111111, gateDoor: 0xff3300, gateHandle: 0xffff00, trail: true, trailCol: 0xff3300, emoji: '🌋', notes: [130.8, 138.6, 164.8, 174.6, 196.0, 174.6, 164.8, 138.6, 130.8, 196.0, 174.6, 164.8, 138.6, 164.8, 174.6, 196.0, 130.8, 164.8, 196.0, 261.6, 196.0, 164.8, 130.8, 164.8, 138.6, 174.6, 207.65, 277.18, 207.65, 174.6, 138.6, 174.6, 130.8, 138.6, 164.8, 174.6, 196.0, 174.6, 164.8, 138.6, 146.8, 155.6, 174.6, 185.0, 220.0, 185.0, 155.6, 146.8], wave: 'sawtooth' },
    { name: 'Desert', bgDay: 0x87CEEB, bgNight: 0x000011, floorCol: 0xffffff, floorRough: 1.0, pinCol: 0x2e8b57, puddleCol: 0xc2b280, gateFrame: 0xEDC9Af, gateDoor: 0x8b4513, gateHandle: 0x000000, trail: true, trailCol: 0xEDC9Af, emoji: '🌵', notes: [146.8, 155.6, 185.0, 220.0, 185.0, 155.6, 146.8, 220.0, 293.7, 220.0, 185.0, 155.6, 146.8, 155.6, 185.0, 220.0, 146.8, 220.0, 293.7, 311.1, 293.7, 220.0, 185.0, 155.6, 130.8, 196.0, 261.6, 311.1, 261.6, 196.0, 155.6, 146.8, 146.8, 155.6, 185.0, 220.0, 185.0, 155.6, 146.8, 220.0, 246.9, 293.7, 329.6, 293.7, 246.9, 220.0, 196.0, 261.6], wave: 'triangle' }
];

let currentStageIdx = 0;
let trackStageIdx = 0;
let oldStageIdx = 0;
let transitionProgress = 1.0;

function startStageTransition() {
    oldStageIdx = currentStageIdx;
    currentStageIdx = (currentStageIdx + 1) % stagesInfo.length;
    transitionProgress = 0.0;
}

// Helper to draw emojis onto CanvasTextures for the gates
function createDoorTex(emoji, bgColorHex) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#' + bgColorHex.toString(16).padStart(6, '0');
    ctx.fillRect(0,0,256,512);
    ctx.fillStyle = 'white';
    ctx.font = '120px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 128, 256);
    return new THREE.CanvasTexture(c);
}

// Stage Material Pools
const stageMats = stagesInfo.map(s => ({
    pin: new THREE.MeshStandardMaterial({ color: s.pinCol, roughness: 0.4 }),
    puddle: new THREE.MeshBasicMaterial({ color: s.puddleCol, transparent: true, opacity: 0.85 }),
    splash: new THREE.MeshBasicMaterial({ color: s.puddleCol, transparent: true, opacity: 0.8 })
}));

// --- STAGE ANIMATION UI ---
const stageText = document.createElement('div');
stageText.style.position = 'absolute';
stageText.style.top = '25%';
stageText.style.left = '50%';
stageText.style.transform = 'translate(-50%, -50%) scale(0.1)';
stageText.style.color = '#ffcc00';
stageText.style.fontSize = '90px';
stageText.style.fontWeight = '900';
stageText.style.fontFamily = '"Arial Black", Arial, sans-serif';
stageText.style.textShadow = '0px 0px 20px rgba(255, 204, 0, 0.8), 4px 4px 10px rgba(0,0,0,0.8)';
stageText.style.pointerEvents = 'none';
stageText.style.opacity = '0';
stageText.style.zIndex = '1000';
stageText.style.textAlign = 'center';
document.body.appendChild(stageText);

function showStageText(num, nameStr) {
    stageText.innerHTML = `STAGE ${num}<br><span style="font-size: 0.4em;">${nameStr}</span>`;
    stageText.style.transition = 'none';
    stageText.style.transform = 'translate(-50%, -50%) scale(0.1)';
    stageText.style.opacity = '1';
    void stageText.offsetWidth;
    stageText.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease-out';
    stageText.style.transform = 'translate(-50%, -50%) scale(1)';
    setTimeout(() => {
        stageText.style.transition = 'transform 0.5s ease-in, opacity 0.5s ease-in';
        stageText.style.transform = 'translate(-50%, -50%) scale(1.5)';
        stageText.style.opacity = '0';
    }, 1200);
}

// --- NEW HIGH SCORE UI ---
const newHighScoreText = document.createElement('div');
newHighScoreText.innerText = "NEW HIGH SCORE REACHED!";
newHighScoreText.style.position = 'absolute';
newHighScoreText.style.top = '15%';
newHighScoreText.style.left = '50%';
newHighScoreText.style.transform = 'translate(-50%, -50%) scale(0.1)';
newHighScoreText.style.color = '#00ccff';
newHighScoreText.style.fontSize = '40px';
newHighScoreText.style.fontWeight = '900';
newHighScoreText.style.fontFamily = '"Arial Black", Arial, sans-serif';
newHighScoreText.style.textShadow = '0px 0px 20px rgba(0, 204, 255, 0.8), 4px 4px 10px rgba(0,0,0,0.8)';
newHighScoreText.style.pointerEvents = 'none';
newHighScoreText.style.opacity = '0';
newHighScoreText.style.zIndex = '1000';
newHighScoreText.style.textAlign = 'center';
document.body.appendChild(newHighScoreText);

function showNewHighScoreText() {
    newHighScoreText.style.transition = 'none';
    newHighScoreText.style.transform = 'translate(-50%, -50%) scale(0.1)';
    newHighScoreText.style.opacity = '1';
    void newHighScoreText.offsetWidth;
    newHighScoreText.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease-out';
    newHighScoreText.style.transform = 'translate(-50%, -50%) scale(1)';
    
    playTone(600, 'sine', 0.1, 0.5);
    setTimeout(() => playTone(800, 'sine', 0.2, 0.5), 100);

    setTimeout(() => {
        newHighScoreText.style.transition = 'transform 0.5s ease-in, opacity 0.5s ease-in';
        newHighScoreText.style.transform = 'translate(-50%, -50%) scale(1.5)';
        newHighScoreText.style.opacity = '0';
    }, 2000);
}

// --- GAME OVER UI ---
const gameOverText = document.createElement('div');
gameOverText.innerText = "GAME OVER";
gameOverText.style.position = 'absolute';
gameOverText.style.top = '40%';
gameOverText.style.left = '50%';
gameOverText.style.transform = 'translate(-50%, -50%) scale(0.1)';
gameOverText.style.color = '#ff3333'; // Red
gameOverText.style.fontSize = '100px';
gameOverText.style.fontWeight = '900';
gameOverText.style.fontFamily = '"Arial Black", Arial, sans-serif';
gameOverText.style.textShadow = '0px 0px 20px rgba(255, 51, 51, 0.8), 4px 4px 10px rgba(0,0,0,0.8)';
gameOverText.style.pointerEvents = 'none';
gameOverText.style.opacity = '0';
gameOverText.style.zIndex = '1000';
gameOverText.style.textAlign = 'center';
document.body.appendChild(gameOverText);

function showGameOverText() {
    gameOverText.style.transition = 'none';
    gameOverText.style.transform = 'translate(-50%, -50%) scale(0.1)';
    gameOverText.style.opacity = '1';
    void gameOverText.offsetWidth;
    gameOverText.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease-out';
    gameOverText.style.transform = 'translate(-50%, -50%) scale(1)';
    
    // Game over sound kept quiet
    playTone(150, 'sawtooth', 0.8, 0.04);
    setTimeout(() => playTone(100, 'sawtooth', 1.0, 0.04), 400);
}

function hideGameOverText() {
    gameOverText.style.opacity = '0';
}

const textureLoader = new THREE.TextureLoader();

const stoneTexture = textureLoader.load('textures/bricks_color.png');
stoneTexture.colorSpace = THREE.SRGBColorSpace; 

// Dynamic Floor Textures based on stage
const floorTextures = stagesInfo.map(stage => {
    let name = stage.name.toLowerCase().replace(/ /g, '_');
    let tex = textureLoader.load(`textures/${name}_floor.jpg`);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping; 
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 5); 
    return tex;
});

const startingFloorTextures = stagesInfo.map(stage => {
    let name = stage.name.toLowerCase().replace(/ /g, '_');
    let tex = textureLoader.load(`textures/${name}_floor.jpg`);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping; 
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 33); 
    return tex;
});

const materials = {
    stone: new THREE.MeshStandardMaterial({ color: 0xaaaaaa, map: stoneTexture, roughness: 0.65, metalness: 0.2 }),
    beachBall: new THREE.MeshPhysicalMaterial({ color: 0xaa0000, roughness: 0.3, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.1 })
};

// Texture Save Logic
texObj.closeBtn.addEventListener('click', () => {
    const stoneVal = document.getElementById('stone-tex-select').value;
    const beachVal = parseInt(document.getElementById('beach-col-select').value, 16);
    
    const newTex = textureLoader.load(stoneVal);
    newTex.colorSpace = THREE.SRGBColorSpace;
    materials.stone.map = newTex;
    materials.stone.needsUpdate = true;
    
    materials.beachBall.color.setHex(beachVal);
    materials.beachBall.needsUpdate = true;
    
    // Instantly update giant ball on menu
    giantBall.material.color.setHex(beachVal);
    giantBall.material.needsUpdate = true;
});

const groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: floorTextures[0], roughness: 0.9, metalness: 0.05 });
const startingGroundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: startingFloorTextures[0], roughness: 0.9, metalness: 0.05 });

const puddleShape = new THREE.Shape();
puddleShape.moveTo(0, 6.5);
puddleShape.bezierCurveTo(2.5, 5.0, 1.0, 2.5, 2.0, 0);
puddleShape.bezierCurveTo(3.0, -3.0, 1.5, -5.5, 0.5, -6.5);
puddleShape.bezierCurveTo(-2.0, -6.0, -1.5, -2.5, -2.0, 0);
puddleShape.bezierCurveTo(-2.5, 3.0, -3.0, 5.0, 0, 6.5);

const puddleGeo = new THREE.ShapeGeometry(puddleShape, 32);

// Splash Particle Setup
const splashParticles = [];
const splashGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);

const physicsMaterials = { ground: new CANNON.Material('ground'), ball: new CANNON.Material('ball'), obstacle: new CANNON.Material('obstacle') };
world.addContactMaterial(new CANNON.ContactMaterial(physicsMaterials.ground, physicsMaterials.ball, { friction: 0.0, restitution: 0.0 }));

// ==========================================
// 6. PROCEDURAL CHUNKS, GAPS & GATES
// ==========================================
const trackTiles = []; const obstacles = []; const puddles = []; const windmills = []; const debrisList = [];
const gates = []; 
const sceneryList = [];

function spawnGate(zPos) {
    let upcomingStageIdx = (trackStageIdx + 1) % stagesInfo.length;
    const nextStg = stagesInfo[upcomingStageIdx];
    
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, zPos);

    const frameMat = new THREE.MeshStandardMaterial({ color: nextStg.gateFrame, roughness: 0.5 }); 
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, map: createDoorTex(nextStg.emoji, nextStg.gateDoor) }); 
    const handleMat = new THREE.MeshStandardMaterial({ color: nextStg.gateHandle, metalness: 0.8, roughness: 0.2 }); 

    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(2, 15, 2), frameMat);
    leftPillar.position.set(-7, 7.5, 0); leftPillar.castShadow = true; gateGroup.add(leftPillar);
    
    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(2, 15, 2), frameMat);
    rightPillar.position.set(7, 7.5, 0); rightPillar.castShadow = true; gateGroup.add(rightPillar);

    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 2), frameMat);
    topBeam.position.set(0, 16, 0); topBeam.castShadow = true; gateGroup.add(topBeam);

    const leftPillarBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(new CANNON.Vec3(1, 7.5, 1)), position: new CANNON.Vec3(-7, 7.5, zPos) });
    world.addBody(leftPillarBody);
    const rightPillarBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(new CANNON.Vec3(1, 7.5, 1)), position: new CANNON.Vec3(7, 7.5, zPos) });
    world.addBody(rightPillarBody);

    const leftDoorPivot = new THREE.Group();
    leftDoorPivot.position.set(-6, 0, 0); 
    
    const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(6, 15, 0.5), doorMat);
    leftDoor.position.set(3, 7.5, 0); 
    leftDoor.castShadow = true;
    
    const leftHandle = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), handleMat);
    leftHandle.position.set(2.5, 0, 0.5); 
    leftDoor.add(leftHandle);
    
    leftDoorPivot.add(leftDoor);
    gateGroup.add(leftDoorPivot);

    const rightDoorPivot = new THREE.Group();
    rightDoorPivot.position.set(6, 0, 0); 

    const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(6, 15, 0.5), doorMat);
    rightDoor.position.set(-3, 7.5, 0); 
    rightDoor.castShadow = true;

    const rightHandle = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), handleMat);
    rightHandle.position.set(-2.5, 0, 0.5); 
    rightDoor.add(rightHandle);

    rightDoorPivot.add(rightDoor);
    gateGroup.add(rightDoorPivot);

    scene.add(gateGroup);
    
    gates.push({
        group: gateGroup,
        leftPivot: leftDoorPivot,
        rightPivot: rightDoorPivot,
        zPos: zPos,
        opened: false,
        passed: false,
        soundPlayed: false,
        leftPillarBody: leftPillarBody,
        rightPillarBody: rightPillarBody
    });
    
    trackStageIdx = upcomingStageIdx;
}

function spawnWindmill(zPos) {
    const windmillGroup = new THREE.Group();
    const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.5, 4, 8), new THREE.MeshStandardMaterial({ color: 0xaaaaaa }));
    baseMesh.position.y = 2; baseMesh.castShadow = true; windmillGroup.add(baseMesh);

    const rotorHub = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({color: 0x222222}));
    rotorHub.position.set(0, 1.5, 1); baseMesh.add(rotorHub); 

    const bladeGeo = new THREE.BoxGeometry(7, 0.5, 0.1); 
    const b1 = new THREE.Mesh(bladeGeo, new THREE.MeshStandardMaterial({color: 0xffffff}));
    const b2 = new THREE.Mesh(bladeGeo, new THREE.MeshStandardMaterial({color: 0xffffff}));
    b2.rotation.z = Math.PI / 2; b1.castShadow = true; b2.castShadow = true; rotorHub.add(b1); rotorHub.add(b2);

    windmillGroup.position.set(0, 0, zPos); scene.add(windmillGroup);

    const windmillBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Cylinder(1, 1.5, 4, 8), position: new CANNON.Vec3(0, 2, zPos) });
    const q = new CANNON.Quaternion(); q.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI/2); windmillBody.quaternion.copy(q);
    world.addBody(windmillBody); windmills.push({ group: windmillGroup, body: windmillBody, rotor: rotorHub });
}

function spawnStartingRunway() {
    const tMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 200), startingGroundMat);
    tMesh.position.set(0, -1, -50); tMesh.receiveShadow = true; scene.add(tMesh);
    const tBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(new CANNON.Vec3(6, 1, 100.1)), material: physicsMaterials.ground, position: new CANNON.Vec3(0, -1, -50) });
    world.addBody(tBody); trackTiles.push({ mesh: tMesh, body: tBody });
}

function spawnScenery(zPos, stageIdx) {
    const sides = [-9, 9];
    sides.forEach(xPos => {
        if(Math.random() < 0.4) return;
        let mesh;
        if(stageIdx === 0) { // Sky
            mesh = new THREE.Group();
            const cloudMat = new THREE.MeshStandardMaterial({color: 0xffffff, flatShading: true});
            const puffs = 3 + Math.floor(Math.random() * 3);
            for(let j=0; j<puffs; j++) {
                const p = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), cloudMat);
                p.position.set((Math.random()-0.5)*2, (Math.random()-0.5)*1+1, (Math.random()-0.5)*2);
                p.scale.set(1+Math.random()*0.5, 0.8+Math.random()*0.5, 1+Math.random()*0.5);
                mesh.add(p);
            }
            mesh.position.y = 1;
        } else if(stageIdx === 1) { // Neon
            let col = 0xff00ff; // pink
            let randC = Math.random();
            if(randC > 0.66) col = 0x00ffff; // cyan
            else if(randC > 0.33) col = 0xffff00; // yellow
            mesh = new THREE.Mesh(new THREE.BoxGeometry(2, Math.random()*8+4, 2), new THREE.MeshStandardMaterial({color: col, emissive: 0x111111}));
            mesh.position.y = mesh.geometry.parameters.height / 2;
        } else if(stageIdx === 2) { // Forest
            mesh = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2), new THREE.MeshStandardMaterial({color: 0x8b4513}));
            trunk.position.y = 1;
            const leaves = new THREE.Mesh(new THREE.ConeGeometry(2, 4), new THREE.MeshStandardMaterial({color: 0x228b22}));
            leaves.position.y = 4;
            mesh.add(trunk, leaves);
        } else if(stageIdx === 3) { // Snow
            mesh = new THREE.Group();
            const base = new THREE.Mesh(new THREE.SphereGeometry(1.5), new THREE.MeshStandardMaterial({color: 0xffffff}));
            base.position.y = 1.5;
            const top = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshStandardMaterial({color: 0xffffff}));
            top.position.y = 3.5;
            mesh.add(base, top);
        } else if(stageIdx === 4) { // Volcano
            mesh = new THREE.Group();
            const vMat = new THREE.MeshStandardMaterial({color: 0x333333, roughness: 0.9});
            const base = new THREE.Mesh(new THREE.ConeGeometry(2.5, 4, 8), vMat);
            base.position.y = 2;
            const lava = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), new THREE.MeshBasicMaterial({color: 0xff3300}));
            lava.position.y = 3.5;
            mesh.add(base, lava);
        } else if(stageIdx === 5) { // Desert
            mesh = new THREE.Group();
            const main = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4), new THREE.MeshStandardMaterial({color: 0x2e8b57}));
            main.position.y = 2;
            const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2), new THREE.MeshStandardMaterial({color: 0x2e8b57}));
            arm.rotation.z = Math.PI/2;
            arm.position.set(0.8, 2, 0);
            mesh.add(main, arm);
        }
        if(mesh) {
            mesh.position.set(xPos + (Math.random()-0.5)*3, 0, zPos + (Math.random()-0.5)*10);
            scene.add(mesh);
            sceneryList.push(mesh);
        }
    });
}

function spawnNextChunk() {
    const gapChance = Math.min(0.25, 0.15 + (distanceTraveled / 10000));
    
    let allowGap = activePowerUp !== 'flying';
    if (nextSpawnZ < -150 && Math.random() < gapChance && !wasGap && Math.abs(nextSpawnZ) % 300 !== 0 && nextSpawnZ > nextGateZ && allowGap) {
        wasGap = true; nextSpawnZ -= 30; return; 
    }
    wasGap = false;

    const tMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 30), groundMat);
    tMesh.position.set(0, -1, nextSpawnZ); tMesh.receiveShadow = true; scene.add(tMesh);
    const tBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(new CANNON.Vec3(6, 1, 15.1)), material: physicsMaterials.ground, position: new CANNON.Vec3(0, -1, nextSpawnZ) });
    world.addBody(tBody); trackTiles.push({ mesh: tMesh, body: tBody });

    if (nextSpawnZ <= nextGateZ) {
        spawnGate(nextSpawnZ);
        nextGateZ -= 1000;
        
        spawnScenery(nextSpawnZ, trackStageIdx);
        
        nextSpawnZ -= 30;
        return; 
    }

    if (Math.abs(nextSpawnZ) % 300 === 0) { 
        spawnWindmill(nextSpawnZ); 
        spawnScenery(nextSpawnZ, trackStageIdx);
        nextSpawnZ -= 30; 
        return; 
    }

    const rand = Math.random();
    
    if (gatesPassed >= 1 && rand < 0.2) {
        const isFlying = Math.random() < 0.5;
        const puMesh = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), isFlying ? purplePuMat : greenPuMat);
        const puLane = Math.floor(Math.random() * 3) - 1; 
        const px = puLane * 3;
        puMesh.position.set(px, 1.0, nextSpawnZ);
        puMesh.castShadow = true;
        scene.add(puMesh);
        powerups.push({ mesh: puMesh, type: isFlying ? 'flying' : 'invincible', z: nextSpawnZ, x: px, y: 1.0 });
    } 
    else if (rand < 0.45) { // Spawn pin
        const laneIndex = Math.floor(Math.random() * 3) - 1; 
        const xPos = laneIndex * 3;
        const pinMesh = new THREE.Mesh(pinGeo, stageMats[trackStageIdx].pin); pinMesh.position.set(xPos, 1, nextSpawnZ); pinMesh.castShadow = true; scene.add(pinMesh);
        
        // Changed Pin to KINEMATIC sensor to allow smooth pass-through while firing collisions
        const pinBody = new CANNON.Body({ type: CANNON.Body.KINEMATIC, material: physicsMaterials.obstacle });
        pinBody.collisionResponse = false; 
        
        const qY = new CANNON.Quaternion(); qY.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        pinBody.addShape(pinShape, new CANNON.Vec3(0, 0, 0), qY);
        pinBody.position.set(xPos, 1.0, nextSpawnZ); pinBody.isPin = true; world.addBody(pinBody);
        obstacles.push({ mesh: pinMesh, body: pinBody, stageIdx: trackStageIdx });
    } else { // Spawn Puddle
        const laneIndex = Math.floor(Math.random() * 3) - 1; 
        const xPos = laneIndex * 3;
        const puddleGroup = new THREE.Group();
        puddleGroup.position.set(xPos, 0.02, nextSpawnZ);

        const puddleMirror = new Reflector(puddleGeo, {
            clipBias: 0.003,
            textureWidth: 512, 
            textureHeight: 512,
            color: stagesInfo[trackStageIdx].puddleCol
        });
        puddleMirror.rotation.x = -Math.PI / 2;
        puddleGroup.add(puddleMirror);

        const puddleSurface = new THREE.Mesh(puddleGeo, stageMats[trackStageIdx].puddle);
        puddleSurface.rotation.x = -Math.PI / 2;
        puddleSurface.position.y = 0.01; 
        puddleSurface.receiveShadow = true;
        puddleGroup.add(puddleSurface);

        scene.add(puddleGroup);
        puddles.push({ group: puddleGroup, mirror: puddleMirror, x: xPos, z: nextSpawnZ, stageIdx: trackStageIdx });
    }
    
    spawnScenery(nextSpawnZ, trackStageIdx);
    
    nextSpawnZ -= 30;
}

// --- Power-Up Textures & Setup ---
function createPuTex(emoji, bgColorStr) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bgColorStr;
    ctx.fillRect(0,0,256,256);
    ctx.fillStyle = 'white';
    ctx.font = '120px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 128, 140);
    return new THREE.CanvasTexture(c);
}

const greenPuMat = new THREE.MeshStandardMaterial({ map: createPuTex('💪', '#00ff00'), roughness: 0.4 });
const purplePuMat = new THREE.MeshStandardMaterial({ map: createPuTex('🪽', '#aa00ff'), roughness: 0.4 });

const playerRadius = 1;

// --- Outer Glow Aura Mesh ---
const auraGeo = new THREE.SphereGeometry(playerRadius * 1.3, 32, 32);
const auraMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
const auraMesh = new THREE.Mesh(auraGeo, auraMat);
scene.add(auraMesh);
auraMesh.visible = false;

// --- Complex Animated Wings Object ---
const wingsGroup = new THREE.Group();
const wingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });

// Left Wing
const leftShoulder = new THREE.Group();
leftShoulder.position.set(-0.8, 0, 0); 
const leftUpperArm = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.6), wingMat);
leftUpperArm.position.set(-1, 0, 0); 
leftUpperArm.castShadow = true;
leftShoulder.add(leftUpperArm);

const leftElbow = new THREE.Group();
leftElbow.position.set(-2, 0, 0); 
const leftLowerArm = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.05, 0.8), wingMat);
leftLowerArm.position.set(-1.25, 0, 0);
leftLowerArm.castShadow = true;
leftElbow.add(leftLowerArm);

const leftWrist = new THREE.Group();
leftWrist.position.set(-2.5, 0, 0); 
const leftHandMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 0.03, 0.6), wingMat);
leftHandMesh.position.set(-1, 0, 0);
leftHandMesh.castShadow = true;
leftWrist.add(leftHandMesh);
leftElbow.add(leftWrist);

for(let i=0; i<3; i++) {
    let feather = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 1.5), wingMat);
    feather.position.set(-0.5 - i*0.5, -0.1, -0.5);
    feather.rotation.y = -0.2;
    leftLowerArm.add(feather.clone());
    leftUpperArm.add(feather.clone());
    leftHandMesh.add(feather.clone());
}
leftShoulder.add(leftElbow);
wingsGroup.add(leftShoulder);

// Right Wing
const rightShoulder = new THREE.Group();
rightShoulder.position.set(0.8, 0, 0); 
const rightUpperArm = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.6), wingMat);
rightUpperArm.position.set(1, 0, 0);
rightUpperArm.castShadow = true;
rightShoulder.add(rightUpperArm);

const rightElbow = new THREE.Group();
rightElbow.position.set(2, 0, 0);
const rightLowerArm = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.05, 0.8), wingMat);
rightLowerArm.position.set(1.25, 0, 0);
rightLowerArm.castShadow = true;
rightElbow.add(rightLowerArm);

const rightWrist = new THREE.Group();
rightWrist.position.set(2.5, 0, 0); 
const rightHandMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 0.03, 0.6), wingMat);
rightHandMesh.position.set(1, 0, 0);
rightHandMesh.castShadow = true;
rightWrist.add(rightHandMesh);
rightElbow.add(rightWrist);

for(let i=0; i<3; i++) {
    let feather = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 1.5), wingMat);
    feather.position.set(0.5 + i*0.5, -0.1, -0.5);
    feather.rotation.y = 0.2;
    rightLowerArm.add(feather.clone());
    rightUpperArm.add(feather.clone());
    rightHandMesh.add(feather.clone());
}
rightShoulder.add(rightElbow);
wingsGroup.add(rightShoulder);

scene.add(wingsGroup);
wingsGroup.visible = false;

// --- Complex Tiny Person Fairy Setup ---
const fairyGroup = new THREE.Group();
const fMat = new THREE.MeshStandardMaterial({ color: 0xccffcc, emissive: 0x22ff22, emissiveIntensity: 0.8 });

const fHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), fMat);
fHead.position.set(0, 0.6, 0);
fairyGroup.add(fHead);

const fBody = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.25, 0.6, 8), fMat);
fBody.position.set(0, 0.2, 0);
fairyGroup.add(fBody);

const fLArmBase = new THREE.Group();
fLArmBase.position.set(-0.15, 0.4, 0);
const fLArmUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2), fMat);
fLArmUpper.position.set(-0.1, -0.1, 0);
fLArmUpper.rotation.z = -0.5;
fLArmBase.add(fLArmUpper);
const fLElbow = new THREE.Group();
fLElbow.position.set(-0.2, -0.2, 0);
const fLArmLower = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2), fMat);
fLArmLower.position.set(0, -0.1, 0);
fLElbow.add(fLArmLower);
fLArmBase.add(fLElbow);
fairyGroup.add(fLArmBase);

const fRArmBase = new THREE.Group();
fRArmBase.position.set(0.15, 0.4, 0);
const fRArmUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2), fMat);
fRArmUpper.position.set(0.1, -0.1, 0);
fRArmUpper.rotation.z = 0.5;
fRArmBase.add(fRArmUpper);
const fRElbow = new THREE.Group();
fRElbow.position.set(0.2, -0.2, 0);
const fRArmLower = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2), fMat);
fRArmLower.position.set(0, -0.1, 0);
fRElbow.add(fRArmLower);
fRArmBase.add(fRElbow);
fairyGroup.add(fRArmBase);

const legGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
const fLLeg = new THREE.Mesh(legGeo, fMat);
fLLeg.position.set(-0.1, -0.2, 0);
fairyGroup.add(fLLeg);

const fRLeg = new THREE.Mesh(legGeo, fMat);
fRLeg.position.set(0.1, -0.2, 0);
fairyGroup.add(fRLeg);

const fWingGeo = new THREE.ConeGeometry(0.2, 0.6, 3);
const fWingMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
const fLWing = new THREE.Mesh(fWingGeo, fWingMat);
fLWing.position.set(-0.2, 0.4, -0.2);
fLWing.rotation.x = -Math.PI / 4;
fLWing.rotation.z = -Math.PI / 4;
fairyGroup.add(fLWing);

const fRWing = new THREE.Mesh(fWingGeo, fWingMat);
fRWing.position.set(0.2, 0.4, -0.2);
fRWing.rotation.x = -Math.PI / 4;
fRWing.rotation.z = Math.PI / 4;
fairyGroup.add(fRWing);

const fairyOrbit = new THREE.Group();
fairyGroup.position.set(2.5, 0, 0); 
fairyOrbit.add(fairyGroup);
scene.add(fairyOrbit);
fairyOrbit.visible = false;


// ==========================================
// 4. MENU BACKGROUND
// ==========================================
const menuScene = new THREE.Group();
const giantBall = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 32), materials.beachBall);
giantBall.position.set(0, 3, 0); giantBall.castShadow = true; menuScene.add(giantBall);

const pinPoints = [new THREE.Vector2(0, 0), new THREE.Vector2(0.4, 0.2), new THREE.Vector2(0.4, 0.8), new THREE.Vector2(0.15, 1.5), new THREE.Vector2(0.25, 1.8), new THREE.Vector2(0, 2.0)];
const pinGeo = new THREE.LatheGeometry(pinPoints, 16); pinGeo.translate(0, -1, 0); 
const pinMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
const pinShape = new CANNON.Cylinder(0.4, 0.4, 2.0, 8);

const giantPin1 = new THREE.Mesh(pinGeo, pinMat); giantPin1.scale.set(2, 2, 2); giantPin1.position.set(-4, 2, -2); giantPin1.castShadow = true; menuScene.add(giantPin1);
const giantPin2 = new THREE.Mesh(pinGeo, pinMat); giantPin2.scale.set(2, 2, 2); giantPin2.position.set(4, 2, -2); giantPin2.castShadow = true; menuScene.add(giantPin2);
menuScene.position.set(0, 0, -15); scene.add(menuScene);

// ==========================================
// 5. THE PLAYER (BALL)
// ==========================================
let currentLane = 0; 
let baseSpeed = -22; 
let forwardSpeed = -22; 

const playerMesh = new THREE.Mesh(new THREE.SphereGeometry(playerRadius, 32, 32), materials.stone);
playerMesh.castShadow = true; playerMesh.visible = false; 
scene.add(playerMesh);

const playerBody = new CANNON.Body({ mass: 25, shape: new CANNON.Sphere(playerRadius), position: new CANNON.Vec3(0, 5, 0), material: physicsMaterials.ball });
playerBody.linearDamping = 0; playerBody.angularDamping = 0; 
playerBody.collisionFilterGroup = 4; // Restricting player collision
playerBody.collisionFilterMask = 1;  // Only collide with the Ground & Pins
world.addBody(playerBody);

playerBody.addEventListener('collide', (e) => {
    if (gameState !== 'PLAYING') return;
    if (e.body.isPin) {
        if (currentForm === 'stone' || activePowerUp === 'invincible' || activePowerUp === 'flying') {
            e.body.needsShatter = true;
            
            playTone(250 + Math.random()*50, 'triangle', 0.15, 0.4); 
            setTimeout(() => playTone(150 + Math.random()*50, 'square', 0.15, 0.2), 30);
        } else {
            if (gameState !== 'GAMEOVER') {
                gameState = 'GAMEOVER'; 
                showGameOverText();
                playerBody.velocity.set(0, 10, 15); 
                UI_Status.innerHTML = "CRASH! Only the Stone ball smashes pins."; UI_Status.style.color = "#ff3333"; scoreHud.style.color = "#ff3333";
            }
        }
    }
});

function activatePowerUp(type) {
    activePowerUp = type;
    
    if (type === 'invincible') {
        powerUpTimer = 10.0;
        document.getElementById('timer-circle').style.stroke = '#00ff00';
        document.getElementById('timer-text').style.color = '#00ff00';
        document.getElementById('timer-text').style.textShadow = '0px 0px 10px rgba(0,255,0,0.8)';
    } else if (type === 'flying') {
        powerUpTimer = 8.0;
        document.getElementById('timer-circle').style.stroke = '#aa00ff';
        document.getElementById('timer-text').style.color = '#aa00ff';
        document.getElementById('timer-text').style.textShadow = '0px 0px 10px rgba(170,0,255,0.8)';
    }
    
    playTone(440, 'square', 0.1, 0.4);
    setTimeout(() => playTone(554, 'square', 0.1, 0.4), 100);
    setTimeout(() => playTone(659, 'square', 0.1, 0.4), 200);
    setTimeout(() => playTone(880, 'square', 0.2, 0.6), 300);
    
    if (type === 'invincible') {
        wingsGroup.visible = false;
        auraMesh.material.color.setHex(0x00ff00);
        auraMesh.visible = true;
        fairyOrbit.visible = true;
    } else if (type === 'flying') {
        let checkZ = Math.floor(playerBody.position.z / 30) * 30;
        while (checkZ > nextSpawnZ) {
            let hasFloor = trackTiles.some(t => Math.abs(t.mesh.position.z - checkZ) < 5);
            if (!hasFloor) {
                const tMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 30), groundMat);
                tMesh.position.set(0, -1, checkZ); tMesh.receiveShadow = true; scene.add(tMesh);
                const tBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(new CANNON.Vec3(6, 1, 15.1)), material: physicsMaterials.ground, position: new CANNON.Vec3(0, -1, checkZ) });
                world.addBody(tBody); trackTiles.push({ mesh: tMesh, body: tBody });
            }
            checkZ -= 30;
        }

        auraMesh.material.color.setHex(0xaa00ff);
        auraMesh.visible = true;
        wingsGroup.visible = true;
        fairyOrbit.visible = false; 
        playerBody.velocity.y = 12; // take off
    }
}

let isTransitioning = false;
function triggerPlayAnimation() {
    if (isTransitioning) return;
    isTransitioning = true;
    
    // Grab name
    playerName = playerNameInput.value.trim() || 'Player';
    
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    for(let i = 0; i < 20; i++) {
        const pMesh = new THREE.Mesh(pinGeo, stageMats[0].pin); 
        pMesh.castShadow = true; pMesh.receiveShadow = true; 
        scene.add(pMesh);
        
        const pBody = new CANNON.Body({ mass: 1, material: physicsMaterials.obstacle });
        pBody.collisionFilterGroup = 8; // Debris specific physics group
        pBody.collisionFilterMask = 1;  // Only collides with the floor
        
        const qY = new CANNON.Quaternion(); 
        qY.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        pBody.addShape(pinShape, new CANNON.Vec3(0, 0, 0), qY);
        
        pBody.position.set((Math.random() - 0.5) * 20, 5 + Math.random() * 10, -30 - Math.random() * 10);
        
        pBody.velocity.set((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20 + 10, 40 + Math.random() * 30);
        pBody.angularVelocity.set(Math.random() * 10, Math.random() * 10, Math.random() * 10);
        
        world.addBody(pBody); 
        debrisList.push({ mesh: pMesh, body: pBody, spawnTime: gameElapsedTime }); 
    }

    if (playBtn) {
        playBtn.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        playBtn.style.transform = 'scale(1.5, 0.1)';
        playBtn.style.opacity = '0';
    }
    if (howToPlayBtn) {
        howToPlayBtn.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        howToPlayBtn.style.transform = 'scale(1.5, 0.1)';
        howToPlayBtn.style.opacity = '0';
    }
    if (texturesBtn) {
        texturesBtn.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        texturesBtn.style.transform = 'scale(1.5, 0.1)';
        texturesBtn.style.opacity = '0';
    }
    if (settingsBtn) {
        settingsBtn.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        settingsBtn.style.transform = 'scale(1.5, 0.1)';
        settingsBtn.style.opacity = '0';
    }
    if (startHintText) {
        startHintText.style.transition = 'opacity 0.3s ease';
        startHintText.style.opacity = '0';
    }
    if (playerNameInput) {
        playerNameInput.style.transition = 'opacity 0.3s ease';
        playerNameInput.style.opacity = '0';
    }
    
    setTimeout(() => {
        if (playBtn) {
            playBtn.style.transition = 'none';
            playBtn.style.transform = 'scale(1)';
            playBtn.style.opacity = '1';
        }
        if (howToPlayBtn) {
            howToPlayBtn.style.transition = 'transform 0.15s ease-out';
            howToPlayBtn.style.transform = 'scale(1)';
            howToPlayBtn.style.opacity = '1';
        }
        if (texturesBtn) {
            texturesBtn.style.transition = 'transform 0.15s ease-out';
            texturesBtn.style.transform = 'scale(1)';
            texturesBtn.style.opacity = '1';
        }
        if (settingsBtn) {
            settingsBtn.style.transition = 'transform 0.15s ease-out';
            settingsBtn.style.transform = 'scale(1)';
            settingsBtn.style.opacity = '1';
        }
        if (startHintText) {
            startHintText.style.transition = 'none';
            startHintText.style.opacity = '0.8';
        }
        if (playerNameInput) {
            playerNameInput.style.transition = 'none';
            playerNameInput.style.opacity = '1';
        }
        resetGame();
        isTransitioning = false;
    }, 1200);
}

function resetGame() {
    hideGameOverText();
    creditLeft.style.display = 'none';
    creditRight.style.display = 'none';
    rulesObj.modal.style.transform = 'translate(-50%, -50%) scale(0)';
    texObj.modal.style.transform = 'translate(-50%, -50%) scale(0)';
    setObj.modal.style.transform = 'translate(-50%, -50%) scale(0)';
    pauseOverlay.style.display = 'none';
    isModalOpen = false;
    sinkTarget = null;
    
    currentScore = 0;
    hasReachedNewHighScore = false;
    activePowerUp = null;
    powerUpTimer = 0;
    
    materials.stone.emissive.setHex(0x000000);
    materials.beachBall.emissive.setHex(0x000000);
    
    auraMesh.visible = false;
    wingsGroup.visible = false;
    fairyOrbit.visible = false; 
    
    trackTiles.forEach(t => { scene.remove(t.mesh); world.removeBody(t.body); }); trackTiles.length = 0;
    obstacles.forEach(o => { scene.remove(o.mesh); world.removeBody(o.body); }); obstacles.length = 0;
    puddles.forEach(p => { scene.remove(p.group); p.mirror.dispose(); }); puddles.length = 0;
    windmills.forEach(w => { scene.remove(w.group); world.removeBody(w.body); }); windmills.length = 0;
    debrisList.forEach(d => { scene.remove(d.mesh); world.removeBody(d.body); }); debrisList.length = 0;
    splashParticles.forEach(sp => { scene.remove(sp.mesh); }); splashParticles.length = 0;
    windParticles.forEach(wp => { scene.remove(wp.mesh); }); windParticles.length = 0;
    powerups.forEach(pu => { scene.remove(pu.mesh); }); powerups.length = 0;
    sceneryList.forEach(sc => scene.remove(sc)); sceneryList.length = 0;
    
    gates.forEach(g => { scene.remove(g.group); world.removeBody(g.leftPillarBody); world.removeBody(g.rightPillarBody); }); gates.length = 0;
    
    floorParticles.forEach(fp => scene.remove(fp.mesh)); floorParticles.length = 0;

    currentStageIdx = 0;
    trackStageIdx = 0;
    transitionProgress = 1.0;
    
    dayColor.setHex(stagesInfo[0].bgDay);
    nightColor.setHex(stagesInfo[0].bgNight);
    
    groundMat.map = floorTextures[0];
    startingGroundMat.map = startingFloorTextures[0];
    groundMat.needsUpdate = true;
    startingGroundMat.needsUpdate = true;
    
    groundMat.color.setHex(stagesInfo[0].floorCol);
    groundMat.roughness = stagesInfo[0].floorRough;
    startingGroundMat.color.setHex(stagesInfo[0].floorCol);
    startingGroundMat.roughness = stagesInfo[0].floorRough;
    scene.fog.near = 100;
    scene.fog.far = 500;

    spawnStartingRunway();
    currentLane = 0; nextSpawnZ = -165; nextGateZ = -1000;
    survivalTime = 0; pinsSmashed = 0; distanceTraveled = 0; gameOverTimer = 0; isSinking = false; gatesPassed = 0;
    
    currentForm = 'beachBall'; playerMesh.material = materials.beachBall; playerMesh.scale.set(1,1,1);
    
    materials.stone.transparent = false;
    materials.stone.opacity = 1.0;
    materials.beachBall.transparent = false;
    materials.beachBall.opacity = 1.0;
    
    baseSpeed = -35; forwardSpeed = -35;
    playerBody.mass = 1.5; playerBody.updateMassProperties(); 
    
    playerBody.type = CANNON.Body.DYNAMIC;
    playerBody.collisionFilterGroup = 4;
    playerBody.collisionFilterMask = 1;
    playerBody.position.set(0, 5, 0); playerBody.velocity.set(0,0,0); playerBody.angularVelocity.set(0,0,0);
    
    isPaused = false;
    
    UI_Status.innerText = "Current Form: Beach Ball (Floaty)"; UI_Status.style.color = "#33ccff"; scoreHud.style.color = "#fff";
    uiHUD.style.display = 'block'; scoreHud.style.display = 'block'; mainMenu.style.display = 'none';
    menuScene.visible = false; playerMesh.visible = true; gameState = 'PLAYING';
}

if (playBtn) {
    playBtn.addEventListener('click', triggerPlayAnimation);
}

spawnStartingRunway(); 

// ==========================================
// 7. USER INTERACTION
// ==========================================

window.addEventListener('mousedown', (e) => {
    if (e.target.tagName.toLowerCase() === 'button') return;
    if (e.target.tagName.toLowerCase() === 'input') return;
    if (e.target.closest('#pause-overlay')) return;
    
    if (gameState === 'PLAYING') {
        togglePause();
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === '9') {
        togglePause();
    }
    
    if (gameState === 'MENU' && (e.key === ' ' || e.key === 'Enter')) {
        if (isModalOpen || document.activeElement === playerNameInput) return;
        triggerPlayAnimation();
        return;
    }

    if (gameState !== 'PLAYING') return; 
    if (isPaused) return; 

    if (e.key === 'a' || e.key === 'ArrowLeft') currentLane--;
    if (e.key === 'd' || e.key === 'ArrowRight') currentLane++;
    
    const isGrounded = playerBody.position.y > -0.5 && playerBody.position.y < 2 && Math.abs(playerBody.velocity.y) < 2;
    if ((e.key === 'w' || e.key === ' ' || e.key === 'ArrowUp') && isGrounded && !isSinking && activePowerUp !== 'flying') {
        if (currentForm === 'stone') playerBody.velocity.y = 10;    
        if (currentForm === 'beachBall') playerBody.velocity.y = 25; 
    }

    if (e.key === '2') {
        if (currentForm === 'stone') {
            currentForm = 'beachBall'; 
            playerMesh.material = materials.beachBall; 
            playerBody.mass = 1.5; 
            playerBody.updateMassProperties(); 
            if (isGrounded) {
                playerBody.position.y = 1.0;
                playerBody.velocity.y = 0;
            }
            baseSpeed = -35; 
            UI_Status.innerText = "Current Form: Beach Ball (Floaty)"; 
            UI_Status.style.color = "#33ccff"; 
            
        } else {
            currentForm = 'stone'; 
            playerMesh.material = materials.stone; 
            playerBody.mass = 25; 
            playerBody.updateMassProperties(); 
            if (isGrounded) {
                playerBody.position.y = 1.0;
                playerBody.velocity.y = 0;
            }
            baseSpeed = -22; 
            UI_Status.innerText = "Current Form: Stone (Heavy)"; 
            UI_Status.style.color = "#aaaaaa"; 
            
        }
    }
});

// ==========================================
// 8. GAME LOOP
// ==========================================
const clock = new THREE.Clock();
const cycleSpeed = 0.3; 

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    
    if (isPaused) {
        renderer.render(scene, camera);
        return;
    }
    
    gameElapsedTime += delta;
    world.step(1/60, delta, 3);

    if (gameState === 'PLAYING') {
        survivalTime += delta;
        distanceTraveled = Math.floor(Math.max(0, -playerBody.position.z));
        
        const speedMultiplier = Math.min(2.0, 1.0 + (distanceTraveled / 3000));
        forwardSpeed = baseSpeed * speedMultiplier;
        
        currentScore = (survivalTime * 10) + distanceTraveled + (pinsSmashed * 50);
        
        if (highScore.score > 0 && currentScore > highScore.score && !hasReachedNewHighScore) {
            hasReachedNewHighScore = true;
            showNewHighScoreText();
        }

        // Process Stage Transition Logic
        if (transitionProgress < 1.0) {
            transitionProgress += delta * 0.5; // 2 sec transition
            if (transitionProgress >= 1.0) {
                transitionProgress = 1.0;
                scene.fog.near = 100;
                scene.fog.far = 500;
                
                groundMat.map = floorTextures[currentStageIdx];
                groundMat.needsUpdate = true;
            } else {
                const fogBump = Math.sin(transitionProgress * Math.PI);
                // Adjust fog near/far to tightly mask horizon without hiding player floor
                scene.fog.near = THREE.MathUtils.lerp(100, 20, fogBump);
                scene.fog.far = THREE.MathUtils.lerp(500, 80, fogBump);
                
                // Swap the texture exactly halfway through the fade
                if (transitionProgress > 0.5 && groundMat.map !== floorTextures[currentStageIdx]) {
                    groundMat.map = floorTextures[currentStageIdx];
                    groundMat.needsUpdate = true;
                }
            }
            
            const sOld = stagesInfo[oldStageIdx];
            const sNew = stagesInfo[currentStageIdx];
            
            const cDay = new THREE.Color(sOld.bgDay).lerp(new THREE.Color(sNew.bgDay), transitionProgress);
            dayColor.copy(cDay);
            
            const cNight = new THREE.Color(sOld.bgNight).lerp(new THREE.Color(sNew.bgNight), transitionProgress);
            nightColor.copy(cNight);
            
            const cFloor = new THREE.Color(sOld.floorCol).lerp(new THREE.Color(sNew.floorCol), transitionProgress);
            groundMat.color.copy(cFloor);
            groundMat.roughness = THREE.MathUtils.lerp(sOld.floorRough, sNew.floorRough, transitionProgress);
        }
        
        // Floor Particles Trailing Logic
        const sCur = stagesInfo[currentStageIdx];
        const isGrounded = playerBody.position.y > -0.5 && playerBody.position.y < 2 && Math.abs(playerBody.velocity.y) < 2;
        
        if (sCur.trail && isGrounded && !isSinking && activePowerUp !== 'flying') {
            if (Math.random() < 0.4) {
                const fpMat = new THREE.MeshBasicMaterial({ color: sCur.trailCol, transparent: true, opacity: 0.8 });
                const fp = new THREE.Mesh(fpGeo, fpMat);
                fp.position.set(playerBody.position.x + (Math.random()-0.5)*0.5, 0.2, playerBody.position.z + 1.0);
                scene.add(fp);
                floorParticles.push({ mesh: fp, age: 0 });
            }
        }
        
        // Update Floor Particles
        for (let i = floorParticles.length - 1; i >= 0; i--) {
            let fp = floorParticles[i];
            fp.age += delta;
            fp.mesh.position.y += 2 * delta;
            let s = Math.max(0, 1.0 - (fp.age / 0.5));
            fp.mesh.scale.set(s, s, s);
            if (fp.age > 0.5) {
                scene.remove(fp.mesh);
                floorParticles.splice(i, 1);
            }
        }
        
        // Update powerups logic
        if (activePowerUp) {
            powerUpTimer -= delta;
            
            // UI Timer updates
            timerUI.style.display = 'flex';
            const maxTime = activePowerUp === 'invincible' ? 10.0 : 8.0;
            const pct = Math.max(0, powerUpTimer / maxTime);
            document.getElementById('timer-circle').style.strokeDashoffset = 157 - (157 * pct);
            document.getElementById('timer-text').innerText = Math.ceil(powerUpTimer);
            
            if (powerUpTimer <= 0) {
                if (activePowerUp === 'invincible') {
                    auraMesh.visible = false;
                    fairyOrbit.visible = false;
                } else if (activePowerUp === 'flying') {
                    auraMesh.visible = false;
                    wingsGroup.visible = false;
                }
                activePowerUp = null;
                playTone(300, 'sine', 0.2, 0.3); // deactivate sound
            } else {
                auraMesh.position.copy(playerBody.position);
                
                if (activePowerUp === 'invincible') {
                    fairyOrbit.visible = true;
                    fairyOrbit.position.copy(playerMesh.position);
                    fairyOrbit.rotation.y = gameElapsedTime * 2; // slow orbit
                    fairyGroup.position.y = Math.sin(gameElapsedTime * 3) * 0.4; 
                    
                    // Complex Fairy Animation
                    fLArmBase.rotation.x = Math.sin(gameElapsedTime * 5) * 0.5;
                    fLElbow.rotation.x = Math.sin(gameElapsedTime * 5 - 1) * 0.5;
                    fRArmBase.rotation.x = Math.sin(gameElapsedTime * 5 + Math.PI) * 0.5;
                    fRElbow.rotation.x = Math.sin(gameElapsedTime * 5 + Math.PI - 1) * 0.5;
                }
                if (activePowerUp === 'flying') {
                    playerBody.position.y = THREE.MathUtils.lerp(playerBody.position.y, 8, 4 * delta);
                    playerBody.velocity.y = 0;
                    
                    wingsGroup.position.copy(playerBody.position);
                    const t = gameElapsedTime * 12;
                    // CHANGED: 3 segment wing animation
                    leftShoulder.rotation.z = Math.sin(t) * 0.5 + 0.2;
                    leftElbow.rotation.z = Math.sin(t - 0.5) * 0.5 + 0.1;
                    leftWrist.rotation.z = Math.sin(t - 1.0) * 0.5 + 0.1;
                    
                    rightShoulder.rotation.z = -Math.sin(t) * 0.5 - 0.2;
                    rightElbow.rotation.z = -Math.sin(t - 0.5) * 0.5 - 0.1;
                    rightWrist.rotation.z = -Math.sin(t - 1.0) * 0.5 - 0.1;

                    // Wind Particles logic
                    if (Math.random() < 0.6) {
                        let wp = new THREE.Mesh(windGeo, windMat); 
                        wp.position.set(playerBody.position.x + (Math.random()-0.5)*4, playerBody.position.y + (Math.random()-0.5)*2, playerBody.position.z + 1.5);
                        scene.add(wp);
                        windParticles.push({mesh: wp, age: 0});
                    }
                }
            }
        } else {
            timerUI.style.display = 'none';
            auraMesh.visible = false;
            fairyOrbit.visible = false;
        }

        // Process active powerup items in scene
        for (let i = powerups.length - 1; i >= 0; i--) {
            let pu = powerups[i];
            pu.mesh.rotation.y += 2 * delta;
            pu.mesh.position.y = 1 + Math.sin(gameElapsedTime * 5 + pu.x) * 0.3;
            
            if (pu.z > playerMesh.position.z + 20) {
                scene.remove(pu.mesh);
                powerups.splice(i, 1);
            } else if (Math.abs(playerBody.position.z - pu.z) < 2.0 && Math.abs(playerBody.position.x - pu.x) < 2.0 && playerBody.position.y < 3.0) {
                activatePowerUp(pu.type);
                scene.remove(pu.mesh);
                powerups.splice(i, 1);
            }
        }
        
        let speedText = speedMultiplier > 1.1 ? `<br><span style="color:#808080">x${speedMultiplier.toFixed(1)} SPEED!</span>` : "";
        scoreHud.innerHTML = `High Score: <span style="color:#00ccff">${Math.floor(highScore.score)}</span><br>Player: <span style="color:#ffeb3b">${playerName}</span><br>Score: <span style="color:#00ccff">${Math.floor(currentScore)}</span><br>Time: <span style="color:#00e676">${survivalTime.toFixed(1)}s</span><br>Dist: <span style="color:#00e676">${distanceTraveled}m</span><br>Pins: <span style="color:#ffcc00">${pinsSmashed}</span>${speedText}`;
    }

    // ------------------------------------------
    // DAY / NIGHT CYCLE 
    // ------------------------------------------
    const theta = gameElapsedTime * cycleSpeed; 
    const skyRadius = 150;
    const skyCenterZ = gameState === 'MENU' ? 0 : playerMesh.position.z;

    sunMesh.position.set(Math.cos(theta) * skyRadius, Math.sin(theta) * skyRadius, skyCenterZ - 200); 
    moonMesh.position.set(Math.cos(theta + Math.PI) * skyRadius, Math.sin(theta + Math.PI) * skyRadius, skyCenterZ - 200);
    
    sunMesh.material.transparent = true;
    moonMesh.material.transparent = true;
    sunMesh.material.opacity = Math.max(0, Math.min(1, Math.sin(theta) * 5));
    moonMesh.material.opacity = Math.max(0, Math.min(1, Math.sin(theta + Math.PI) * 5));

    starsPoints.position.z = skyCenterZ;
    
    cloudsGroup.position.z = skyCenterZ;
    cloudsGroup.rotation.y += 0.05 * delta;

    const dayFactor = Math.max(0, Math.min(1, Math.sin(theta) * 2 + 0.5));

    const tgtPos = gameState === 'MENU' ? menuScene.position : playerMesh.position;
    const tgtObj = gameState === 'MENU' ? giantBall : playerMesh;

    dirLight.intensity = Math.max(0, Math.sin(theta)) * 1.5; 
    dirLight.position.copy(tgtPos).add(new THREE.Vector3().copy(sunMesh.position).sub(tgtPos).normalize().multiplyScalar(60)); 
    dirLight.target = tgtObj;

    moonLight.intensity = Math.max(0, Math.sin(theta + Math.PI)) * 0.2;
    moonLight.position.copy(tgtPos).add(new THREE.Vector3().copy(moonMesh.position).sub(tgtPos).normalize().multiplyScalar(60));
    moonLight.target = tgtObj;

    ambientLight.intensity = 0.4 + dayFactor * 0.4; 

    scene.background.copy(nightColor).lerp(dayColor, dayFactor); 
    scene.fog.color.copy(scene.background); 
    
    starsMat.opacity = 1.0 - dayFactor; 
    cloudMat.opacity = dayFactor * 0.9;

    // ------------------------------------------
    // STATE MACHINE
    // ------------------------------------------
    if (gameState === 'MENU') {
        giantBall.rotation.x += 1.5 * delta; giantBall.rotation.y += 0.5 * delta;
        if (giantPin1.visible) {
            giantPin1.rotation.y -= 1 * delta; giantPin2.rotation.y += 1 * delta;
        }
        camera.position.set(0, 5, 5); camera.lookAt(menuScene.position);
        
        if (isTransitioning) {
            for (let i = debrisList.length - 1; i >= 0; i--) {
                let d = debrisList[i]; 
                d.mesh.position.copy(d.body.position); 
                d.mesh.quaternion.copy(d.body.quaternion);
            }
        }

    } else if (gameState === 'PLAYING') {
        if (activePowerUp !== 'flying') {
            playerBody.velocity.z = forwardSpeed;
        } else {
            // Keep velocity while flying
            playerBody.velocity.z = forwardSpeed * 1.2;
        }
        
        let targetX = 0;
        if (currentLane <= -2) targetX = -12; 
        else if (currentLane >= 2) targetX = 12; 
        else targetX = currentLane * 3;
        
        playerBody.velocity.x = (targetX - playerBody.position.x) * 10; 
        playerBody.angularVelocity.x = playerBody.velocity.z / playerRadius;
        playerBody.angularVelocity.z = -playerBody.velocity.x / playerRadius;

        while (nextSpawnZ > playerBody.position.z - 300) spawnNextChunk();

        if (playerBody.position.y < -5) {
            if (gameState !== 'GAMEOVER') {
                gameState = 'GAMEOVER';
                showGameOverText();
                UI_Status.innerHTML = "GAME OVER!<br>You fell into the abyss!"; UI_Status.style.color = "#ff3333"; scoreHud.style.color = "#ff3333";
            }
        }

        for (let i = puddles.length - 1; i >= 0; i--) {
            let p = puddles[i];
            if (p.z > playerMesh.position.z + 20) { 
                scene.remove(p.group); 
                p.mirror.dispose(); 
                puddles.splice(i, 1); 
            } 
            else if (playerBody.position.z < p.z + 6.0 && playerBody.position.z > p.z - 6.0 && Math.abs(playerBody.position.x - p.x) < 2.0 && playerBody.position.y < 1.5) {
                
                // CHANGED: Invincibility skips death
                if (activePowerUp === 'invincible' || currentForm === 'beachBall') {
                    if (Math.random() < 0.6) {
                        playTone(400 + Math.random()*300, 'triangle', 0.1, 0.2);
                        for(let k=0; k<6; k++) {
                           let sp = new THREE.Mesh(splashGeo, stageMats[p.stageIdx].splash);
                           sp.position.set(playerBody.position.x + (Math.random()-0.5)*3, 0.2, playerBody.position.z + (Math.random()-0.5)*3);
                           scene.add(sp);
                           splashParticles.push({mesh: sp, vx: (Math.random()-0.5)*8, vy: 6 + Math.random()*6, vz: (Math.random()-0.5)*8 + playerBody.velocity.z, age: 0});
                        }
                    }
                } else {
                    if (gameState !== 'GAMEOVER') {
                        gameState = 'GAMEOVER'; isSinking = true;
                        
                        sinkTarget = { x: p.x, y: -3, z: p.z - 8 }; 
                        showGameOverText();
                        playTone(100, 'sine', 1.0, 0.5); 
                        UI_Status.innerHTML = "GLUB GLUB... You sank!"; UI_Status.style.color = "#ff3333"; scoreHud.style.color = "#ff3333"; 
                        
                        playerBody.type = CANNON.Body.KINEMATIC;
                        playerBody.velocity.set(0, 0, 0); 
                        playerBody.angularVelocity.set(0, 2, 0);
                        playerBody.collisionFilterGroup = 0;
                        playerBody.collisionFilterMask = 0;
                    }
                }
            }
        }

    } else if (gameState === 'GAMEOVER') {
        gameOverTimer += delta;
        
        if (isSinking && sinkTarget) {
            const dx = sinkTarget.x - playerBody.position.x;
            const dy = sinkTarget.y - playerBody.position.y;
            const dz = sinkTarget.z - playerBody.position.z;
            
            playerBody.velocity.set(dx * 0.5, dy * 0.5, dz * 0.5);
            
            playerMesh.material.transparent = true;
            playerMesh.material.opacity = Math.max(0, playerMesh.material.opacity - delta * 0.5); 
        }

        if (gameOverTimer > 1.5) {
            if (currentScore > highScore.score) {
                highScore = { score: currentScore, time: survivalTime, distance: distanceTraveled, pins: pinsSmashed, player: playerName };
            }
            
            const badgeHtml = hasReachedNewHighScore ? `<span class="new-score-badge">NEW!</span>` : "";
            const hsName = highScore.player ? ` (${highScore.player})` : "";
            
            highScoreMenuText.innerHTML = `High Score: <span style="color:#00ccff">${Math.floor(highScore.score)}${hsName}</span> | <span style="color:#00e676">${highScore.time.toFixed(1)}s</span> | <span style="color:#00e676">${highScore.distance}m</span> | <span style="color:#ffcc00">${highScore.pins}</span> Pins ${badgeHtml}`;
            
            latestScoreText.innerHTML = `Latest Score: <span style="color:#00ccff">${Math.floor(currentScore)}</span> | <span style="color:#00e676">${survivalTime.toFixed(1)}s</span> | <span style="color:#00e676">${distanceTraveled}m</span> | <span style="color:#ffcc00">${pinsSmashed}</span> Pins`;
            
            creditLeft.style.display = 'block';
            creditRight.style.display = 'block';
            hideGameOverText();
            timerUI.style.display = 'none';
            
            materials.stone.emissive.setHex(0x000000);
            materials.beachBall.emissive.setHex(0x000000);
            
            trackTiles.forEach(t => { scene.remove(t.mesh); world.removeBody(t.body); }); trackTiles.length = 0;
            obstacles.forEach(o => { scene.remove(o.mesh); world.removeBody(o.body); }); obstacles.length = 0;
            puddles.forEach(p => { scene.remove(p.group); p.mirror.dispose(); }); puddles.length = 0;
            windmills.forEach(w => { scene.remove(w.group); world.removeBody(w.body); }); windmills.length = 0;
            debrisList.forEach(d => { scene.remove(d.mesh); world.removeBody(d.body); }); debrisList.length = 0;
            splashParticles.forEach(sp => { scene.remove(sp.mesh); }); splashParticles.length = 0;
            windParticles.forEach(wp => { scene.remove(wp.mesh); }); windParticles.length = 0;
            powerups.forEach(pu => { scene.remove(pu.mesh); }); powerups.length = 0;
            sceneryList.forEach(sc => { scene.remove(sc); }); sceneryList.length = 0;
            gates.forEach(g => { scene.remove(g.group); world.removeBody(g.leftPillarBody); world.removeBody(g.rightPillarBody); }); gates.length = 0;
            floorParticles.forEach(fp => { scene.remove(fp.mesh); }); floorParticles.length = 0;
            
            spawnStartingRunway();

            uiHUD.style.display = 'none'; scoreHud.style.display = 'none'; mainMenu.style.display = 'flex';
            menuScene.visible = true; playerMesh.visible = false; gameState = 'MENU';
            playerNameInput.style.display = 'block';
            playerNameInput.style.opacity = '1';
        }
    }

    if (gameState !== 'MENU') {
        playerMesh.position.copy(playerBody.position); playerMesh.quaternion.copy(playerBody.quaternion);
        
        // Process splash particles
        for(let i = splashParticles.length - 1; i >= 0; i--) {
            let sp = splashParticles[i];
            sp.age += delta;
            sp.vy -= 15 * delta; 
            sp.mesh.position.x += sp.vx * delta;
            sp.mesh.position.y += sp.vy * delta;
            sp.mesh.position.z += sp.vz * delta;
            sp.mesh.material.opacity = 1.0 - (sp.age / 0.5);
            if (sp.age > 0.5) {
                scene.remove(sp.mesh);
                splashParticles.splice(i, 1);
            }
        }

        // Process Wind Particles
        for(let i = windParticles.length - 1; i >= 0; i--) {
            let wp = windParticles[i];
            wp.age += delta;
            wp.mesh.position.z += 60 * delta; 
            let s = Math.max(0, 1.0 - (wp.age / 0.4));
            wp.mesh.scale.set(s, s, s);
            if (wp.age > 0.4) {
                scene.remove(wp.mesh);
                windParticles.splice(i, 1);
            }
        }
        
        for (let i = trackTiles.length - 1; i >= 0; i--) {
            let t = trackTiles[i];
            if (t.body.position.z > playerMesh.position.z + 150) { 
                scene.remove(t.mesh); world.removeBody(t.body); trackTiles.splice(i, 1); 
            }
        }

        for (let i = sceneryList.length - 1; i >= 0; i--) {
            let sc = sceneryList[i];
            if (sc.position.z > playerMesh.position.z + 150) {
                scene.remove(sc);
                sceneryList.splice(i, 1);
            }
        }

        for (let i = gates.length - 1; i >= 0; i--) {
            let g = gates[i];
            let distToGate = playerBody.position.z - g.zPos; 

            if (distToGate < 80 && distToGate > -20) {
                if (!g.soundPlayed) {
                    playTone(200, 'triangle', 0.5, 0.3); // Gate open rumble
                    g.soundPlayed = true;
                    
                    // Trigger fog transition early!
                    startStageTransition();
                }
                g.opened = true;
            }

            if (!g.passed && distToGate < 0 && gameState === 'PLAYING') { 
                g.passed = true;
                gatesPassed++;
                showStageText(gatesPassed + 1, stagesInfo[currentStageIdx].name);
                playTone(440, 'square', 0.1, 0.2);
                setTimeout(() => playTone(554, 'square', 0.1, 0.2), 100);
                setTimeout(() => playTone(659, 'square', 0.2, 0.3), 200);
            }

            if (g.opened) {
                g.leftPivot.rotation.y = THREE.MathUtils.lerp(g.leftPivot.rotation.y, -Math.PI / 2, 3 * delta);
                g.rightPivot.rotation.y = THREE.MathUtils.lerp(g.rightPivot.rotation.y, Math.PI / 2, 3 * delta);
            }

            if (g.zPos > playerMesh.position.z + 150) {
                scene.remove(g.group);
                world.removeBody(g.leftPillarBody);
                world.removeBody(g.rightPillarBody);
                gates.splice(i, 1);
            }
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            if (obs.body.position.z > playerMesh.position.z + 20) {
                scene.remove(obs.mesh); world.removeBody(obs.body); obstacles.splice(i, 1);
            } else if (obs.body.needsShatter) {
                scene.remove(obs.mesh); world.removeBody(obs.body); obstacles.splice(i, 1); pinsSmashed++;
                for(let j=0; j<5; j++) {
                    const dMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), stageMats[obs.stageIdx].pin); dMesh.castShadow = true; dMesh.receiveShadow = true; scene.add(dMesh);
                    
                    // Shattered debris set to physics group 8, mask 1 (only collides with ground) to prevent it from bumping the player
                    const dBody = new CANNON.Body({ mass: 0.5, shape: new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25)) });
                    dBody.collisionFilterGroup = 8;
                    dBody.collisionFilterMask = 1;
                    
                    dBody.position.copy(obs.body.position); dBody.position.x += (Math.random() - 0.5) * 0.5; dBody.position.y += Math.random();
                    dBody.velocity.set((Math.random() - 0.5) * 20, Math.random() * 15 + 5, playerBody.velocity.z + (Math.random() - 0.5) * 15);
                    world.addBody(dBody); debrisList.push({ mesh: dMesh, body: dBody, spawnTime: gameElapsedTime });
                }
            } else {
                obs.mesh.position.copy(obs.body.position); obs.mesh.quaternion.copy(obs.body.quaternion);
            }
        }

        const currentTime = gameElapsedTime;
        for(let i = debrisList.length - 1; i >= 0; i--) {
            let d = debrisList[i]; d.mesh.position.copy(d.body.position); d.mesh.quaternion.copy(d.body.quaternion);
            if (currentTime - d.spawnTime > 1.5) { scene.remove(d.mesh); world.removeBody(d.body); debrisList.splice(i, 1); }
        }

        for (let i = windmills.length - 1; i >= 0; i--) {
            let w = windmills[i]; w.rotor.rotation.z += 3 * delta; 
            if (w.body.position.z > playerMesh.position.z + 20) { scene.remove(w.group); world.removeBody(w.body); windmills.splice(i, 1); }
        }

        camera.position.x = 0; 
        camera.position.y = isSinking ? camera.position.y : playerMesh.position.y + 4;
        camera.position.z = playerMesh.position.z + 10; 
        camera.lookAt(new THREE.Vector3(playerMesh.position.x * 0.5, isSinking ? 0 : playerMesh.position.y, playerMesh.position.z - 10));
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();