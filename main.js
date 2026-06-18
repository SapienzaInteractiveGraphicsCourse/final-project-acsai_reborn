import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { stagesInfo } from './config.js';
import { audioState, setSfxEnabled, setMusicEnabled, getAudioCtx, resumeAudio, playTone } from './audio.js';
import * as UI from './ui.js';
import { state, pools } from './state.js';
import { scene, camera, renderer, world, dayColor, nightColor, ambientLight, dirLight, moonLight, sunMesh, moonMesh, starsPoints, cloudsGroup, starsMat, cloudMat, floorTextures, startingFloorTextures, materials, groundMat, startingGroundMat, menuScene, giantBall, giantPin1, giantPin2, textureLoader, physicsMaterials } from './environment.js';
import { playerRadius, playerMesh, playerBody, auraMesh, wingsGroup, fairyOrbit, fairyGroup, leftShoulder, leftElbow, leftWrist, rightShoulder, rightElbow, rightWrist, fLArmBase, fLElbow, fRArmBase, fRElbow, activatePowerUp } from './player.js';
import { pinShape, pinGeo, stageMats, puddleGeo, splashGeo, windGeo, fpGeo, spawnGate, spawnStartingRunway, spawnScenery, spawnNextChunk } from './level.js';

const windMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });

// ==========================================
// UI BINDINGS & EVENT LISTENERS
// ==========================================

UI.texObj.closeBtn.addEventListener('click', () => {
    const stoneVal = document.getElementById('stone-tex-select').value;
    const beachVal = parseInt(document.getElementById('beach-col-select').value, 16);
    const newTex = textureLoader.load(stoneVal); newTex.colorSpace = THREE.SRGBColorSpace;
    materials.stone.map = newTex; materials.stone.needsUpdate = true;
    materials.beachBall.color.setHex(beachVal); materials.beachBall.needsUpdate = true;
    giantBall.material.color.setHex(beachVal); giantBall.material.needsUpdate = true;
    
    UI.uiState.isModalOpen = false;
    UI.texObj.modal.style.transform = 'translate(-50%, -50%) scale(0)';
});

UI.playerNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        state.playerName = UI.playerNameInput.value.trim() || 'Player';
        UI.playerNameInput.style.display = 'none';
        UI.playerNameInput.blur();
    }
});

UI.howToPlayBtn.addEventListener('click', () => {
    UI.uiState.isModalOpen = true;
    UI.rulesObj.modal.style.transform = 'translate(-50%, -50%) scale(1)';
});

UI.texturesBtn.addEventListener('click', () => {
    UI.uiState.isModalOpen = true;
    UI.texObj.modal.style.transform = 'translate(-50%, -50%) scale(1)';
});

UI.settingsBtn.addEventListener('click', () => {
    UI.uiState.isModalOpen = true;
    UI.setObj.modal.style.transform = 'translate(-50%, -50%) scale(1)';
});

const toggleM = () => { 
    setMusicEnabled(!audioState.musicEnabled); 
    document.getElementById('mmusic-btn').innerText = `MUSIC: ${audioState.musicEnabled?'ON':'OFF'}`;
    UI.pMusicBtn.innerText = `MUSIC: ${audioState.musicEnabled?'ON':'OFF'}`;
};
const toggleS = () => { 
    setSfxEnabled(!audioState.sfxEnabled); 
    document.getElementById('msfx-btn').innerText = `SFX: ${audioState.sfxEnabled?'ON':'OFF'}`;
    UI.pSfxBtn.innerText = `SFX: ${audioState.sfxEnabled?'ON':'OFF'}`;
};
document.getElementById('mmusic-btn').addEventListener('click', toggleM);
UI.pMusicBtn.addEventListener('click', toggleM);
document.getElementById('msfx-btn').addEventListener('click', toggleS);
UI.pSfxBtn.addEventListener('click', toggleS);

function togglePause() {
    if (state.gameState !== 'PLAYING') return;
    state.isPaused = !state.isPaused;
    if (state.isPaused) {
        UI.uiHUD.style.display = 'none';
        UI.scoreHud.style.display = 'none';
        UI.pauseOverlay.style.display = 'flex';
        UI.updatePauseStats();
        
        const pStatus = document.getElementById('pause-status');
        pStatus.innerText = UI.UI_Status.innerText;
        pStatus.style.color = UI.UI_Status.style.color;
    } else {
        UI.uiHUD.style.display = 'block';
        UI.scoreHud.style.display = 'block';
        UI.pauseOverlay.style.display = 'none';
    }
}

UI.resumeBtn.addEventListener('click', togglePause);
UI.abandonBtn.addEventListener('click', () => {
    togglePause();
    state.gameState = 'GAMEOVER';
    state.gameOverTimer = 999; 
});

if (UI.playBtn) UI.playBtn.addEventListener('click', triggerPlayAnimation);

window.addEventListener('mousedown', (e) => {
    resumeAudio();
    if (e.target.tagName.toLowerCase() === 'button' || e.target.tagName.toLowerCase() === 'input' || e.target.closest('#pause-overlay')) return;
    if (state.gameState === 'PLAYING') togglePause();
});

window.addEventListener('keydown', (e) => {
    resumeAudio();
    if (e.key === '9') togglePause();
    if (state.gameState === 'MENU' && (e.key === ' ' || e.key === 'Enter')) {
        if (UI.uiState.isModalOpen || document.activeElement === UI.playerNameInput) return;
        triggerPlayAnimation(); return;
    }

    if (state.gameState !== 'PLAYING' || state.isPaused) return; 

    if (e.key === 'a' || e.key === 'ArrowLeft') state.currentLane--;
    if (e.key === 'd' || e.key === 'ArrowRight') state.currentLane++;
    
    const isGrounded = playerBody.position.y > -0.5 && playerBody.position.y < 2 && Math.abs(playerBody.velocity.y) < 2;
    if ((e.key === 'w' || e.key === ' ' || e.key === 'ArrowUp') && isGrounded && !state.isSinking && state.activePowerUp !== 'flying') {
        if (state.currentForm === 'stone') playerBody.velocity.y = 10;    
        if (state.currentForm === 'beachBall') playerBody.velocity.y = 25; 
    }

    if (e.key === '2') {
        if (state.currentForm === 'stone') {
            state.currentForm = 'beachBall'; playerMesh.material = materials.beachBall; playerBody.mass = 1.5; playerBody.updateMassProperties(); 
            if (isGrounded) { playerBody.position.y = 1.0; playerBody.velocity.y = 0; }
            state.baseSpeed = -35; UI.UI_Status.innerText = "Current Form: Beach Ball (Floaty)"; UI.UI_Status.style.color = "#33ccff"; 
        } else {
            state.currentForm = 'stone'; playerMesh.material = materials.stone; playerBody.mass = 25; playerBody.updateMassProperties(); 
            if (isGrounded) { playerBody.position.y = 1.0; playerBody.velocity.y = 0; }
            state.baseSpeed = -22; UI.UI_Status.innerText = "Current Form: Stone (Heavy)"; UI.UI_Status.style.color = "#aaaaaa"; 
        }
    }
});

window.addEventListener('touchstart', resumeAudio);
window.addEventListener('focus', resumeAudio);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) resumeAudio();
});

// Background Music Loop
let bgmNoteIdx = 0;
setInterval(() => {
    if (!audioState.musicEnabled || state.isPaused || state.gameState !== 'PLAYING') return;
    const ctx = getAudioCtx();
    if (ctx && ctx.state === 'suspended') return;
    
    const t = ctx.currentTime;
    let sOld = stagesInfo[state.oldStageIdx];
    let sNew = stagesInfo[state.currentStageIdx];
    
    let freqOld = sOld.notes[bgmNoteIdx % sOld.notes.length];
    let freqNew = sNew.notes[bgmNoteIdx % sNew.notes.length];
    
    let gainOld = (1.0 - state.transitionProgress) * 0.12;
    let gainNew = state.transitionProgress * 0.12;

    if (gainOld > 0.005) {
        let oscOld = ctx.createOscillator(); let gOld = ctx.createGain();
        oscOld.type = sOld.wave; oscOld.frequency.setValueAtTime(freqOld, t);
        gOld.gain.setValueAtTime(gainOld, t); gOld.gain.linearRampToValueAtTime(0.01, t + 0.3);
        oscOld.connect(gOld); gOld.connect(ctx.destination); oscOld.start(t); oscOld.stop(t + 0.3);
    }
    
    if (gainNew > 0.005) {
        let oscNew = ctx.createOscillator(); let gNew = ctx.createGain();
        oscNew.type = sNew.wave; oscNew.frequency.setValueAtTime(freqNew, t);
        gNew.gain.setValueAtTime(gainNew, t); gNew.gain.linearRampToValueAtTime(0.01, t + 0.3);
        oscNew.connect(gNew); gNew.connect(ctx.destination); oscNew.start(t); oscNew.stop(t + 0.3);
    }
    bgmNoteIdx++;
}, 300);

// ==========================================
// CORE GAME LOGIC
// ==========================================

function startStageTransition() {
    state.oldStageIdx = state.currentStageIdx;
    state.currentStageIdx = (state.currentStageIdx + 1) % stagesInfo.length;
    state.transitionProgress = 0.0;
}

function triggerPlayAnimation() {
    if (state.isTransitioning) return;
    state.isTransitioning = true;
    
    state.playerName = UI.playerNameInput.value.trim() || 'Player';
    const ctx = getAudioCtx(); if (ctx && ctx.state === 'suspended') ctx.resume();
    
    for(let i = 0; i < 20; i++) {
        const pMesh = new THREE.Mesh(pinGeo, stageMats[0].pin); pMesh.castShadow = true; pMesh.receiveShadow = true; scene.add(pMesh);
        const pBody = new CANNON.Body({ mass: 1, material: physicsMaterials.obstacle });
        pBody.collisionFilterGroup = 8; pBody.collisionFilterMask = 1; 
        const qY = new CANNON.Quaternion(); qY.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        pBody.addShape(pinShape, new CANNON.Vec3(0, 0, 0), qY);
        pBody.position.set((Math.random() - 0.5) * 20, 5 + Math.random() * 10, -30 - Math.random() * 10);
        pBody.velocity.set((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20 + 10, 40 + Math.random() * 30);
        pBody.angularVelocity.set(Math.random() * 10, Math.random() * 10, Math.random() * 10);
        world.addBody(pBody); pools.debrisList.push({ mesh: pMesh, body: pBody, spawnTime: state.gameElapsedTime }); 
    }

    if (UI.playBtn) { UI.playBtn.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'; UI.playBtn.style.transform = 'scale(1.5, 0.1)'; UI.playBtn.style.opacity = '0'; }
    if (UI.howToPlayBtn) { UI.howToPlayBtn.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'; UI.howToPlayBtn.style.transform = 'scale(1.5, 0.1)'; UI.howToPlayBtn.style.opacity = '0'; }
    if (UI.texturesBtn) { UI.texturesBtn.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'; UI.texturesBtn.style.transform = 'scale(1.5, 0.1)'; UI.texturesBtn.style.opacity = '0'; }
    if (UI.settingsBtn) { UI.settingsBtn.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'; UI.settingsBtn.style.transform = 'scale(1.5, 0.1)'; UI.settingsBtn.style.opacity = '0'; }
    if (UI.startHintText) { UI.startHintText.style.transition = 'opacity 0.3s ease'; UI.startHintText.style.opacity = '0'; }
    if (UI.playerNameInput) { UI.playerNameInput.style.transition = 'opacity 0.3s ease'; UI.playerNameInput.style.opacity = '0'; }
    
    setTimeout(() => {
        if (UI.playBtn) { UI.playBtn.style.transition = 'none'; UI.playBtn.style.transform = 'scale(1)'; UI.playBtn.style.opacity = '1'; }
        if (UI.howToPlayBtn) { UI.howToPlayBtn.style.transition = 'transform 0.15s ease-out'; UI.howToPlayBtn.style.transform = 'scale(1)'; UI.howToPlayBtn.style.opacity = '1'; }
        if (UI.texturesBtn) { UI.texturesBtn.style.transition = 'transform 0.15s ease-out'; UI.texturesBtn.style.transform = 'scale(1)'; UI.texturesBtn.style.opacity = '1'; }
        if (UI.settingsBtn) { UI.settingsBtn.style.transition = 'transform 0.15s ease-out'; UI.settingsBtn.style.transform = 'scale(1)'; UI.settingsBtn.style.opacity = '1'; }
        if (UI.startHintText) { UI.startHintText.style.transition = 'none'; UI.startHintText.style.opacity = '0.8'; }
        if (UI.playerNameInput) { UI.playerNameInput.style.transition = 'none'; UI.playerNameInput.style.opacity = '1'; }
        resetGame(); state.isTransitioning = false;
    }, 1200);
}

function resetGame() {
    UI.hideGameOverText(); UI.creditLeft.style.display = 'none'; UI.creditRight.style.display = 'none';
    UI.rulesObj.modal.style.transform = 'translate(-50%, -50%) scale(0)'; UI.texObj.modal.style.transform = 'translate(-50%, -50%) scale(0)';
    UI.setObj.modal.style.transform = 'translate(-50%, -50%) scale(0)'; UI.pauseOverlay.style.display = 'none';
    UI.uiState.isModalOpen = false; state.sinkTarget = null; state.currentScore = 0; state.hasReachedNewHighScore = false; state.activePowerUp = null; state.powerUpTimer = 0;
    
    materials.stone.emissive.setHex(0x000000); materials.beachBall.emissive.setHex(0x000000);
    auraMesh.visible = false; wingsGroup.visible = false; fairyOrbit.visible = false; 
    
    pools.trackTiles.forEach(t => { scene.remove(t.mesh); world.removeBody(t.body); }); pools.trackTiles.length = 0;
    pools.obstacles.forEach(o => { scene.remove(o.mesh); world.removeBody(o.body); }); pools.obstacles.length = 0;
    pools.puddles.forEach(p => { scene.remove(p.group); p.mirror.dispose(); }); pools.puddles.length = 0;
    pools.debrisList.forEach(d => { scene.remove(d.mesh); world.removeBody(d.body); }); pools.debrisList.length = 0;
    pools.splashParticles.forEach(sp => { scene.remove(sp.mesh); }); pools.splashParticles.length = 0;
    pools.windParticles.forEach(wp => { scene.remove(wp.mesh); }); pools.windParticles.length = 0;
    pools.sceneryParticles.forEach(sp => { scene.remove(sp.mesh); }); pools.sceneryParticles.length = 0;
    pools.powerups.forEach(pu => { scene.remove(pu.mesh); }); pools.powerups.length = 0;
    pools.sceneryList.forEach(sc => scene.remove(sc.mesh)); pools.sceneryList.length = 0;
    pools.gates.forEach(g => { scene.remove(g.group); world.removeBody(g.leftPillarBody); world.removeBody(g.rightPillarBody); }); pools.gates.length = 0;
    pools.floorParticles.forEach(fp => scene.remove(fp.mesh)); pools.floorParticles.length = 0;

    state.currentStageIdx = 0; state.trackStageIdx = 0; state.transitionProgress = 1.0;
    dayColor.setHex(stagesInfo[0].bgDay); nightColor.setHex(stagesInfo[0].bgNight);
    
    groundMat.map = floorTextures[0]; startingGroundMat.map = startingFloorTextures[0]; groundMat.needsUpdate = true; startingGroundMat.needsUpdate = true;
    groundMat.color.setHex(stagesInfo[0].floorCol); groundMat.roughness = stagesInfo[0].floorRough;
    startingGroundMat.color.setHex(stagesInfo[0].floorCol); startingGroundMat.roughness = stagesInfo[0].floorRough;
    scene.fog.near = 100; scene.fog.far = 500;

    spawnStartingRunway();
    state.currentLane = 0; state.nextSpawnZ = -165; state.nextGateZ = -1000; state.survivalTime = 0; state.pinsSmashed = 0; state.distanceTraveled = 0; state.gameOverTimer = 0; state.isSinking = false; state.gatesPassed = 0;
    state.currentForm = 'beachBall'; playerMesh.material = materials.beachBall; playerMesh.scale.set(1,1,1);
    
    materials.stone.transparent = false; materials.stone.opacity = 1.0; materials.beachBall.transparent = false; materials.beachBall.opacity = 1.0;
    state.baseSpeed = -35; state.forwardSpeed = -35; playerBody.mass = 1.5; playerBody.updateMassProperties(); 
    
    playerBody.type = CANNON.Body.DYNAMIC; playerBody.collisionFilterGroup = 4; playerBody.collisionFilterMask = 1;
    playerBody.position.set(0, 5, 0); playerBody.velocity.set(0,0,0); playerBody.angularVelocity.set(0,0,0);
    
    state.isPaused = false;
    UI.UI_Status.innerText = "Current Form: Beach Ball (Floaty)"; UI.UI_Status.style.color = "#33ccff"; UI.scoreHud.style.color = "#fff";
    UI.uiHUD.style.display = 'block'; UI.scoreHud.style.display = 'block'; UI.mainMenu.style.display = 'none';
    menuScene.visible = false; playerMesh.visible = true; state.gameState = 'PLAYING';
    UI.showStageText(1, stagesInfo[0].name);
}

spawnStartingRunway(); 

const clock = new THREE.Clock();
const cycleSpeed = 0.3; 

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    
    if (state.isPaused) { renderer.render(scene, camera); return; }
    
    state.gameElapsedTime += delta;
    
    world.step(1/60, delta, 3);

    if (state.gameState !== 'MENU') {
        playerMesh.position.copy(playerBody.position); 
        playerMesh.quaternion.copy(playerBody.quaternion);
    }

    if (state.gameState === 'PLAYING') {
        state.survivalTime += delta;
        state.distanceTraveled = Math.floor(Math.max(0, -playerBody.position.z));
        
        const speedMultiplier = Math.min(2.0, 1.0 + (state.distanceTraveled / 3000));
        state.forwardSpeed = state.baseSpeed * speedMultiplier;
        state.currentScore = (state.survivalTime * 10) + state.distanceTraveled + (state.pinsSmashed * 50);
        
        if (state.highScore.score > 0 && state.currentScore > state.highScore.score && !state.hasReachedNewHighScore) {
            state.hasReachedNewHighScore = true; UI.showNewHighScoreText();
        }

        if (state.transitionProgress < 1.0) {
            state.transitionProgress += delta * 0.5;
            if (state.transitionProgress >= 1.0) {
                state.transitionProgress = 1.0; scene.fog.near = 100; scene.fog.far = 500;
                groundMat.map = floorTextures[state.currentStageIdx]; groundMat.needsUpdate = true;
            } else {
                const fogBump = Math.sin(state.transitionProgress * Math.PI);
                scene.fog.near = THREE.MathUtils.lerp(100, 20, fogBump); scene.fog.far = THREE.MathUtils.lerp(500, 80, fogBump);
                if (state.transitionProgress > 0.5 && groundMat.map !== floorTextures[state.currentStageIdx]) {
                    groundMat.map = floorTextures[state.currentStageIdx]; groundMat.needsUpdate = true;
                }
            }
            
            const sOld = stagesInfo[state.oldStageIdx]; const sNew = stagesInfo[state.currentStageIdx];
            dayColor.copy(new THREE.Color(sOld.bgDay).lerp(new THREE.Color(sNew.bgDay), state.transitionProgress));
            nightColor.copy(new THREE.Color(sOld.bgNight).lerp(new THREE.Color(sNew.bgNight), state.transitionProgress));
            groundMat.color.copy(new THREE.Color(sOld.floorCol).lerp(new THREE.Color(sNew.floorCol), state.transitionProgress));
            groundMat.roughness = THREE.MathUtils.lerp(sOld.floorRough, sNew.floorRough, state.transitionProgress);
        }
        
        const sCur = stagesInfo[state.currentStageIdx];
        const isGrounded = playerBody.position.y > -0.5 && playerBody.position.y < 2 && Math.abs(playerBody.velocity.y) < 2;
        
        if (sCur.trail && isGrounded && !state.isSinking && state.activePowerUp !== 'flying') {
            if (Math.random() < 0.4) {
                const fp = new THREE.Mesh(fpGeo, new THREE.MeshBasicMaterial({ color: sCur.trailCol, transparent: true, opacity: 0.8 }));
                fp.position.set(playerBody.position.x + (Math.random()-0.5)*0.5, 0.2, playerBody.position.z + 1.0);
                scene.add(fp); pools.floorParticles.push({ mesh: fp, age: 0 });
            }
        }
        
        for (let i = pools.floorParticles.length - 1; i >= 0; i--) {
            let fp = pools.floorParticles[i]; fp.age += delta; fp.mesh.position.y += 2 * delta;
            let s = Math.max(0, 1.0 - (fp.age / 0.5)); fp.mesh.scale.set(s, s, s);
            if (fp.age > 0.5) { scene.remove(fp.mesh); pools.floorParticles.splice(i, 1); }
        }
        
        if (state.activePowerUp) {
            state.powerUpTimer -= delta;
            UI.timerUI.style.display = 'flex';
            const maxTime = state.activePowerUp === 'invincible' ? 10.0 : 8.0;
            const pct = Math.max(0, state.powerUpTimer / maxTime);
            document.getElementById('timer-circle').style.strokeDashoffset = 157 - (157 * pct);
            document.getElementById('timer-text').innerText = Math.ceil(state.powerUpTimer);
            
            if (state.powerUpTimer <= 0) {
                if (state.activePowerUp === 'invincible') { auraMesh.visible = false; fairyOrbit.visible = false; } 
                else if (state.activePowerUp === 'flying') { auraMesh.visible = false; wingsGroup.visible = false; }
                state.activePowerUp = null; playTone(300, 'sine', 0.2, 0.3);
            } else {
                auraMesh.position.copy(playerBody.position);
                if (state.activePowerUp === 'invincible') {
                    fairyOrbit.visible = true; fairyOrbit.position.copy(playerMesh.position); fairyOrbit.rotation.y = state.gameElapsedTime * 2; fairyGroup.position.y = Math.sin(state.gameElapsedTime * 3) * 0.4; 
                    fLArmBase.rotation.x = Math.sin(state.gameElapsedTime * 5) * 0.5; fLElbow.rotation.x = Math.sin(state.gameElapsedTime * 5 - 1) * 0.5;
                    fRArmBase.rotation.x = Math.sin(state.gameElapsedTime * 5 + Math.PI) * 0.5; fRElbow.rotation.x = Math.sin(state.gameElapsedTime * 5 + Math.PI - 1) * 0.5;
                }
                if (state.activePowerUp === 'flying') {
                    playerBody.position.y = THREE.MathUtils.lerp(playerBody.position.y, 8, 4 * delta); playerBody.velocity.y = 0;
                    wingsGroup.position.copy(playerBody.position); const t = state.gameElapsedTime * 12;
                    leftShoulder.rotation.z = Math.sin(t) * 0.5 + 0.2; leftElbow.rotation.z = Math.sin(t - 0.5) * 0.5 + 0.1; leftWrist.rotation.z = Math.sin(t - 1.0) * 0.5 + 0.1;
                    rightShoulder.rotation.z = -Math.sin(t) * 0.5 - 0.2; rightElbow.rotation.z = -Math.sin(t - 0.5) * 0.5 - 0.1; rightWrist.rotation.z = -Math.sin(t - 1.0) * 0.5 - 0.1;
                    if (Math.random() < 0.6) {
                        let wp = new THREE.Mesh(windGeo, windMat); wp.position.set(playerBody.position.x + (Math.random()-0.5)*4, playerBody.position.y + (Math.random()-0.5)*2, playerBody.position.z + 1.5);
                        scene.add(wp); pools.windParticles.push({mesh: wp, age: 0});
                    }
                }
            }
        } else {
            UI.timerUI.style.display = 'none'; auraMesh.visible = false; fairyOrbit.visible = false;
        }

        for (let i = pools.powerups.length - 1; i >= 0; i--) {
            let pu = pools.powerups[i]; pu.mesh.rotation.y += 2 * delta; pu.mesh.position.y = 1 + Math.sin(state.gameElapsedTime * 5 + pu.x) * 0.3;
            if (pu.z > playerMesh.position.z + 20) { scene.remove(pu.mesh); pools.powerups.splice(i, 1); } 
            else if (Math.abs(playerBody.position.z - pu.z) < 2.0 && Math.abs(playerBody.position.x - pu.x) < 2.0 && playerBody.position.y < 3.0) {
                activatePowerUp(pu.type); scene.remove(pu.mesh); pools.powerups.splice(i, 1);
            }
        }
        
        let speedText = speedMultiplier > 1.1 ? `<br><span style="color:#808080">x${speedMultiplier.toFixed(1)} SPEED!</span>` : "";
        UI.scoreHud.innerHTML = `High Score: <span style="color:#00ccff">${Math.floor(state.highScore.score)}</span><br>Player: <span style="color:#ffeb3b">${state.playerName}</span><br>Score: <span style="color:#00ccff">${Math.floor(state.currentScore)}</span><br>Time: <span style="color:#00e676">${state.survivalTime.toFixed(1)}s</span><br>Dist: <span style="color:#00e676">${state.distanceTraveled}m</span><br>Pins: <span style="color:#ffcc00">${state.pinsSmashed}</span>${speedText}`;
    }

    const theta = state.gameElapsedTime * cycleSpeed; const skyRadius = 150; const skyCenterZ = state.gameState === 'MENU' ? 0 : playerMesh.position.z;
    sunMesh.position.set(Math.cos(theta) * skyRadius, Math.sin(theta) * skyRadius, skyCenterZ - 200); 
    moonMesh.position.set(Math.cos(theta + Math.PI) * skyRadius, Math.sin(theta + Math.PI) * skyRadius, skyCenterZ - 200);
    sunMesh.material.transparent = true; moonMesh.material.transparent = true;
    sunMesh.material.opacity = Math.max(0, Math.min(1, Math.sin(theta) * 5)); moonMesh.material.opacity = Math.max(0, Math.min(1, Math.sin(theta + Math.PI) * 5));
    starsPoints.position.z = skyCenterZ; cloudsGroup.position.z = skyCenterZ; cloudsGroup.rotation.y += 0.05 * delta;
    const dayFactor = Math.max(0, Math.min(1, Math.sin(theta) * 2 + 0.5));
    const tgtPos = state.gameState === 'MENU' ? menuScene.position : playerMesh.position; const tgtObj = state.gameState === 'MENU' ? giantBall : playerMesh;

    dirLight.intensity = Math.max(0, Math.sin(theta)) * 1.5; dirLight.position.copy(tgtPos).add(new THREE.Vector3().copy(sunMesh.position).sub(tgtPos).normalize().multiplyScalar(60)); dirLight.target = tgtObj;
    moonLight.intensity = Math.max(0, Math.sin(theta + Math.PI)) * 0.2; moonLight.position.copy(tgtPos).add(new THREE.Vector3().copy(moonMesh.position).sub(tgtPos).normalize().multiplyScalar(60)); moonLight.target = tgtObj;
    ambientLight.intensity = 0.4 + dayFactor * 0.4; scene.background.copy(nightColor).lerp(dayColor, dayFactor); scene.fog.color.copy(scene.background); 
    starsMat.opacity = 1.0 - dayFactor; cloudMat.opacity = dayFactor * 0.9;

    if (state.gameState === 'MENU') {
        giantBall.rotation.x += 1.5 * delta; giantBall.rotation.y += 0.5 * delta;
        if (giantPin1.visible) { giantPin1.rotation.y -= 1 * delta; giantPin2.rotation.y += 1 * delta; }
        camera.position.set(0, 5, 5); camera.lookAt(menuScene.position);
        if (state.isTransitioning) {
            for (let i = pools.debrisList.length - 1; i >= 0; i--) {
                let d = pools.debrisList[i]; d.mesh.position.copy(d.body.position); d.mesh.quaternion.copy(d.body.quaternion);
            }
        }
    } else if (state.gameState === 'PLAYING') {
        if (state.activePowerUp !== 'flying') { playerBody.velocity.z = state.forwardSpeed; } 
        else { playerBody.velocity.z = state.forwardSpeed * 1.2; }
        
        let targetX = 0;
        if (state.currentLane <= -2) targetX = -12; else if (state.currentLane >= 2) targetX = 12; else targetX = state.currentLane * 3;
        
        playerBody.velocity.x = (targetX - playerBody.position.x) * 10; 
        playerBody.angularVelocity.x = playerBody.velocity.z / playerRadius; playerBody.angularVelocity.z = -playerBody.velocity.x / playerRadius;

        while (state.nextSpawnZ > playerBody.position.z - 300) spawnNextChunk();

        if (playerBody.position.y < -5) {
            if (state.gameState !== 'GAMEOVER') {
                state.gameState = 'GAMEOVER'; UI.showGameOverText(); UI.UI_Status.innerHTML = "GAME OVER!<br>You fell into the abyss!"; UI.UI_Status.style.color = "#ff3333"; UI.scoreHud.style.color = "#ff3333";
            }
        }

        for (let i = pools.puddles.length - 1; i >= 0; i--) {
            let p = pools.puddles[i];
            if (p.z > playerMesh.position.z + 20) { scene.remove(p.group); p.mirror.dispose(); pools.puddles.splice(i, 1); } 
            else if (playerBody.position.z < p.z + 6.0 && playerBody.position.z > p.z - 6.0 && Math.abs(playerBody.position.x - p.x) < 2.0 && playerBody.position.y < 1.5) {
                if (state.activePowerUp === 'invincible' || state.currentForm === 'beachBall') {
                    if (Math.random() < 0.6) {
                        playTone(400 + Math.random()*300, 'triangle', 0.1, 0.2);
                        for(let k=0; k<6; k++) {
                           let sp = new THREE.Mesh(splashGeo, stageMats[p.stageIdx].splash); sp.position.set(playerBody.position.x + (Math.random()-0.5)*3, 0.2, playerBody.position.z + (Math.random()-0.5)*3);
                           scene.add(sp); pools.splashParticles.push({mesh: sp, vx: (Math.random()-0.5)*8, vy: 6 + Math.random()*6, vz: (Math.random()-0.5)*8 + playerBody.velocity.z, age: 0});
                        }
                    }
                } else {
                    if (state.gameState !== 'GAMEOVER') {
                        state.gameState = 'GAMEOVER'; state.isSinking = true; state.sinkTarget = { x: p.x, y: -3, z: p.z - 8 }; 
                        UI.showGameOverText(); playTone(100, 'sine', 1.0, 0.5); 
                        UI.UI_Status.innerHTML = "GLUB GLUB... You sank!"; UI.UI_Status.style.color = "#ff3333"; UI.scoreHud.style.color = "#ff3333"; 
                        playerBody.type = CANNON.Body.KINEMATIC; playerBody.velocity.set(0, 0, 0); playerBody.angularVelocity.set(0, 2, 0);
                        playerBody.collisionFilterGroup = 0; playerBody.collisionFilterMask = 0;
                    }
                }
            }
        }

    } else if (state.gameState === 'GAMEOVER') {
        state.gameOverTimer += delta;
        if (state.isSinking && state.sinkTarget) {
            const dx = state.sinkTarget.x - playerBody.position.x; const dy = state.sinkTarget.y - playerBody.position.y; const dz = state.sinkTarget.z - playerBody.position.z;
            playerBody.velocity.set(dx * 0.5, dy * 0.5, dz * 0.5);
            playerMesh.material.transparent = true; playerMesh.material.opacity = Math.max(0, playerMesh.material.opacity - delta * 0.5); 
        }

        if (state.gameOverTimer > 1.5) {
            if (state.currentScore > state.highScore.score) {
                state.highScore = { score: state.currentScore, time: state.survivalTime, distance: state.distanceTraveled, pins: state.pinsSmashed, player: state.playerName };
            }
            const badgeHtml = state.hasReachedNewHighScore ? `<span class="new-score-badge">NEW!</span>` : "";
            const hsName = state.highScore.player ? ` (${state.highScore.player})` : "";
            
            UI.highScoreMenuText.innerHTML = `High Score: <span style="color:#00ccff">${Math.floor(state.highScore.score)}${hsName}</span> | <span style="color:#00e676">${state.highScore.time.toFixed(1)}s</span> | <span style="color:#00e676">${state.highScore.distance}m</span> | <span style="color:#ffcc00">${state.highScore.pins}</span> Pins ${badgeHtml}`;
            UI.latestScoreText.innerHTML = `Latest Score: <span style="color:#00ccff">${Math.floor(state.currentScore)}</span> | <span style="color:#00e676">${state.survivalTime.toFixed(1)}s</span> | <span style="color:#00e676">${state.distanceTraveled}m</span> | <span style="color:#ffcc00">${state.pinsSmashed}</span> Pins`;
            
            UI.creditLeft.style.display = 'block'; UI.creditRight.style.display = 'block'; UI.hideGameOverText(); UI.timerUI.style.display = 'none';
            materials.stone.emissive.setHex(0x000000); materials.beachBall.emissive.setHex(0x000000);
            
            pools.trackTiles.forEach(t => { scene.remove(t.mesh); world.removeBody(t.body); }); pools.trackTiles.length = 0;
            pools.obstacles.forEach(o => { scene.remove(o.mesh); world.removeBody(o.body); }); pools.obstacles.length = 0;
            pools.puddles.forEach(p => { scene.remove(p.group); p.mirror.dispose(); }); pools.puddles.length = 0;
            pools.debrisList.forEach(d => { scene.remove(d.mesh); world.removeBody(d.body); }); pools.debrisList.length = 0;
            pools.splashParticles.forEach(sp => { scene.remove(sp.mesh); }); pools.splashParticles.length = 0;
            pools.windParticles.forEach(wp => { scene.remove(wp.mesh); }); pools.windParticles.length = 0;
            pools.sceneryParticles.forEach(sp => { scene.remove(sp.mesh); }); pools.sceneryParticles.length = 0;
            pools.powerups.forEach(pu => { scene.remove(pu.mesh); }); pools.powerups.length = 0;
            pools.sceneryList.forEach(sc => { scene.remove(sc.mesh); }); pools.sceneryList.length = 0;
            pools.gates.forEach(g => { scene.remove(g.group); world.removeBody(g.leftPillarBody); world.removeBody(g.rightPillarBody); }); pools.gates.length = 0;
            pools.floorParticles.forEach(fp => { scene.remove(fp.mesh); }); pools.floorParticles.length = 0;
            
            spawnStartingRunway();

            UI.uiHUD.style.display = 'none'; UI.scoreHud.style.display = 'none'; UI.mainMenu.style.display = 'flex';
            menuScene.visible = true; playerMesh.visible = false; state.gameState = 'MENU'; UI.playerNameInput.style.display = 'block'; UI.playerNameInput.style.opacity = '1';
        }
    }

    if (state.gameState !== 'MENU') {
        
        for(let i = pools.splashParticles.length - 1; i >= 0; i--) {
            let sp = pools.splashParticles[i]; sp.age += delta; sp.vy -= 15 * delta; sp.mesh.position.x += sp.vx * delta; sp.mesh.position.y += sp.vy * delta; sp.mesh.position.z += sp.vz * delta; sp.mesh.material.opacity = 1.0 - (sp.age / 0.5);
            if (sp.age > 0.5) { scene.remove(sp.mesh); pools.splashParticles.splice(i, 1); }
        }

        for(let i = pools.windParticles.length - 1; i >= 0; i--) {
            let wp = pools.windParticles[i]; wp.age += delta; wp.mesh.position.z += 60 * delta; let s = Math.max(0, 1.0 - (wp.age / 0.4)); wp.mesh.scale.set(s, s, s);
            if (wp.age > 0.4) { scene.remove(wp.mesh); pools.windParticles.splice(i, 1); }
        }
        
        for (let i = pools.trackTiles.length - 1; i >= 0; i--) {
            let t = pools.trackTiles[i];
            if (t.body.position.z > playerMesh.position.z + 150) { scene.remove(t.mesh); world.removeBody(t.body); pools.trackTiles.splice(i, 1); }
        }

        const tAnim = state.gameElapsedTime;
        for (let i = pools.sceneryList.length - 1; i >= 0; i--) {
            let sc = pools.sceneryList[i];
            if (sc.mesh.position.z > playerMesh.position.z + 150) {
                scene.remove(sc.mesh); pools.sceneryList.splice(i, 1);
            } else {
                let off = sc.offset;
                if (sc.stage === 0) {
                    let scaleVal = 1 + Math.sin(tAnim * 1.5 + off) * 0.4; sc.mesh.scale.set(scaleVal, scaleVal, scaleVal);
                } else if (sc.stage === 1) { 
                    let scaleY = 1 + Math.abs(Math.sin(tAnim * 3 + off)) * 0.8; sc.mesh.scale.y = scaleY; sc.mesh.position.y = sc.origY * scaleY;
                } else if (sc.stage === 2) { 
                    sc.mesh.rotation.z = Math.sin(tAnim * 2 + off) * 0.15; sc.mesh.rotation.x = Math.cos(tAnim * 2.5 + off) * 0.1;
                    if (Math.random() < 0.05) {
                        let leaf = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.2), new THREE.MeshBasicMaterial({color: 0x228b22})); leaf.position.set(sc.mesh.position.x + (Math.random()-0.5)*3, sc.mesh.position.y + 4, sc.mesh.position.z + (Math.random()-0.5)*3);
                        scene.add(leaf); pools.sceneryParticles.push({mesh: leaf, type: 'leaf', age: 0});
                    }
                } else if (sc.stage === 3) { 
                    sc.lArm.rotation.x = Math.sin(tAnim * 3 + off) * 1.5; sc.rArm.rotation.x = -Math.sin(tAnim * 3 + off) * 1.5;
                } else if (sc.stage === 4) { 
                    if (Math.random() < 0.1) {
                        let lava = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshBasicMaterial({color: 0xff3300})); lava.position.set(sc.mesh.position.x, sc.mesh.position.y + 5, sc.mesh.position.z);
                        scene.add(lava); pools.sceneryParticles.push({mesh: lava, type: 'lava', vx: (Math.random()-0.5)*4, vy: 5 + Math.random()*5, vz: (Math.random()-0.5)*4, age: 0});
                    }
                } else if (sc.stage === 5) { 
                    sc.mesh.rotation.y += delta * 2;
                } else if (sc.stage === 6) { 
                    let scale = 0.3 + 0.7 * Math.abs(Math.sin(tAnim * 2 + off)); sc.umbrellaTop.scale.set(scale, 1, scale);
                } else if (sc.stage === 7) { 
                    sc.mesh.position.y = sc.origY + Math.sin(tAnim * 1.5 + off) * 2.0;
                } else if (sc.stage === 8) { 
                    sc.mesh.rotation.y += delta; sc.mesh.children[1].rotation.x += delta * 2;
                } else if (sc.stage === 9) { 
                    sc.mesh.position.y = sc.origY + Math.abs(Math.sin(tAnim * 4 + off)) * 2;
                } else if (sc.stage === 10) { 
                    sc.mesh.position.y = sc.origY + Math.sin(tAnim * 2 + off) * 1.0; sc.mesh.rotation.y += delta * 1.5;
                }
            }
        }

        for (let i = pools.sceneryParticles.length - 1; i >= 0; i--) {
            let p = pools.sceneryParticles[i]; p.age += delta;
            if (p.type === 'leaf') {
                p.mesh.position.y -= 2 * delta; p.mesh.rotation.x += delta; p.mesh.rotation.y += delta;
                if (p.age > 2.0 || p.mesh.position.y < 0) { scene.remove(p.mesh); pools.sceneryParticles.splice(i, 1); }
            } else if (p.type === 'lava') {
                p.vy -= 15 * delta; p.mesh.position.x += p.vx * delta; p.mesh.position.y += p.vy * delta; p.mesh.position.z += p.vz * delta;
                if (p.age > 1.5 || p.mesh.position.y < 0) { scene.remove(p.mesh); pools.sceneryParticles.splice(i, 1); }
            }
        }

        for (let i = pools.gates.length - 1; i >= 0; i--) {
            let g = pools.gates[i]; let distToGate = playerBody.position.z - g.zPos; 
            if (distToGate < 80 && distToGate > -20) {
                if (!g.soundPlayed) { playTone(200, 'triangle', 0.5, 0.3); g.soundPlayed = true; startStageTransition(); }
                g.opened = true;
            }
            if (!g.passed && distToGate < 0 && state.gameState === 'PLAYING') { 
                g.passed = true; state.gatesPassed++; UI.showStageText(state.gatesPassed + 1, stagesInfo[state.currentStageIdx].name);
                playTone(440, 'square', 0.1, 0.2); setTimeout(() => playTone(554, 'square', 0.1, 0.2), 100); setTimeout(() => playTone(659, 'square', 0.2, 0.3), 200);
            }
            if (g.opened) { g.leftPivot.rotation.y = THREE.MathUtils.lerp(g.leftPivot.rotation.y, -Math.PI / 2, 3 * delta); g.rightPivot.rotation.y = THREE.MathUtils.lerp(g.rightPivot.rotation.y, Math.PI / 2, 3 * delta); }
            if (g.zPos > playerMesh.position.z + 150) { scene.remove(g.group); world.removeBody(g.leftPillarBody); world.removeBody(g.rightPillarBody); pools.gates.splice(i, 1); }
        }

        for (let i = pools.obstacles.length - 1; i >= 0; i--) {
            let obs = pools.obstacles[i];
            if (obs.body.position.z > playerMesh.position.z + 20) {
                scene.remove(obs.mesh); world.removeBody(obs.body); pools.obstacles.splice(i, 1);
            } else if (obs.body.needsShatter) {
                scene.remove(obs.mesh); world.removeBody(obs.body); pools.obstacles.splice(i, 1); state.pinsSmashed++;
                for(let j=0; j<5; j++) {
                    const dMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), stageMats[obs.stageIdx].pin); dMesh.castShadow = true; dMesh.receiveShadow = true; scene.add(dMesh);
                    const dBody = new CANNON.Body({ mass: 0.5, shape: new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25)) }); dBody.collisionFilterGroup = 8; dBody.collisionFilterMask = 1;
                    dBody.position.copy(obs.body.position); dBody.position.x += (Math.random() - 0.5) * 0.5; dBody.position.y += Math.random();
                    dBody.velocity.set((Math.random() - 0.5) * 20, Math.random() * 15 + 5, playerBody.velocity.z + (Math.random() - 0.5) * 15);
                    world.addBody(dBody); pools.debrisList.push({ mesh: dMesh, body: dBody, spawnTime: state.gameElapsedTime });
                }
            } else {
                obs.mesh.position.copy(obs.body.position); obs.mesh.quaternion.copy(obs.body.quaternion);
            }
        }

        const currentTime = state.gameElapsedTime;
        for(let i = pools.debrisList.length - 1; i >= 0; i--) {
            let d = pools.debrisList[i]; d.mesh.position.copy(d.body.position); d.mesh.quaternion.copy(d.body.quaternion);
            if (currentTime - d.spawnTime > 1.5) { scene.remove(d.mesh); world.removeBody(d.body); pools.debrisList.splice(i, 1); }
        }

        camera.position.x = 0; 
        camera.position.y = state.isSinking ? camera.position.y : playerMesh.position.y + 4;
        camera.position.z = playerMesh.position.z + 10; 
        camera.lookAt(new THREE.Vector3(playerMesh.position.x * 0.5, state.isSinking ? 0 : playerMesh.position.y, playerMesh.position.z - 10));
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();