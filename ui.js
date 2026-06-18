import { playTone } from './audio.js';

export const uiState = { isModalOpen: false };

export const mainMenu = document.getElementById('main-menu');
export const playBtn = document.getElementById('play-btn');
export const latestScoreText = document.getElementById('latest-score');

let oldUiHUD = document.getElementById('ui');
if (oldUiHUD) oldUiHUD.remove(); 

export const uiHUD = document.createElement('div');
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
export const UI_Status = document.getElementById('status');

// Flash Badge
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

export const highScoreMenuText = document.createElement('div');
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

export const scoreHud = document.createElement('div');
scoreHud.style.position = 'absolute'; scoreHud.style.top = '10px'; scoreHud.style.right = '10px';
scoreHud.style.color = '#fff';
scoreHud.style.background = 'rgba(0,0,0,0.7)';
scoreHud.style.padding = '15px'; scoreHud.style.borderRadius = '8px';
scoreHud.style.fontFamily = 'sans-serif'; scoreHud.style.fontSize = '18px';
scoreHud.style.fontWeight = 'bold'; scoreHud.style.textAlign = 'right'; scoreHud.style.display = 'none';
scoreHud.style.zIndex = '500';
document.body.appendChild(scoreHud);

export const timerUI = document.createElement('div');
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

export const pauseOverlay = document.createElement('div');
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

export const resumeBtn = document.getElementById('resume-btn');
export const abandonBtn = document.getElementById('abandon-btn');
export const pMusicBtn = document.getElementById('pmusic-btn');
export const pSfxBtn = document.getElementById('psfx-btn');

export function addHover(btn) {
    btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.05)');
    btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
    btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.95)');
    btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1.05)');
}
addHover(resumeBtn); addHover(abandonBtn); addHover(pMusicBtn); addHover(pSfxBtn);

export function updatePauseStats() {
    const pStats = document.getElementById('pause-stats');
    pStats.innerHTML = scoreHud.innerHTML;
}

export const playerNameInput = document.createElement('input');
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

export const howToPlayBtn = document.createElement('button');
howToPlayBtn.innerText = "HOW TO PLAY";
export const texturesBtn = document.createElement('button');
texturesBtn.innerText = "TEXTURES";
export const settingsBtn = document.createElement('button');
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

texturesBtn.style.margin = "0";
settingsBtn.style.margin = "0";

export const row3Container = document.createElement('div');
row3Container.style.display = 'flex';
row3Container.style.justifyContent = 'center';
row3Container.style.gap = '20px';
row3Container.style.marginTop = '15px';
row3Container.appendChild(texturesBtn);
row3Container.appendChild(settingsBtn);

export const startHintText = document.createElement('div');
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

export function createModal(id, titleHtml, innerHtml) {
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
        uiState.isModalOpen = false;
        mod.style.transform = 'translate(-50%, -50%) scale(0)';
    });
    
    document.body.appendChild(mod);
    return { modal: mod, closeBtn: cBtn };
}

export const rulesObj = createModal('rules-modal', 'HOW TO PLAY', `
    <p style="font-size:16px; line-height:1.6; text-align:left;">
        <b>[A] / [D] or [Left] / [Right]:</b> Change lanes<br><br>
        <b>[W] / [Space] or [Up]:</b> Jump<br><br>
        <b>[2]:</b> Swap Stone (Heavy) & Beach Ball (Floaty)<br><br>
        <b>[9] or [Mouse Click]:</b> Pause / Resume Game<br><br>
        <em>You can smash pins with the Stone ball! The Beach ball is floaty on water and jumps high!</em><br><br>
        <b>Power-ups (Stage 2+):</b><br>
        🟢 <b>Green (💪):</b> Invincibility (Crush anything, don't sink!)<br>
        🟣 <b>Purple (🪽):</b> Flying (Soar above all obstacles!)<br><br>
        <b> The objective is to survive for the longest amount of time possible and hit as many pins as you can!</b>
    </p>
`);

export const texObj = createModal('tex-modal', 'CHOOSE TEXTURES', `
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

export const setObj = createModal('set-modal', 'SETTINGS', `
    <div style="display:flex; justify-content:space-around; margin: 30px 0;">
        <button id="mmusic-btn" style="padding:10px 20px; font-size:1.2rem; cursor:pointer; background:#00ccff; border:none; border-radius:30px; color:#111; font-weight:bold; box-shadow:0 4px 15px rgba(0,204,255,0.4); transition:all 0.2s ease;">MUSIC: ON</button>
        <button id="msfx-btn" style="padding:10px 20px; font-size:1.2rem; cursor:pointer; background:#00ccff; border:none; border-radius:30px; color:#111; font-weight:bold; box-shadow:0 4px 15px rgba(0,204,255,0.4); transition:all 0.2s ease;">SFX: ON</button>
    </div>
`);

export const creditLeft = document.createElement('div');
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

export const creditRight = document.createElement('div');
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

export const stageText = document.createElement('div');
stageText.style.position = 'absolute';
stageText.style.top = '15%';
stageText.style.left = '50%';
stageText.style.transform = 'translate(-50%, -50%) scale(0.1)';
stageText.style.color = '#ffcc00';
stageText.style.fontSize = '50px';
stageText.style.fontWeight = '900';
stageText.style.fontFamily = '"Arial Black", Arial, sans-serif';
stageText.style.textShadow = '0px 0px 20px rgba(255, 204, 0, 0.8), 4px 4px 10px rgba(0,0,0,0.8)';
stageText.style.pointerEvents = 'none';
stageText.style.opacity = '0';
stageText.style.zIndex = '1000';
stageText.style.textAlign = 'center';
document.body.appendChild(stageText);

export function showStageText(num, nameStr) {
    stageText.innerHTML = `STAGE ${num}<br><span style="font-size: 0.8em; display:block; margin-top:-10px;">${nameStr}</span>`;
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

export const newHighScoreText = document.createElement('div');
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

export function showNewHighScoreText() {
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

export const gameOverText = document.createElement('div');
gameOverText.innerText = "GAME OVER";
gameOverText.style.position = 'absolute';
gameOverText.style.top = '40%';
gameOverText.style.left = '50%';
gameOverText.style.transform = 'translate(-50%, -50%) scale(0.1)';
gameOverText.style.color = '#ff3333'; 
gameOverText.style.fontSize = '100px';
gameOverText.style.fontWeight = '900';
gameOverText.style.fontFamily = '"Arial Black", Arial, sans-serif';
gameOverText.style.textShadow = '0px 0px 20px rgba(255, 51, 51, 0.8), 4px 4px 10px rgba(0,0,0,0.8)';
gameOverText.style.pointerEvents = 'none';
gameOverText.style.opacity = '0';
gameOverText.style.zIndex = '1000';
gameOverText.style.textAlign = 'center';
document.body.appendChild(gameOverText);

export function showGameOverText() {
    gameOverText.style.transition = 'none';
    gameOverText.style.transform = 'translate(-50%, -50%) scale(0.1)';
    gameOverText.style.opacity = '1';
    void gameOverText.offsetWidth;
    gameOverText.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease-out';
    gameOverText.style.transform = 'translate(-50%, -50%) scale(1)';
    
    playTone(150, 'sawtooth', 0.8, 0.04);
    setTimeout(() => playTone(100, 'sawtooth', 1.0, 0.04), 400);
}

export function hideGameOverText() {
    gameOverText.style.opacity = '0';
}