import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Reflector } from 'https://unpkg.com/three@0.160.0/examples/jsm/objects/Reflector.js';
import { stagesInfo, createDoorTex, createPuTex } from './config.js';
import { scene, world, groundMat, startingGroundMat, physicsMaterials } from './environment.js';
import { state, pools } from './state.js';

export const stageMats = stagesInfo.map(s => ({
    pin: new THREE.MeshStandardMaterial({ color: s.pinCol, roughness: 0.4 }),
    puddle: new THREE.MeshBasicMaterial({ color: s.puddleCol, transparent: true, opacity: 0.85 }),
    splash: new THREE.MeshBasicMaterial({ color: s.puddleCol, transparent: true, opacity: 0.8 })
}));

const puddleShape = new THREE.Shape();
puddleShape.moveTo(0, 6.5); puddleShape.bezierCurveTo(2.5, 5.0, 1.0, 2.5, 2.0, 0); puddleShape.bezierCurveTo(3.0, -3.0, 1.5, -5.5, 0.5, -6.5); puddleShape.bezierCurveTo(-2.0, -6.0, -1.5, -2.5, -2.0, 0); puddleShape.bezierCurveTo(-2.5, 3.0, -3.0, 5.0, 0, 6.5);
export const puddleGeo = new THREE.ShapeGeometry(puddleShape, 32);

export const splashGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
export const windGeo = new THREE.BoxGeometry(0.1, 0.1, 1.5);
export const fpGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);

const pinPoints = [new THREE.Vector2(0, 0), new THREE.Vector2(0.4, 0.2), new THREE.Vector2(0.4, 0.8), new THREE.Vector2(0.15, 1.5), new THREE.Vector2(0.25, 1.8), new THREE.Vector2(0, 2.0)];
export const pinGeo = new THREE.LatheGeometry(pinPoints, 16); pinGeo.translate(0, -1, 0); 
export const pinShape = new CANNON.Cylinder(0.4, 0.4, 2.0, 8);

const greenPuMat = new THREE.MeshStandardMaterial({ map: createPuTex('💪', '#00ff00'), roughness: 0.4 });
const purplePuMat = new THREE.MeshStandardMaterial({ map: createPuTex('🪽', '#aa00ff'), roughness: 0.4 });

export function spawnGate(zPos) {
    let upcomingStageIdx = (state.trackStageIdx + 1) % stagesInfo.length;
    const nextStg = stagesInfo[upcomingStageIdx];
    
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, zPos);

    const frameMat = new THREE.MeshStandardMaterial({ color: nextStg.gateFrame, roughness: 0.5 }); 
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, map: createDoorTex(nextStg.emoji, nextStg.gateDoor) }); 
    const handleMat = new THREE.MeshStandardMaterial({ color: nextStg.gateHandle, metalness: 0.8, roughness: 0.2 }); 

    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(2, 15, 2), frameMat); leftPillar.position.set(-7, 7.5, 0); leftPillar.castShadow = true; gateGroup.add(leftPillar);
    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(2, 15, 2), frameMat); rightPillar.position.set(7, 7.5, 0); rightPillar.castShadow = true; gateGroup.add(rightPillar);
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 2), frameMat); topBeam.position.set(0, 16, 0); topBeam.castShadow = true; gateGroup.add(topBeam);

    const leftPillarBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(new CANNON.Vec3(1, 7.5, 1)), position: new CANNON.Vec3(-7, 7.5, zPos) }); world.addBody(leftPillarBody);
    const rightPillarBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(new CANNON.Vec3(1, 7.5, 1)), position: new CANNON.Vec3(7, 7.5, zPos) }); world.addBody(rightPillarBody);

    const leftDoorPivot = new THREE.Group(); leftDoorPivot.position.set(-6, 0, 0); 
    const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(6, 15, 0.5), doorMat); leftDoor.position.set(3, 7.5, 0); leftDoor.castShadow = true;
    const leftHandle = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), handleMat); leftHandle.position.set(2.5, 0, 0.5); leftDoor.add(leftHandle);
    leftDoorPivot.add(leftDoor); gateGroup.add(leftDoorPivot);

    const rightDoorPivot = new THREE.Group(); rightDoorPivot.position.set(6, 0, 0); 
    const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(6, 15, 0.5), doorMat); rightDoor.position.set(-3, 7.5, 0); rightDoor.castShadow = true;
    const rightHandle = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), handleMat); rightHandle.position.set(-2.5, 0, 0.5); rightDoor.add(rightHandle);
    rightDoorPivot.add(rightDoor); gateGroup.add(rightDoorPivot);

    scene.add(gateGroup);
    pools.gates.push({ group: gateGroup, leftPivot: leftDoorPivot, rightPivot: rightDoorPivot, zPos: zPos, opened: false, passed: false, soundPlayed: false, leftPillarBody, rightPillarBody });
    state.trackStageIdx = upcomingStageIdx;
}

export function spawnStartingRunway() {
    const tMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 200), startingGroundMat); tMesh.position.set(0, -1, -50); tMesh.receiveShadow = true; scene.add(tMesh);
    const tBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(new CANNON.Vec3(6, 1, 100.1)), material: physicsMaterials.ground, position: new CANNON.Vec3(0, -1, -50) });
    world.addBody(tBody); pools.trackTiles.push({ mesh: tMesh, body: tBody });
}

export function spawnScenery(zPos, stageIdx) {
    const sides = [-9, 9];
    sides.forEach(xPos => {
        if(Math.random() < 0.4) return;
        let mesh;
        let customData = { origY: 0, origX: 0, origZ: 0, offset: Math.random() * Math.PI * 2, stage: stageIdx };

        if(stageIdx === 0) { // Sky
            mesh = new THREE.Group();
            const cMat = new THREE.MeshStandardMaterial({color: 0xffffff, flatShading: true});
            const puffs = 3 + Math.floor(Math.random() * 4);
            for(let j=0; j<puffs; j++) {
                const p = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), cMat);
                p.position.set((Math.random()-0.5)*3, Math.random()*2, (Math.random()-0.5)*3); p.scale.set(1+Math.random(), 0.8+Math.random(), 1+Math.random()); mesh.add(p);
            }
            mesh.position.y = 1;
        } else if(stageIdx === 1) { // Neon
            mesh = new THREE.Group();
            let h1 = Math.random()*8+4; let b1 = new THREE.Mesh(new THREE.BoxGeometry(1, h1, 1), new THREE.MeshStandardMaterial({color: 0xff00ff, emissive: 0x111111})); b1.position.set(-0.5, h1/2, 0);
            let h2 = Math.random()*8+4; let b2 = new THREE.Mesh(new THREE.BoxGeometry(1, h2, 1), new THREE.MeshStandardMaterial({color: 0x00ffff, emissive: 0x111111})); b2.position.set(0.5, h2/2, 0);
            let h3 = Math.random()*8+4; let b3 = new THREE.Mesh(new THREE.BoxGeometry(1, h3, 1), new THREE.MeshStandardMaterial({color: 0xffff00, emissive: 0x111111})); b3.position.set(0, h3/2, 1);
            mesh.add(b1, b2, b3);
        } else if(stageIdx === 2) { // Forest
            mesh = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2), new THREE.MeshStandardMaterial({color: 0x8b4513})); trunk.position.y = 1;
            const leaves = new THREE.Mesh(new THREE.ConeGeometry(2, 4), new THREE.MeshStandardMaterial({color: 0x228b22})); leaves.position.y = 4; mesh.add(trunk, leaves);
        } else if(stageIdx === 3) { // Snow
            mesh = new THREE.Group();
            const base = new THREE.Mesh(new THREE.SphereGeometry(1.5), new THREE.MeshStandardMaterial({color: 0xffffff})); base.position.y = 1.5;
            const top = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshStandardMaterial({color: 0xffffff})); top.position.y = 3.5;
            const armMat = new THREE.MeshStandardMaterial({color: 0x8b4513});
            const lArmBase = new THREE.Group(); lArmBase.position.set(-1.2, 2.5, 0); const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.5), armMat); lArm.position.set(-0.5, 0, 0); lArm.rotation.z = Math.PI/4; lArmBase.add(lArm);
            const rArmBase = new THREE.Group(); rArmBase.position.set(1.2, 2.5, 0); const rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.5), armMat); rArm.position.set(0.5, 0, 0); rArm.rotation.z = -Math.PI/4; rArmBase.add(rArm);
            mesh.add(base, top, lArmBase, rArmBase); customData.lArm = lArmBase; customData.rArm = rArmBase;
        } else if(stageIdx === 4) { // Volcano
            mesh = new THREE.Group();
            const base = new THREE.Mesh(new THREE.ConeGeometry(2.5, 5, 8), new THREE.MeshStandardMaterial({color: 0x333333, roughness: 0.9})); base.position.y = 2.5;
            const lava = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), new THREE.MeshBasicMaterial({color: 0xff3300})); lava.position.y = 4.8; mesh.add(base, lava);
        } else if(stageIdx === 5) { // Desert
            mesh = new THREE.Group();
            const main = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4), new THREE.MeshStandardMaterial({color: 0x2e8b57})); main.position.y = 2;
            const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5), new THREE.MeshStandardMaterial({color: 0x2e8b57})); lArm.position.set(-0.6, 2.5, 0); lArm.rotation.z = Math.PI/4;
            const rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5), new THREE.MeshStandardMaterial({color: 0x2e8b57})); rArm.position.set(0.6, 1.5, 0); rArm.rotation.z = -Math.PI/4; mesh.add(main, lArm, rArm);
        } else if(stageIdx === 6) { // Beach
            mesh = new THREE.Group();
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4), new THREE.MeshStandardMaterial({color: 0xdddddd})); pole.position.y = 2;
            const top = new THREE.Mesh(new THREE.ConeGeometry(3, 1.5, 16), new THREE.MeshStandardMaterial({color: 0x0009D1})); top.position.y = 4; mesh.add(pole, top); customData.umbrellaTop = top;
        } else if(stageIdx === 7) { // Mountain
            mesh = new THREE.Group();
            const rock = new THREE.Mesh(new THREE.ConeGeometry(3, 6, 8), new THREE.MeshStandardMaterial({color: 0x666666, roughness: 1.0})); rock.position.y = 3;
            const snowTop = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2, 8), new THREE.MeshStandardMaterial({color: 0xffffff})); snowTop.position.y = 5.0; mesh.add(rock, snowTop);
        } else if(stageIdx === 8) { // Space
            mesh = new THREE.Group();
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 0), new THREE.MeshStandardMaterial({color: 0x555555})); rock.position.y = 1;
            const ring = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.2, 8, 24), new THREE.MeshStandardMaterial({color: 0x00ffff})); ring.rotation.x = Math.PI / 2; ring.position.y = 1; mesh.add(rock, ring);
        } else if(stageIdx === 9) { // Candy
            mesh = new THREE.Group();
            const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3), new THREE.MeshStandardMaterial({color: 0xffffff})); stick.position.y = 1.5;
            const top = new THREE.Mesh(new THREE.SphereGeometry(1.5), new THREE.MeshStandardMaterial({color: 0xff00ff})); top.position.y = 3; mesh.add(stick, top);
        } else if(stageIdx === 10) { // Crystal
            mesh = new THREE.Mesh(new THREE.OctahedronGeometry(2, 0), new THREE.MeshStandardMaterial({color: 0x00ffff, transparent: true, opacity: 0.8, emissive: 0x004444})); mesh.scale.set(1, 2, 1); mesh.position.y = 2;
        }
        
        if(mesh) {
            mesh.position.set(xPos + (Math.random()-0.5)*3, 0, zPos + (Math.random()-0.5)*10);
            customData.origX = mesh.position.x; customData.origY = mesh.position.y; customData.origZ = mesh.position.z;
            scene.add(mesh); pools.sceneryList.push({ mesh: mesh, ...customData });
        }
    });
}

export function spawnNextChunk() {
    const gapChance = Math.min(0.25, 0.15 + (state.distanceTraveled / 10000));
    let allowGap = state.activePowerUp !== 'flying';
    if (state.nextSpawnZ < -150 && Math.random() < gapChance && !state.wasGap && Math.abs(state.nextSpawnZ) % 300 !== 0 && state.nextSpawnZ > state.nextGateZ && allowGap) {
        state.wasGap = true; state.nextSpawnZ -= 30; return; 
    }
    state.wasGap = false;

    const tMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 30), groundMat); tMesh.position.set(0, -1, state.nextSpawnZ); tMesh.receiveShadow = true; scene.add(tMesh);
    const tBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(new CANNON.Vec3(6, 1, 15.1)), material: physicsMaterials.ground, position: new CANNON.Vec3(0, -1, state.nextSpawnZ) });
    world.addBody(tBody); pools.trackTiles.push({ mesh: tMesh, body: tBody });

    if (state.nextSpawnZ <= state.nextGateZ) {
        spawnGate(state.nextSpawnZ); state.nextGateZ -= 1000; spawnScenery(state.nextSpawnZ, state.trackStageIdx); state.nextSpawnZ -= 30; return; 
    }

    const rand = Math.random();
    
    if (state.gatesPassed >= 1 && rand < 0.1) {
        const isFlying = Math.random() < 0.5;
        const puMesh = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), isFlying ? purplePuMat : greenPuMat);
        const puLane = Math.floor(Math.random() * 3) - 1; const px = puLane * 3;
        puMesh.position.set(px, 1.0, state.nextSpawnZ); puMesh.castShadow = true; scene.add(puMesh);
        pools.powerups.push({ mesh: puMesh, type: isFlying ? 'flying' : 'invincible', z: state.nextSpawnZ, x: px, y: 1.0 });
    } 
    else if (rand < 0.45) {
        const laneIndex = Math.floor(Math.random() * 3) - 1; const xPos = laneIndex * 3;
        const pinMesh = new THREE.Mesh(pinGeo, stageMats[state.trackStageIdx].pin); pinMesh.position.set(xPos, 1, state.nextSpawnZ); pinMesh.castShadow = true; scene.add(pinMesh);
        const pinBody = new CANNON.Body({ type: CANNON.Body.KINEMATIC, material: physicsMaterials.obstacle }); pinBody.collisionResponse = false; 
        const qY = new CANNON.Quaternion(); qY.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2); pinBody.addShape(pinShape, new CANNON.Vec3(0, 0, 0), qY);
        pinBody.position.set(xPos, 1.0, state.nextSpawnZ); pinBody.isPin = true; world.addBody(pinBody);
        pools.obstacles.push({ mesh: pinMesh, body: pinBody, stageIdx: state.trackStageIdx });
    } else {
        const laneIndex = Math.floor(Math.random() * 3) - 1; const xPos = laneIndex * 3;
        const puddleGroup = new THREE.Group(); puddleGroup.position.set(xPos, 0.02, state.nextSpawnZ);
        const puddleMirror = new Reflector(puddleGeo, { clipBias: 0.003, textureWidth: 512, textureHeight: 512, color: 0x88bbff }); puddleMirror.rotation.x = -Math.PI / 2; puddleGroup.add(puddleMirror);
        const puddleSurface = new THREE.Mesh(puddleGeo, stageMats[state.trackStageIdx].puddle); puddleSurface.rotation.x = -Math.PI / 2; puddleSurface.position.y = 0.01; puddleSurface.receiveShadow = true; puddleGroup.add(puddleSurface);
        scene.add(puddleGroup); pools.puddles.push({ group: puddleGroup, mirror: puddleMirror, x: xPos, z: state.nextSpawnZ, stageIdx: state.trackStageIdx });
    }
    
    spawnScenery(state.nextSpawnZ, state.trackStageIdx);
    state.nextSpawnZ -= 30;
}