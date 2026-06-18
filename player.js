import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { scene, world, materials, physicsMaterials, groundMat } from './environment.js';
import { state, pools } from './state.js';
import { playTone } from './audio.js';
import * as UI from './ui.js';

export const playerRadius = 1;
export const playerMesh = new THREE.Mesh(new THREE.SphereGeometry(playerRadius, 32, 32), materials.stone);
playerMesh.castShadow = true; playerMesh.visible = false; 
scene.add(playerMesh);

export const playerBody = new CANNON.Body({ mass: 25, shape: new CANNON.Sphere(playerRadius), position: new CANNON.Vec3(0, 5, 0), material: physicsMaterials.ball });
playerBody.linearDamping = 0; playerBody.angularDamping = 0; 
playerBody.collisionFilterGroup = 4;
playerBody.collisionFilterMask = 1;
world.addBody(playerBody);

playerBody.addEventListener('collide', (e) => {
    if (state.gameState !== 'PLAYING') return;
    if (e.body.isPin) {
        if (state.currentForm === 'stone' || state.activePowerUp === 'invincible' || state.activePowerUp === 'flying') {
            e.body.needsShatter = true;
            playTone(250 + Math.random()*50, 'triangle', 0.15, 0.4); 
            setTimeout(() => playTone(150 + Math.random()*50, 'square', 0.15, 0.2), 30);
        } else {
            if (state.gameState !== 'GAMEOVER') {
                state.gameState = 'GAMEOVER'; 
                UI.showGameOverText();
                playerBody.velocity.set(0, 10, 15); 
                UI.UI_Status.innerHTML = "CRASH! Only the Stone ball smashes pins."; UI.UI_Status.style.color = "#ff3333"; UI.scoreHud.style.color = "#ff3333";
            }
        }
    }
});

// Outglow / Wings / Fairy Setup
const auraGeo = new THREE.SphereGeometry(playerRadius * 1.3, 32, 32);
const auraMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
export const auraMesh = new THREE.Mesh(auraGeo, auraMat);
scene.add(auraMesh); auraMesh.visible = false;

export const wingsGroup = new THREE.Group();
const wingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });

export const leftShoulder = new THREE.Group(); leftShoulder.position.set(-0.8, 0, 0); 
const leftUpperArm = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.6), wingMat); leftUpperArm.position.set(-1, 0, 0); leftUpperArm.castShadow = true; leftShoulder.add(leftUpperArm);
export const leftElbow = new THREE.Group(); leftElbow.position.set(-2, 0, 0); 
const leftLowerArm = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.05, 0.8), wingMat); leftLowerArm.position.set(-1.25, 0, 0); leftLowerArm.castShadow = true; leftElbow.add(leftLowerArm);
export const leftWrist = new THREE.Group(); leftWrist.position.set(-2.5, 0, 0); 
const leftHandMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 0.03, 0.6), wingMat); leftHandMesh.position.set(-1, 0, 0); leftHandMesh.castShadow = true; leftWrist.add(leftHandMesh); leftElbow.add(leftWrist);

for(let i=0; i<3; i++) {
    let f = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 1.5), wingMat); f.position.set(-0.5 - i*0.5, -0.1, -0.5); f.rotation.y = -0.2;
    leftLowerArm.add(f.clone()); leftUpperArm.add(f.clone()); leftHandMesh.add(f.clone());
}
leftShoulder.add(leftElbow); wingsGroup.add(leftShoulder);

export const rightShoulder = new THREE.Group(); rightShoulder.position.set(0.8, 0, 0); 
const rightUpperArm = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.6), wingMat); rightUpperArm.position.set(1, 0, 0); rightUpperArm.castShadow = true; rightShoulder.add(rightUpperArm);
export const rightElbow = new THREE.Group(); rightElbow.position.set(2, 0, 0);
const rightLowerArm = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.05, 0.8), wingMat); rightLowerArm.position.set(1.25, 0, 0); rightLowerArm.castShadow = true; rightElbow.add(rightLowerArm);
export const rightWrist = new THREE.Group(); rightWrist.position.set(2.5, 0, 0); 
const rightHandMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 0.03, 0.6), wingMat); rightHandMesh.position.set(1, 0, 0); rightHandMesh.castShadow = true; rightWrist.add(rightHandMesh); rightElbow.add(rightWrist);

for(let i=0; i<3; i++) {
    let f = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 1.5), wingMat); f.position.set(0.5 + i*0.5, -0.1, -0.5); f.rotation.y = 0.2;
    rightLowerArm.add(f.clone()); rightUpperArm.add(f.clone()); rightHandMesh.add(f.clone());
}
rightShoulder.add(rightElbow); wingsGroup.add(rightShoulder);
scene.add(wingsGroup); wingsGroup.visible = false;

export const fairyGroup = new THREE.Group();
const fMat = new THREE.MeshStandardMaterial({ color: 0xccffcc, emissive: 0x22ff22, emissiveIntensity: 0.8 });
fairyGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), fMat).translateY(0.6));
fairyGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.25, 0.6, 8), fMat).translateY(0.2));

export const fLArmBase = new THREE.Group(); fLArmBase.position.set(-0.15, 0.4, 0);
const fLArmUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2), fMat); fLArmUpper.position.set(-0.1, -0.1, 0); fLArmUpper.rotation.z = -0.5; fLArmBase.add(fLArmUpper);
export const fLElbow = new THREE.Group(); fLElbow.position.set(-0.2, -0.2, 0);
const fLArmLower = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2), fMat); fLArmLower.position.set(0, -0.1, 0); fLElbow.add(fLArmLower); fLArmBase.add(fLElbow); fairyGroup.add(fLArmBase);

export const fRArmBase = new THREE.Group(); fRArmBase.position.set(0.15, 0.4, 0);
const fRArmUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2), fMat); fRArmUpper.position.set(0.1, -0.1, 0); fRArmUpper.rotation.z = 0.5; fRArmBase.add(fRArmUpper);
export const fRElbow = new THREE.Group(); fRElbow.position.set(0.2, -0.2, 0);
const fRArmLower = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2), fMat); fRArmLower.position.set(0, -0.1, 0); fRElbow.add(fRArmLower); fRArmBase.add(fRElbow); fairyGroup.add(fRArmBase);

fairyGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), fMat).translateY(-0.2).translateX(-0.1));
fairyGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), fMat).translateY(-0.2).translateX(0.1));

const fWingMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
const fLWing = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 3), fWingMat); fLWing.position.set(-0.2, 0.4, -0.2); fLWing.rotation.set(-Math.PI / 4, 0, -Math.PI / 4); fairyGroup.add(fLWing);
const fRWing = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 3), fWingMat); fRWing.position.set(0.2, 0.4, -0.2); fRWing.rotation.set(-Math.PI / 4, 0, Math.PI / 4); fairyGroup.add(fRWing);

export const fairyOrbit = new THREE.Group(); fairyGroup.position.set(2.5, 0, 0); fairyOrbit.add(fairyGroup); scene.add(fairyOrbit); fairyOrbit.visible = false;

export function activatePowerUp(type) {
    state.activePowerUp = type;
    
    if (type === 'invincible') {
        state.powerUpTimer = 10.0;
        document.getElementById('timer-circle').style.stroke = '#00ff00';
        document.getElementById('timer-text').style.color = '#00ff00';
        document.getElementById('timer-text').style.textShadow = '0px 0px 10px rgba(0,255,0,0.8)';
        wingsGroup.visible = false;
        auraMesh.material.color.setHex(0x00ff00);
        auraMesh.visible = true;
        fairyOrbit.visible = true;
    } else if (type === 'flying') {
        state.powerUpTimer = 8.0;
        document.getElementById('timer-circle').style.stroke = '#aa00ff';
        document.getElementById('timer-text').style.color = '#aa00ff';
        document.getElementById('timer-text').style.textShadow = '0px 0px 10px rgba(170,0,255,0.8)';
        
        let checkZ = Math.floor(playerBody.position.z / 30) * 30;
        while (checkZ > state.nextSpawnZ) {
            let hasFloor = pools.trackTiles.some(t => Math.abs(t.mesh.position.z - checkZ) < 5);
            if (!hasFloor) {
                const tMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 30), groundMat);
                tMesh.position.set(0, -1, checkZ); tMesh.receiveShadow = true; scene.add(tMesh);
                const tBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(new CANNON.Vec3(6, 1, 15.1)), material: physicsMaterials.ground, position: new CANNON.Vec3(0, -1, checkZ) });
                world.addBody(tBody); pools.trackTiles.push({ mesh: tMesh, body: tBody });
            }
            checkZ -= 30;
        }

        auraMesh.material.color.setHex(0xaa00ff);
        auraMesh.visible = true;
        wingsGroup.visible = true;
        fairyOrbit.visible = false; 
        playerBody.velocity.y = 12; // take off
    }
    
    playTone(440, 'square', 0.1, 0.4);
    setTimeout(() => playTone(554, 'square', 0.1, 0.4), 100);
    setTimeout(() => playTone(659, 'square', 0.1, 0.4), 200);
    setTimeout(() => playTone(880, 'square', 0.2, 0.6), 300);
}