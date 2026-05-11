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
// 3. TEXTURES & GAME STATE
// ==========================================
let gameState = 'MENU'; 
let currentForm = 'stone'; 
let isSinking = false;

let survivalTime = 0;
let pinsSmashed = 0;
let distanceTraveled = 0;
let gameOverTimer = 0;

const uiHUD = document.getElementById('ui');
const mainMenu = document.getElementById('main-menu');
const playBtn = document.getElementById('play-btn');
const latestScoreText = document.getElementById('latest-score');
const UI_Status = document.getElementById('status');

const scoreHud = document.createElement('div');
scoreHud.style.position = 'absolute'; scoreHud.style.top = '10px'; scoreHud.style.right = '10px';
scoreHud.style.color = '#fff'; scoreHud.style.background = 'rgba(0,0,0,0.7)';
scoreHud.style.padding = '15px'; scoreHud.style.borderRadius = '8px';
scoreHud.style.fontFamily = 'sans-serif'; scoreHud.style.fontSize = '18px';
scoreHud.style.fontWeight = 'bold'; scoreHud.style.textAlign = 'right'; scoreHud.style.display = 'none';
document.body.appendChild(scoreHud);

const textureLoader = new THREE.TextureLoader();

const stoneTexture = textureLoader.load('textures/stone_color.png');
stoneTexture.colorSpace = THREE.SRGBColorSpace; 
const beachBallTexture = textureLoader.load('textures/beachball_color.jpg');
beachBallTexture.colorSpace = THREE.SRGBColorSpace;
beachBallTexture.wrapS = THREE.RepeatWrapping; beachBallTexture.wrapT = THREE.RepeatWrapping;

const floorTexture = textureLoader.load('textures/floor.jpg');
floorTexture.colorSpace = THREE.SRGBColorSpace;
floorTexture.wrapS = THREE.RepeatWrapping; floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(2, 5); 

const startingFloorTexture = textureLoader.load('textures/floor.jpg');
startingFloorTexture.colorSpace = THREE.SRGBColorSpace;
startingFloorTexture.wrapS = THREE.RepeatWrapping; startingFloorTexture.wrapT = THREE.RepeatWrapping;
startingFloorTexture.repeat.set(2, 33); 

const materials = {
    stone: new THREE.MeshStandardMaterial({ color: 0xaaaaaa, map: stoneTexture, roughness: 0.9, metalness: 0.1 }),
    beachBall: new THREE.MeshStandardMaterial({ color: 0xffffff, map: beachBallTexture, roughness: 0.1 })
};

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
let baseSpeed = -15; 
let forwardSpeed = -15; 
const playerRadius = 1; 

const playerMesh = new THREE.Mesh(new THREE.SphereGeometry(playerRadius, 32, 32), materials.stone);
playerMesh.castShadow = true; playerMesh.visible = false; 
scene.add(playerMesh);

const playerBody = new CANNON.Body({ mass: 50, shape: new CANNON.Sphere(playerRadius), position: new CANNON.Vec3(0, 5, 0), material: physicsMaterials.ball });
playerBody.linearDamping = 0; playerBody.angularDamping = 0; 
world.addBody(playerBody);

playerBody.addEventListener('collide', (e) => {
    if (gameState !== 'PLAYING') return;
    if (e.body.isPin) {
        if (currentForm === 'stone') e.body.needsShatter = true; 
        else {
            gameState = 'GAMEOVER'; playerBody.velocity.set(0, 10, 15); 
            UI_Status.innerHTML = "CRASH! Only the Stone ball smashes pins."; UI_Status.style.color = "#ff3333"; scoreHud.style.color = "#ff3333";
        }
    }
});

// ==========================================
// 6. PROCEDURAL CHUNKS & GAPS
// ==========================================
const trackTiles = []; const obstacles = []; const puddles = []; const windmills = []; const debrisList = [];
let nextSpawnZ = -40; 
let wasGap = false;

const puddleShape = new THREE.Shape();
puddleShape.moveTo(0, 6);
puddleShape.bezierCurveTo(2.2, 4.5, 1.2, 2.0, 1.8, 0);
puddleShape.bezierCurveTo(2.4, -2.5, 1.5, -4.8, 0.2, -6);
puddleShape.bezierCurveTo(-1.8, -5.5, -2.2, -2.0, -1.7, 0);
puddleShape.bezierCurveTo(-1.2, 2.5, -2.5, 4.5, 0, 6);
const puddleGeo = new THREE.ShapeGeometry(puddleShape, 32);

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
    if (nextSpawnZ < -150 && Math.random() < gapChance && !wasGap && Math.abs(nextSpawnZ) % 300 !== 0) {
        wasGap = true; nextSpawnZ -= 30; return; 
    }
    wasGap = false;

    const tMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 30), groundMat);
    tMesh.position.set(0, -1, nextSpawnZ); tMesh.receiveShadow = true; scene.add(tMesh);
    const tBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(new CANNON.Vec3(6, 1, 15)), material: physicsMaterials.ground, position: new CANNON.Vec3(0, -1, nextSpawnZ) });
    world.addBody(tBody); trackTiles.push({ mesh: tMesh, body: tBody });

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

function resetGame() {
    trackTiles.forEach(t => { scene.remove(t.mesh); world.removeBody(t.body); }); trackTiles.length = 0;
    obstacles.forEach(o => { scene.remove(o.mesh); world.removeBody(o.body); }); obstacles.length = 0;
    puddles.forEach(p => { scene.remove(p.group); p.mirror.dispose(); }); puddles.length = 0;
    windmills.forEach(w => { scene.remove(w.group); world.removeBody(w.body); }); windmills.length = 0;
    debrisList.forEach(d => { scene.remove(d.mesh); world.removeBody(d.body); }); debrisList.length = 0;

    spawnStartingRunway();
    currentLane = 0; nextSpawnZ = -165; 
    survivalTime = 0; pinsSmashed = 0; distanceTraveled = 0; gameOverTimer = 0; isSinking = false;
    
    currentForm = 'stone'; playerMesh.material = materials.stone; playerMesh.scale.set(1,1,1);
    baseSpeed = -15; forwardSpeed = -15;
    playerBody.mass = 50; playerBody.updateMassProperties(); 
    
    playerBody.position.set(0, 5, 0); playerBody.velocity.set(0,0,0); playerBody.angularVelocity.set(0,0,0);
    
    UI_Status.innerText = "Current Form: Stone (Heavy)"; UI_Status.style.color = "#aaaaaa"; scoreHud.style.color = "#fff";
    uiHUD.style.display = 'block'; scoreHud.style.display = 'block'; mainMenu.style.display = 'none';
    menuScene.visible = false; playerMesh.visible = true; gameState = 'PLAYING';
}

playBtn.addEventListener('click', resetGame);
spawnStartingRunway(); 

// ==========================================
// 7. USER INTERACTION
// ==========================================
window.addEventListener('keydown', (e) => {
    if (gameState !== 'PLAYING') return; 

    if (e.key === 'a' || e.key === 'ArrowLeft') currentLane--;
    if (e.key === 'd' || e.key === 'ArrowRight') currentLane++;
    
    const isGrounded = playerBody.position.y > -0.5 && playerBody.position.y < 2 && Math.abs(playerBody.velocity.y) < 1;
    if ((e.key === 'w' || e.key === ' ' || e.key === 'ArrowUp') && isGrounded && !isSinking) {
        if (currentForm === 'stone') playerBody.velocity.y = 7;    
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
            playerBody.mass = 50; 
            playerBody.updateMassProperties(); 
            baseSpeed = -15; 
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
    const elapsedTime = clock.getElapsedTime();
    
    world.step(1/60, delta, 3);

    if (gameState === 'PLAYING') {
        survivalTime += delta;
        distanceTraveled = Math.floor(Math.max(0, -playerBody.position.z));
        
        const speedMultiplier = Math.min(2.0, 1.0 + (distanceTraveled / 3000));
        forwardSpeed = baseSpeed * speedMultiplier;
        
        let speedText = speedMultiplier > 1.1 ? ` <span style="color:#ff3333">(x${speedMultiplier.toFixed(1)} SPEED!)</span>` : "";
        scoreHud.innerHTML = `Time: <span style="color:#00e676">${survivalTime.toFixed(1)}s</span><br>Dist: <span style="color:#00e676">${distanceTraveled}m</span>${speedText}<br>Pins: <span style="color:#ffcc00">${pinsSmashed}</span>`;
    }

    // ------------------------------------------
    // DAY / NIGHT CYCLE 
    // ------------------------------------------
    const theta = elapsedTime * cycleSpeed; const skyRadius = 150;
    const skyCenterZ = gameState === 'MENU' ? 0 : playerMesh.position.z;

    // LEFT TO RIGHT TRAJECTORY: -Math.cos starts on Left (-x), peaks center (0), sets Right (+x)
    sunMesh.position.set(-Math.cos(theta) * skyRadius, Math.sin(theta) * skyRadius, skyCenterZ - 200); 
    moonMesh.position.set(-Math.cos(theta + Math.PI) * skyRadius, Math.sin(theta + Math.PI) * skyRadius, skyCenterZ - 200);
    starsPoints.position.z = skyCenterZ;

    // Hide celestial bodies when they dip below the track horizon so they aren't seen underneath
    sunMesh.visible = sunMesh.position.y > -15;
    moonMesh.visible = moonMesh.position.y > -15;
    
    cloudsGroup.position.z = skyCenterZ;
    cloudsGroup.rotation.y += 0.05 * delta;

    const isDay = Math.sin(theta) > 0;
    if (isDay) {
        const i = Math.max(0, Math.sin(theta)); 
        dirLight.intensity = i * 1.5; ambientLight.intensity = i * 0.6 + 0.2;
        const tgt = gameState === 'MENU' ? menuScene.position : playerMesh.position;
        dirLight.position.copy(tgt).add(new THREE.Vector3().copy(sunMesh.position).sub(tgt).normalize().multiplyScalar(60)); 
        dirLight.target = gameState === 'MENU' ? giantBall : playerMesh;

        scene.background.lerpColors(nightColor, dayColor, i); scene.fog.color.copy(scene.background); starsMat.opacity = 0; 
        
        cloudMat.opacity = i * 0.9;
        
        groundMat.emissive.setHex(0x000000); startingGroundMat.emissive.setHex(0x000000);
        pinMat.emissive.setHex(0x000000); puddleSurfaceMat.emissive.setHex(0x000000);
        materials.stone.emissive.setHex(0x000000); materials.beachBall.emissive.setHex(0x000000);
    } else {
        dirLight.intensity = 0; ambientLight.intensity = 0.5; 
        scene.background.copy(nightColor); scene.fog.color.copy(nightColor); starsMat.opacity = 1; 
        
        cloudMat.opacity = 0;
        
        groundMat.emissive.setHex(0x000000); startingGroundMat.emissive.setHex(0x000000);
        pinMat.emissive.setHex(0x555555); puddleSurfaceMat.emissive.setHex(0x001144); 
        materials.stone.emissive.setHex(0x222222); materials.beachBall.emissive.setHex(0x222222); 
    }

    // ------------------------------------------
    // STATE MACHINE
    // ------------------------------------------
    if (gameState === 'MENU') {
        giantBall.rotation.x += 1.5 * delta; giantBall.rotation.y += 0.5 * delta;
        giantPin1.rotation.y -= 1 * delta; giantPin2.rotation.y += 1 * delta;
        camera.position.set(0, 5, 5); camera.lookAt(menuScene.position);

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
            gameState = 'GAMEOVER';
            UI_Status.innerHTML = "GAME OVER!<br>You fell into the abyss!"; UI_Status.style.color = "#ff3333"; scoreHud.style.color = "#ff3333";
        }

        for (let i = puddles.length - 1; i >= 0; i--) {
            let p = puddles[i];
            if (p.z > playerMesh.position.z + 20) { 
                scene.remove(p.group); 
                p.mirror.dispose(); 
                puddles.splice(i, 1); 
            } 
            else if (Math.abs(playerBody.position.z - p.z) < 6.0 && Math.abs(playerBody.position.x - p.x) < 2.0 && playerBody.position.y < 1.5) {
                if (currentForm !== 'beachBall') {
                    gameState = 'GAMEOVER'; isSinking = true;
                    UI_Status.innerHTML = "GLUB GLUB... You sank!"; UI_Status.style.color = "#ff3333"; scoreHud.style.color = "#ff3333"; 
                }
            }
        }

    } else if (gameState === 'GAMEOVER') {
        gameOverTimer += delta;
        
        if (isSinking) {
            playerBody.velocity.set(0, -3, 0); playerBody.angularVelocity.set(0, 15, 0); 
            if (playerMesh.scale.x > 0.05) playerMesh.scale.multiplyScalar(0.96); 
        }

        if (gameOverTimer > 2.5) {
            latestScoreText.innerHTML = `Latest Score: <span style="color:#00e676">${survivalTime.toFixed(1)}s</span> | <span style="color:#00e676">${distanceTraveled}m</span> | <span style="color:#ffcc00">${pinsSmashed}</span> Pins`;
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
                    world.addBody(dBody); debrisList.push({ mesh: dMesh, body: dBody, spawnTime: clock.getElapsedTime() });
                }
            } else {
                obs.mesh.position.copy(obs.body.position); obs.mesh.quaternion.copy(obs.body.quaternion);
            }
        }

        const currentTime = clock.getElapsedTime();
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