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
scene.fog = new THREE.Fog(scene.background, 50, 400);

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
// 3. TEXTURES, UI & GAME STATE
// ==========================================
let gameState = 'MENU'; 
// CHANGED: Default starting ball
let currentForm = 'beachBall'; 
let isSinking = false;
let sinkTarget = null;

let survivalTime = 0;
let pinsSmashed = 0;
let distanceTraveled = 0;
let gameOverTimer = 0;
let gatesPassed = 0; 
let gameElapsedTime = 0; 

// High Score Variables
let highScore = { score: 0, time: 0, distance: 0, pins: 0 };
let currentScore = 0;
let hasReachedNewHighScore = false;

let isModalOpen = false;

const uiHUD = document.getElementById('ui');
const mainMenu = document.getElementById('main-menu');
const playBtn = document.getElementById('play-btn');
const latestScoreText = document.getElementById('latest-score');
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
scoreHud.style.color = '#fff'; scoreHud.style.background = 'rgba(0,0,0,0.7)';
scoreHud.style.padding = '15px'; scoreHud.style.borderRadius = '8px';
scoreHud.style.fontFamily = 'sans-serif'; scoreHud.style.fontSize = '18px';
scoreHud.style.fontWeight = 'bold'; scoreHud.style.textAlign = 'right'; scoreHud.style.display = 'none';
document.body.appendChild(scoreHud);

// --- PAUSE BUTTON ---
const pauseBtn = document.createElement('button');
pauseBtn.innerText = "PAUSE (9)";
pauseBtn.style.position = 'absolute';
pauseBtn.style.top = '150px'; 
pauseBtn.style.right = '10px';
pauseBtn.style.padding = '10px 15px';
pauseBtn.style.background = 'rgba(0,0,0,0.7)';
pauseBtn.style.color = '#fff';
pauseBtn.style.border = '2px solid #fff';
pauseBtn.style.borderRadius = '8px';
pauseBtn.style.fontFamily = 'sans-serif';
pauseBtn.style.fontSize = '14px';
pauseBtn.style.fontWeight = 'bold';
pauseBtn.style.cursor = 'pointer';
pauseBtn.style.display = 'none';
document.body.appendChild(pauseBtn);

let isPaused = false;
function togglePause() {
    if (gameState !== 'PLAYING') return;
    isPaused = !isPaused;
    pauseBtn.innerText = isPaused ? "RESUME (9)" : "PAUSE (9)";
}
pauseBtn.addEventListener('click', togglePause);

// --- HOW TO PLAY BUTTON & MODAL ---
const howToPlayBtn = document.createElement('button');
howToPlayBtn.innerText = "HOW TO PLAY";

howToPlayBtn.style.padding = "10px 25px";
howToPlayBtn.style.fontSize = "1.2rem";
howToPlayBtn.style.cursor = "pointer";
howToPlayBtn.style.background = "#00e676";
howToPlayBtn.style.border = "none";
howToPlayBtn.style.borderRadius = "50px";
howToPlayBtn.style.color = "#111";
howToPlayBtn.style.fontWeight = "900";
howToPlayBtn.style.letterSpacing = "1px";
howToPlayBtn.style.boxShadow = "0 6px 20px rgba(0, 230, 118, 0.4)";
howToPlayBtn.style.transition = "all 0.2s ease";
howToPlayBtn.style.display = "block";
howToPlayBtn.style.margin = "15px auto 0 auto";

howToPlayBtn.addEventListener('mouseenter', () => {
    howToPlayBtn.style.transform = 'scale(1.05)';
    howToPlayBtn.style.background = '#00c853';
    howToPlayBtn.style.boxShadow = '0 8px 25px rgba(0, 230, 118, 0.6)';
});
howToPlayBtn.addEventListener('mouseleave', () => {
    howToPlayBtn.style.transform = 'scale(1)';
    howToPlayBtn.style.background = '#00e676';
    howToPlayBtn.style.boxShadow = '0 6px 20px rgba(0, 230, 118, 0.4)';
});
howToPlayBtn.addEventListener('mousedown', () => {
    howToPlayBtn.style.transform = 'scale(0.95)';
});
howToPlayBtn.addEventListener('mouseup', () => {
    howToPlayBtn.style.transform = 'scale(1.05)';
});

if (playBtn && playBtn.parentNode) {
    playBtn.parentNode.insertBefore(howToPlayBtn, playBtn.nextSibling);
} else {
    mainMenu.appendChild(howToPlayBtn);
}

const rulesModal = document.createElement('div');
rulesModal.style.position = 'absolute';
rulesModal.style.top = '50%';
rulesModal.style.left = '50%';
rulesModal.style.transform = 'translate(-50%, -50%) scale(0)';
rulesModal.style.width = '400px';
rulesModal.style.background = 'rgba(0, 0, 0, 0.9)';
rulesModal.style.border = '3px solid #00ccff';
rulesModal.style.borderRadius = '15px';
rulesModal.style.padding = '30px';
rulesModal.style.color = '#fff';
rulesModal.style.fontFamily = 'sans-serif';
rulesModal.style.textAlign = 'center';
rulesModal.style.zIndex = '3000';
rulesModal.style.transition = 'transform 0.3s ease-in-out';
rulesModal.innerHTML = `
    <h2 style="color:#00ccff; margin-top:0;">HOW TO PLAY</h2>
    <p style="font-size:16px; line-height:1.6; text-align:left;">
        <b>[A] / [D] or [Left] / [Right]:</b> Change lanes<br><br>
        <b>[W] / [Space] or [Up]:</b> Jump<br><br>
        <b>[2]:</b> Swap Stone (Heavy) & Beach Ball (Floaty)<br><br>
        <b>[9] or [Mouse Click]:</b> Pause / Resume Game<br><br>
        <em>You can smash pins with the Stone ball, but avoid water with it or you'll sink! On the other hand the Beach ball is floaty on water and it's also very useful to jump for long distances, but don't hit the pins because it's not strong enough!</em><br><br>
        <b> The objective is to survive for the longest amount of time possible and hit as many pins as you can! Good luck and have fun playing!</b>
    </p>
`;
document.body.appendChild(rulesModal);

const closeRulesBtn = document.createElement('button');
closeRulesBtn.innerText = "CLOSE";
closeRulesBtn.style.marginTop = "20px";
closeRulesBtn.style.padding = "10px 25px";
closeRulesBtn.style.fontSize = "1.2rem";
closeRulesBtn.style.fontWeight = "900";
closeRulesBtn.style.cursor = "pointer";
closeRulesBtn.style.borderRadius = "50px";
closeRulesBtn.style.border = "none";
closeRulesBtn.style.background = "#00ccff";
closeRulesBtn.style.color = "#111"; 
closeRulesBtn.style.boxShadow = "0 6px 20px rgba(0, 204, 255, 0.4)";
closeRulesBtn.style.transition = "all 0.2s ease";
rulesModal.appendChild(closeRulesBtn);

closeRulesBtn.addEventListener('mouseenter', () => {
    closeRulesBtn.style.transform = 'scale(1.05)';
    closeRulesBtn.style.boxShadow = '0 8px 25px rgba(0, 204, 255, 0.6)';
});
closeRulesBtn.addEventListener('mouseleave', () => {
    closeRulesBtn.style.transform = 'scale(1)';
    closeRulesBtn.style.boxShadow = '0 6px 20px rgba(0, 204, 255, 0.4)';
});
closeRulesBtn.addEventListener('mousedown', () => {
    closeRulesBtn.style.transform = 'scale(0.95)';
});
closeRulesBtn.addEventListener('mouseup', () => {
    closeRulesBtn.style.transform = 'scale(1.05)';
});

howToPlayBtn.addEventListener('click', () => {
    isModalOpen = true;
    rulesModal.style.transform = 'translate(-50%, -50%) scale(1)';
});

closeRulesBtn.addEventListener('click', () => {
    isModalOpen = false;
    rulesModal.style.transform = 'translate(-50%, -50%) scale(0)';
});

// --- TEXTURES BUTTON & MODAL ---
const texturesBtn = document.createElement('button');
texturesBtn.innerText = "TEXTURES";
texturesBtn.style.padding = "10px 25px";
texturesBtn.style.fontSize = "1.2rem";
texturesBtn.style.cursor = "pointer";
texturesBtn.style.background = "#00e676";
texturesBtn.style.border = "none";
texturesBtn.style.borderRadius = "50px";
texturesBtn.style.color = "#111";
texturesBtn.style.fontWeight = "900";
texturesBtn.style.letterSpacing = "1px";
texturesBtn.style.boxShadow = "0 6px 20px rgba(0, 230, 118, 0.4)";
texturesBtn.style.transition = "all 0.2s ease";
texturesBtn.style.display = "block";
texturesBtn.style.margin = "15px auto 0 auto";

texturesBtn.addEventListener('mouseenter', () => {
    texturesBtn.style.transform = 'scale(1.05)';
    texturesBtn.style.background = '#00c853';
    texturesBtn.style.boxShadow = '0 8px 25px rgba(0, 230, 118, 0.6)';
});
texturesBtn.addEventListener('mouseleave', () => {
    texturesBtn.style.transform = 'scale(1)';
    texturesBtn.style.background = '#00e676';
    texturesBtn.style.boxShadow = '0 6px 20px rgba(0, 230, 118, 0.4)';
});
texturesBtn.addEventListener('mousedown', () => {
    texturesBtn.style.transform = 'scale(0.95)';
});
texturesBtn.addEventListener('mouseup', () => {
    texturesBtn.style.transform = 'scale(1.05)';
});

howToPlayBtn.parentNode.insertBefore(texturesBtn, howToPlayBtn.nextSibling);

const texturesModal = document.createElement('div');
texturesModal.style.position = 'absolute';
texturesModal.style.top = '50%';
texturesModal.style.left = '50%';
texturesModal.style.transform = 'translate(-50%, -50%) scale(0)';
texturesModal.style.width = '400px';
texturesModal.style.background = 'rgba(0, 0, 0, 0.9)';
texturesModal.style.border = '3px solid #00ccff';
texturesModal.style.borderRadius = '15px';
texturesModal.style.padding = '30px';
texturesModal.style.color = '#fff';
texturesModal.style.fontFamily = 'sans-serif';
texturesModal.style.textAlign = 'center';
texturesModal.style.zIndex = '3000';
texturesModal.style.transition = 'transform 0.3s ease-in-out';
texturesModal.innerHTML = `
    <h2 style="color:#00ccff; margin-top:0;">CHOOSE TEXTURES</h2>
    <div style="text-align:left; margin-bottom: 20px;">
        <label style="display:block; margin-bottom:5px; font-weight:bold;">Stone Ball Texture:</label>
        <select id="stone-tex-select" style="width:100%; padding:10px; font-size:16px; border-radius:5px; border:none;">
            <option value="textures/bricks_color.png">Default (Bricks)</option>
            <option value="textures/granite_color.png">Granite</option>
            <option value="textures/marble_color.jpg">Marble</option>
            <option value="textures/concrete_color.jpg">Concrete</option>
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
`;
document.body.appendChild(texturesModal);

const saveTexturesBtn = document.createElement('button');
saveTexturesBtn.innerText = "SAVE";
saveTexturesBtn.style.marginTop = "20px";
saveTexturesBtn.style.padding = "10px 25px";
saveTexturesBtn.style.fontSize = "1.2rem";
saveTexturesBtn.style.fontWeight = "900";
saveTexturesBtn.style.cursor = "pointer";
saveTexturesBtn.style.borderRadius = "50px";
saveTexturesBtn.style.border = "none";
saveTexturesBtn.style.background = "#00ccff";
saveTexturesBtn.style.color = "#111"; 
saveTexturesBtn.style.boxShadow = "0 6px 20px rgba(0, 204, 255, 0.4)";
saveTexturesBtn.style.transition = "all 0.2s ease";
texturesModal.appendChild(saveTexturesBtn);

saveTexturesBtn.addEventListener('mouseenter', () => {
    saveTexturesBtn.style.transform = 'scale(1.05)';
    saveTexturesBtn.style.boxShadow = '0 8px 25px rgba(0, 204, 255, 0.6)';
});
saveTexturesBtn.addEventListener('mouseleave', () => {
    saveTexturesBtn.style.transform = 'scale(1)';
    saveTexturesBtn.style.boxShadow = '0 6px 20px rgba(0, 204, 255, 0.4)';
});
saveTexturesBtn.addEventListener('mousedown', () => {
    saveTexturesBtn.style.transform = 'scale(0.95)';
});
saveTexturesBtn.addEventListener('mouseup', () => {
    saveTexturesBtn.style.transform = 'scale(1.05)';
});

texturesBtn.addEventListener('click', () => {
    isModalOpen = true;
    texturesModal.style.transform = 'translate(-50%, -50%) scale(1)';
});

const startHintText = document.createElement('div');
startHintText.innerText = "Press the play button, space bar or enter key to start the game";
startHintText.style.color = "#fff";
startHintText.style.fontFamily = '"Arial Black", Arial, sans-serif';
startHintText.style.fontSize = "14px";
startHintText.style.fontWeight = "normal";
startHintText.style.marginBottom = "20px";
startHintText.style.opacity = "0.8";

if (playBtn && playBtn.parentNode) {
    playBtn.parentNode.insertBefore(startHintText, playBtn);
} else {
    mainMenu.appendChild(startHintText);
}

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

function showStageText(num) {
    stageText.innerText = `STAGE ${num}`;
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
}

function hideGameOverText() {
    gameOverText.style.opacity = '0';
}

const textureLoader = new THREE.TextureLoader();

const stoneTexture = textureLoader.load('textures/bricks_color.png');
stoneTexture.colorSpace = THREE.SRGBColorSpace; 

const floorTexture = textureLoader.load('textures/floor.jpg');
floorTexture.colorSpace = THREE.SRGBColorSpace;
floorTexture.wrapS = THREE.RepeatWrapping; floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(2, 5); 

const startingFloorTexture = textureLoader.load('textures/floor.jpg');
startingFloorTexture.colorSpace = THREE.SRGBColorSpace;
startingFloorTexture.wrapS = THREE.RepeatWrapping; startingFloorTexture.wrapT = THREE.RepeatWrapping;
startingFloorTexture.repeat.set(2, 33); 

const materials = {
    stone: new THREE.MeshStandardMaterial({ color: 0xaaaaaa, map: stoneTexture, roughness: 0.65, metalness: 0.2 }),
    beachBall: new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.1 })
};

// Texture Save Logic
saveTexturesBtn.addEventListener('click', () => {
    const stoneVal = document.getElementById('stone-tex-select').value;
    const beachVal = parseInt(document.getElementById('beach-col-select').value, 16);
    
    const newTex = textureLoader.load(stoneVal);
    newTex.colorSpace = THREE.SRGBColorSpace;
    materials.stone.map = newTex;
    materials.stone.needsUpdate = true;
    
    materials.beachBall.color.setHex(beachVal);
    materials.beachBall.needsUpdate = true;
    
    isModalOpen = false;
    texturesModal.style.transform = 'translate(-50%, -50%) scale(0)';
});

const groundMat = new THREE.MeshStandardMaterial({ color: 0x999999, map: floorTexture, roughness: 0.9, metalness: 0.05 });
const startingGroundMat = new THREE.MeshStandardMaterial({ color: 0x999999, map: startingFloorTexture, roughness: 0.9, metalness: 0.05 });

const puddleSurfaceMat = new THREE.MeshStandardMaterial({ 
    color: 0x1ca3ec, 
    transparent: true, 
    opacity: 0.8,    
    roughness: 0.3,  
    metalness: 0.2
});

const physicsMaterials = { ground: new CANNON.Material('ground'), ball: new CANNON.Material('ball'), obstacle: new CANNON.Material('obstacle') };
world.addContactMaterial(new CANNON.ContactMaterial(physicsMaterials.ground, physicsMaterials.ball, { friction: 0.0, restitution: 0.2 }));

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
const playerRadius = 1; 

const playerMesh = new THREE.Mesh(new THREE.SphereGeometry(playerRadius, 32, 32), materials.stone);
playerMesh.castShadow = true; playerMesh.visible = false; 
scene.add(playerMesh);

const playerBody = new CANNON.Body({ mass: 25, shape: new CANNON.Sphere(playerRadius), position: new CANNON.Vec3(0, 5, 0), material: physicsMaterials.ball });
playerBody.linearDamping = 0; playerBody.angularDamping = 0; 
world.addBody(playerBody);

playerBody.addEventListener('collide', (e) => {
    if (gameState !== 'PLAYING') return;
    if (e.body.isPin) {
        if (currentForm === 'stone') e.body.needsShatter = true; 
        else {
            if (gameState !== 'GAMEOVER') {
                gameState = 'GAMEOVER'; 
                showGameOverText();
                playerBody.velocity.set(0, 10, 15); 
                UI_Status.innerHTML = "CRASH! Only the Stone ball smashes pins."; UI_Status.style.color = "#ff3333"; scoreHud.style.color = "#ff3333";
            }
        }
    }
});

// ==========================================
// 6. PROCEDURAL CHUNKS, GAPS & GATES
// ==========================================
const trackTiles = []; const obstacles = []; const puddles = []; const windmills = []; const debrisList = [];
const gates = []; 
let nextSpawnZ = -40; 
let nextGateZ = -1000; 
let wasGap = false;

const puddleShape = new THREE.Shape();
puddleShape.moveTo(0, 6);
puddleShape.bezierCurveTo(2.2, 4.5, 1.2, 2.0, 1.8, 0);
puddleShape.bezierCurveTo(2.4, -2.5, 1.5, -4.8, 0.2, -6);
puddleShape.bezierCurveTo(-1.8, -5.5, -2.2, -2.0, -1.7, 0);
puddleShape.bezierCurveTo(-1.2, 2.5, -2.5, 4.5, 0, 6);
const puddleGeo = new THREE.ShapeGeometry(puddleShape, 32);

function spawnGate(zPos) {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, zPos);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x00ccff, roughness: 0.5 }); // Bright sky blue
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.4 }); // Bright sunset orange
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xff00ff, metalness: 0.8, roughness: 0.2 }); // Neon pink

    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(2, 24, 2), frameMat);
    leftPillar.position.set(-7, 12, 0); leftPillar.castShadow = true; gateGroup.add(leftPillar);
    
    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(2, 24, 2), frameMat);
    rightPillar.position.set(7, 12, 0); rightPillar.castShadow = true; gateGroup.add(rightPillar);

    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 2), frameMat);
    topBeam.position.set(0, 25, 0); topBeam.castShadow = true; gateGroup.add(topBeam);

    const leftPillarBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(new CANNON.Vec3(1, 12, 1)), position: new CANNON.Vec3(-7, 12, zPos) });
    world.addBody(leftPillarBody);
    const rightPillarBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(new CANNON.Vec3(1, 12, 1)), position: new CANNON.Vec3(7, 12, zPos) });
    world.addBody(rightPillarBody);

    const leftDoorPivot = new THREE.Group();
    leftDoorPivot.position.set(-6, 0, 0); 
    
    const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(6, 24, 0.5), doorMat);
    leftDoor.position.set(3, 12, 0); 
    leftDoor.castShadow = true;
    
    const leftHandle = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), handleMat);
    leftHandle.position.set(2.5, 0, 0.5); 
    leftDoor.add(leftHandle);
    
    leftDoorPivot.add(leftDoor);
    gateGroup.add(leftDoorPivot);

    const rightDoorPivot = new THREE.Group();
    rightDoorPivot.position.set(6, 0, 0); 

    const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(6, 24, 0.5), doorMat);
    rightDoor.position.set(-3, 12, 0); 
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
        leftPillarBody: leftPillarBody,
        rightPillarBody: rightPillarBody
    });
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
    const tBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(new CANNON.Vec3(6, 1, 100)), material: physicsMaterials.ground, position: new CANNON.Vec3(0, -1, -50) });
    world.addBody(tBody); trackTiles.push({ mesh: tMesh, body: tBody });
}

function spawnNextChunk() {
    const gapChance = Math.min(0.25, 0.15 + (distanceTraveled / 10000));
    
    if (nextSpawnZ < -150 && Math.random() < gapChance && !wasGap && Math.abs(nextSpawnZ) % 300 !== 0 && nextSpawnZ > nextGateZ) {
        wasGap = true; nextSpawnZ -= 30; return; 
    }
    wasGap = false;

    const tMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 30), groundMat);
    tMesh.position.set(0, -1, nextSpawnZ); tMesh.receiveShadow = true; scene.add(tMesh);
    const tBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(new CANNON.Vec3(6, 1, 15)), material: physicsMaterials.ground, position: new CANNON.Vec3(0, -1, nextSpawnZ) });
    world.addBody(tBody); trackTiles.push({ mesh: tMesh, body: tBody });

    if (nextSpawnZ <= nextGateZ) {
        spawnGate(nextSpawnZ);
        nextGateZ -= 1000;
        nextSpawnZ -= 30;
        return; 
    }

    if (Math.abs(nextSpawnZ) % 300 === 0) { spawnWindmill(nextSpawnZ); nextSpawnZ -= 30; return; }

    const laneIndex = Math.floor(Math.random() * 3) - 1; 
    const xPos = laneIndex * 3;

    if (Math.random() > 0.4) {
        const pinMesh = new THREE.Mesh(pinGeo, pinMat); pinMesh.position.set(xPos, 1, nextSpawnZ); pinMesh.castShadow = true; scene.add(pinMesh);
        const pinBody = new CANNON.Body({ mass: 2, material: physicsMaterials.obstacle });
        const qY = new CANNON.Quaternion(); qY.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        pinBody.addShape(pinShape, new CANNON.Vec3(0, 0, 0), qY);
        pinBody.position.set(xPos, 1.0, nextSpawnZ); pinBody.isPin = true; world.addBody(pinBody);
        obstacles.push({ mesh: pinMesh, body: pinBody });
    } else {
        const puddleGroup = new THREE.Group();
        puddleGroup.position.set(xPos, 0.02, nextSpawnZ);

        const puddleMirror = new Reflector(puddleGeo, {
            clipBias: 0.003,
            textureWidth: 512, 
            textureHeight: 512,
            color: 0x88bbff
        });
        puddleMirror.rotation.x = -Math.PI / 2;
        puddleGroup.add(puddleMirror);

        const puddleSurface = new THREE.Mesh(puddleGeo, puddleSurfaceMat);
        puddleSurface.rotation.x = -Math.PI / 2;
        puddleSurface.position.y = 0.01; 
        puddleSurface.receiveShadow = true;
        puddleGroup.add(puddleSurface);

        scene.add(puddleGroup);
        puddles.push({ group: puddleGroup, mirror: puddleMirror, x: xPos, z: nextSpawnZ });
    }
    nextSpawnZ -= 30;
}

let isTransitioning = false;
function triggerPlayAnimation() {
    if (isTransitioning) return;
    isTransitioning = true;
    
    for(let i = 0; i < 20; i++) {
        const pMesh = new THREE.Mesh(pinGeo, pinMat); 
        pMesh.castShadow = true; pMesh.receiveShadow = true; 
        scene.add(pMesh);
        
        const pBody = new CANNON.Body({ mass: 1, material: physicsMaterials.obstacle });
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
    if (startHintText) {
        startHintText.style.transition = 'opacity 0.3s ease';
        startHintText.style.opacity = '0';
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
        if (startHintText) {
            startHintText.style.transition = 'none';
            startHintText.style.opacity = '0.8';
        }
        resetGame();
        isTransitioning = false;
    }, 1200);
}

function resetGame() {
    hideGameOverText();
    creditLeft.style.display = 'none';
    creditRight.style.display = 'none';
    rulesModal.style.transform = 'translate(-50%, -50%) scale(0)';
    texturesModal.style.transform = 'translate(-50%, -50%) scale(0)';
    isModalOpen = false;
    sinkTarget = null;
    
    currentScore = 0;
    hasReachedNewHighScore = false;
    
    trackTiles.forEach(t => { scene.remove(t.mesh); world.removeBody(t.body); }); trackTiles.length = 0;
    obstacles.forEach(o => { scene.remove(o.mesh); world.removeBody(o.body); }); obstacles.length = 0;
    puddles.forEach(p => { scene.remove(p.group); p.mirror.dispose(); }); puddles.length = 0;
    windmills.forEach(w => { scene.remove(w.group); world.removeBody(w.body); }); windmills.length = 0;
    debrisList.forEach(d => { scene.remove(d.mesh); world.removeBody(d.body); }); debrisList.length = 0;
    
    gates.forEach(g => { scene.remove(g.group); world.removeBody(g.leftPillarBody); world.removeBody(g.rightPillarBody); }); gates.length = 0;

    spawnStartingRunway();
    currentLane = 0; nextSpawnZ = -165; nextGateZ = -1000;
    survivalTime = 0; pinsSmashed = 0; distanceTraveled = 0; gameOverTimer = 0; isSinking = false; gatesPassed = 0;
    
    // CHANGED: Default is Beach ball
    currentForm = 'beachBall'; playerMesh.material = materials.beachBall; playerMesh.scale.set(1,1,1);
    
    materials.stone.transparent = false;
    materials.stone.opacity = 1.0;
    materials.beachBall.transparent = false;
    materials.beachBall.opacity = 1.0;
    
    // CHANGED: Starting values to match floaty ball
    baseSpeed = -35; forwardSpeed = -35;
    playerBody.mass = 1.5; playerBody.updateMassProperties(); 
    
    playerBody.type = CANNON.Body.DYNAMIC;
    playerBody.collisionFilterGroup = 1;
    playerBody.collisionFilterMask = -1;
    playerBody.position.set(0, 5, 0); playerBody.velocity.set(0,0,0); playerBody.angularVelocity.set(0,0,0);
    
    isPaused = false;
    pauseBtn.innerText = "PAUSE (9)";
    pauseBtn.style.display = 'block';
    
    // CHANGED: Update UI to match the starting beach ball mode
    UI_Status.innerText = "Current Form: Beach Ball (Floaty)"; UI_Status.style.color = "#33ccff"; scoreHud.style.color = "#fff";
    uiHUD.style.display = 'block'; scoreHud.style.display = 'block'; mainMenu.style.display = 'none';
    menuScene.visible = false; playerMesh.visible = true; gameState = 'PLAYING';
}

if (playBtn) {
    playBtn.addEventListener('click', triggerPlayAnimation);
}

// CHANGED: Delay the first spawn so the scene resets cleanly
spawnStartingRunway(); 

// ==========================================
// 7. USER INTERACTION
// ==========================================

window.addEventListener('mousedown', (e) => {
    if (e.target.tagName.toLowerCase() === 'button') return;
    
    if (gameState === 'PLAYING') {
        togglePause();
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === '9') {
        togglePause();
    }
    
    if (gameState === 'MENU' && (e.key === ' ' || e.key === 'Enter')) {
        if (isModalOpen) return;
        triggerPlayAnimation();
        return;
    }

    if (gameState !== 'PLAYING') return; 
    if (isPaused) return; 

    if (e.key === 'a' || e.key === 'ArrowLeft') currentLane--;
    if (e.key === 'd' || e.key === 'ArrowRight') currentLane++;
    
    const isGrounded = playerBody.position.y > -0.5 && playerBody.position.y < 2 && Math.abs(playerBody.velocity.y) < 1;
    if ((e.key === 'w' || e.key === ' ' || e.key === 'ArrowUp') && isGrounded && !isSinking) {
        if (currentForm === 'stone') playerBody.velocity.y = 10;    
        if (currentForm === 'beachBall') playerBody.velocity.y = 25; 
    }

    if (e.key === '2') {
        if (currentForm === 'stone') {
            currentForm = 'beachBall'; 
            playerMesh.material = materials.beachBall; 
            playerBody.mass = 1.5; 
            playerBody.updateMassProperties(); 
            baseSpeed = -35; 
            UI_Status.innerText = "Current Form: Beach Ball (Floaty)"; 
            UI_Status.style.color = "#33ccff"; 
        } else {
            currentForm = 'stone'; 
            playerMesh.material = materials.stone; 
            playerBody.mass = 25; 
            playerBody.updateMassProperties(); 
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
        
        // CHANGED: Speed text moved under pins
        let speedText = speedMultiplier > 1.1 ? `<br><span style="color:#808080">x${speedMultiplier.toFixed(1)} SPEED!</span>` : "";
        scoreHud.innerHTML = `Score: <span style="color:#00ccff">${Math.floor(currentScore)}</span><br>Time: <span style="color:#00e676">${survivalTime.toFixed(1)}s</span><br>Dist: <span style="color:#00e676">${distanceTraveled}m</span><br>Pins: <span style="color:#ffcc00">${pinsSmashed}</span>${speedText}`;
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
        playerBody.velocity.z = forwardSpeed;
        
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
                if (currentForm !== 'beachBall') {
                    if (gameState !== 'GAMEOVER') {
                        gameState = 'GAMEOVER'; isSinking = true;
                        
                        sinkTarget = { x: p.x, y: -3, z: p.z - 8 }; 
                        showGameOverText();
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

        if (gameOverTimer > 0.8) {
            if (currentScore > highScore.score) {
                highScore = { score: currentScore, time: survivalTime, distance: distanceTraveled, pins: pinsSmashed };
            }
            
            const badgeHtml = hasReachedNewHighScore ? `<span class="new-score-badge">NEW!</span>` : "";
            
            highScoreMenuText.innerHTML = `High Score: <span style="color:#00ccff">${Math.floor(highScore.score)}</span> | <span style="color:#00e676">${highScore.time.toFixed(1)}s</span> | <span style="color:#00e676">${highScore.distance}m</span> | <span style="color:#ffcc00">${highScore.pins}</span> Pins ${badgeHtml}`;
            
            latestScoreText.innerHTML = `Latest Score: <span style="color:#00ccff">${Math.floor(currentScore)}</span> | <span style="color:#00e676">${survivalTime.toFixed(1)}s</span> | <span style="color:#00e676">${distanceTraveled}m</span> | <span style="color:#ffcc00">${pinsSmashed}</span> Pins`;
            
            pauseBtn.style.display = 'none';
            creditLeft.style.display = 'block';
            creditRight.style.display = 'block';
            hideGameOverText();
            
            // CHANGED: Wipe the track and regenerate the starting runway so it correctly renders in MENU state.
            trackTiles.forEach(t => { scene.remove(t.mesh); world.removeBody(t.body); }); trackTiles.length = 0;
            obstacles.forEach(o => { scene.remove(o.mesh); world.removeBody(o.body); }); obstacles.length = 0;
            puddles.forEach(p => { scene.remove(p.group); p.mirror.dispose(); }); puddles.length = 0;
            windmills.forEach(w => { scene.remove(w.group); world.removeBody(w.body); }); windmills.length = 0;
            debrisList.forEach(d => { scene.remove(d.mesh); world.removeBody(d.body); }); debrisList.length = 0;
            gates.forEach(g => { scene.remove(g.group); world.removeBody(g.leftPillarBody); world.removeBody(g.rightPillarBody); }); gates.length = 0;
            
            spawnStartingRunway();

            uiHUD.style.display = 'none'; scoreHud.style.display = 'none'; mainMenu.style.display = 'flex';
            menuScene.visible = true; playerMesh.visible = false; gameState = 'MENU';
        }
    }

    if (gameState !== 'MENU') {
        playerMesh.position.copy(playerBody.position); playerMesh.quaternion.copy(playerBody.quaternion);
        
        for (let i = trackTiles.length - 1; i >= 0; i--) {
            let t = trackTiles[i];
            if (t.body.position.z > playerMesh.position.z + 150) { 
                scene.remove(t.mesh); world.removeBody(t.body); trackTiles.splice(i, 1); 
            }
        }

        for (let i = gates.length - 1; i >= 0; i--) {
            let g = gates[i];
            let distToGate = playerBody.position.z - g.zPos; 

            if (distToGate < 80 && distToGate > -20) {
                g.opened = true;
            }

            if (!g.passed && distToGate < 0 && gameState !== 'GAMEOVER') { 
                g.passed = true;
                gatesPassed++;
                showStageText(gatesPassed);
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
                    const dMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), pinMat); dMesh.castShadow = true; dMesh.receiveShadow = true; scene.add(dMesh);
                    const dBody = new CANNON.Body({ mass: 0.5, shape: new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25)) });
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