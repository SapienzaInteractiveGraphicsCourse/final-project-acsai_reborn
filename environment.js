import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { stagesInfo } from './config.js';

export const scene = new THREE.Scene();
export const dayColor = new THREE.Color(0x87CEEB);
export const nightColor = new THREE.Color(0x000011);
scene.background = dayColor.clone(); 
scene.fog = new THREE.Fog(scene.background, 100, 500);

export const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 600);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; 
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

export const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -30, 0) });

export const physicsMaterials = { ground: new CANNON.Material('ground'), ball: new CANNON.Material('ball'), obstacle: new CANNON.Material('obstacle') };
world.addContactMaterial(new CANNON.ContactMaterial(physicsMaterials.ground, physicsMaterials.ball, { friction: 0.0, restitution: 0.0 }));

export const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

export const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 50; dirLight.shadow.camera.bottom = -50;
dirLight.shadow.camera.left = -30; dirLight.shadow.camera.right = 30;
dirLight.shadow.mapSize.width = 2048; dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

export const moonLight = new THREE.DirectionalLight(0xaaccff, 0.0);
moonLight.castShadow = true;
moonLight.shadow.camera.top = 50; moonLight.shadow.camera.bottom = -50;
moonLight.shadow.camera.left = -30; moonLight.shadow.camera.right = 30;
moonLight.shadow.mapSize.width = 2048; moonLight.shadow.mapSize.height = 2048;
scene.add(moonLight);

export const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(15, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffea00, fog: false }));
scene.add(sunMesh);

export const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 32), new THREE.MeshBasicMaterial({ color: 0xdddddd, fog: false }));
scene.add(moonMesh);

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
export const starsMat = new THREE.PointsMaterial({ size: 1.5, color: 0xffffff, transparent: true, opacity: 0, fog: false });
export const starsPoints = new THREE.Points(starsGeo, starsMat);
scene.add(starsPoints);

export const cloudsGroup = new THREE.Group();
export const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, flatShading: true, fog: true });
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

export const textureLoader = new THREE.TextureLoader();
const stoneTexture = textureLoader.load('textures/bricks_color.png');
stoneTexture.colorSpace = THREE.SRGBColorSpace; 

export const floorTextures = stagesInfo.map(stage => {
    let name = stage.name.toLowerCase().replace(/ /g, '_');
    let tex = textureLoader.load(`textures/${name}_floor.jpg`);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping; 
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 5); 
    return tex;
});

export const startingFloorTextures = stagesInfo.map(stage => {
    let name = stage.name.toLowerCase().replace(/ /g, '_');
    let tex = textureLoader.load(`textures/${name}_floor.jpg`);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping; 
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 33); 
    return tex;
});

export const materials = {
    stone: new THREE.MeshStandardMaterial({ color: 0xaaaaaa, map: stoneTexture, roughness: 0.65, metalness: 0.2 }),
    beachBall: new THREE.MeshPhysicalMaterial({ color: 0xaa0000, roughness: 0.3, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.1 })
};

export const groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: floorTextures[0], roughness: 0.9, metalness: 0.05 });
export const startingGroundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: startingFloorTextures[0], roughness: 0.9, metalness: 0.05 });

export const menuScene = new THREE.Group();
export const giantBall = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 32), materials.beachBall);
giantBall.position.set(0, 3, 0); giantBall.castShadow = true; menuScene.add(giantBall);

const menuPinPoints = [new THREE.Vector2(0, 0), new THREE.Vector2(0.4, 0.2), new THREE.Vector2(0.4, 0.8), new THREE.Vector2(0.15, 1.5), new THREE.Vector2(0.25, 1.8), new THREE.Vector2(0, 2.0)];
const menuPinGeo = new THREE.LatheGeometry(menuPinPoints, 16); menuPinGeo.translate(0, -1, 0); 
const menuPinMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });

export const giantPin1 = new THREE.Mesh(menuPinGeo, menuPinMat); giantPin1.scale.set(2, 2, 2); giantPin1.position.set(-4, 2, -2); giantPin1.castShadow = true; menuScene.add(giantPin1);
export const giantPin2 = new THREE.Mesh(menuPinGeo, menuPinMat); giantPin2.scale.set(2, 2, 2); giantPin2.position.set(4, 2, -2); giantPin2.castShadow = true; menuScene.add(giantPin2);
menuScene.position.set(0, 0, -15); scene.add(menuScene);