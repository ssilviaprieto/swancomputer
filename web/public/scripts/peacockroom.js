import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class Room {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#room'), antialias: true });
    this.textSprites = [];
    this.lastTextSpawnTime = 0;
    this.spawnInterval = 300;
    this.ROOM_SIZE = 10;
    this.PLAYER_RADIUS = 0.5;
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.velocity = new THREE.Vector3();
    this.controlsEnabled = true;
    this.prevTime = performance.now();
    this.cameraRotation = { horizontal: 0, vertical: 0 };
    this.ROTATION_LIMITS = { horizontal: Math.PI / 2, vertical: Math.PI / 3 };
    this.MOUSE_SENSITIVITY = { horizontal: 0.0016, vertical: 0.0012 };
    this.init();
  }
  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    try { console.log('On clay they whispered,\nThe sea bore their script.\nWho, discoverer of all,\nbears the archangel\'s name?'); } catch {}
    this.camera.position.set(0, 1.6, 0);
    this.camera.lookAt(0, 1.6, -1);
    this.createRoom();
    this.createLights();
    this.loadPeacock();
    this.setupEventListeners();
    this.animate();
  }
  createRoom() {
    const texLoader = new THREE.TextureLoader();
    const texture = texLoader.load('/level6/wall.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.anisotropy = 8;
    const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95, metalness: 0.05, side: THREE.DoubleSide });
    const floorGeometry = new THREE.PlaneGeometry(this.ROOM_SIZE, this.ROOM_SIZE);
    const floor = new THREE.Mesh(floorGeometry, mat);
    floor.rotation.x = -Math.PI / 2; floor.position.y = 0; floor.receiveShadow = true; this.scene.add(floor);
    const ceiling = new THREE.Mesh(floorGeometry, mat);
    ceiling.rotation.x = Math.PI / 2; ceiling.position.y = 4; ceiling.receiveShadow = true; this.scene.add(ceiling);
    const wallHeight = 4;
    const backWallGeometry = new THREE.PlaneGeometry(this.ROOM_SIZE, wallHeight);
    const backWall = new THREE.Mesh(backWallGeometry, mat); backWall.position.z = -this.ROOM_SIZE/2; backWall.position.y = wallHeight/2; backWall.receiveShadow = true; this.scene.add(backWall);
    const frontWall = new THREE.Mesh(backWallGeometry, mat); frontWall.position.z = this.ROOM_SIZE/2; frontWall.position.y = wallHeight/2; frontWall.rotation.y = Math.PI; frontWall.receiveShadow = true; this.scene.add(frontWall);
    const sideWallGeometry = new THREE.PlaneGeometry(this.ROOM_SIZE, wallHeight);
    const leftWall = new THREE.Mesh(sideWallGeometry, mat); leftWall.position.x = -this.ROOM_SIZE/2; leftWall.position.y = wallHeight/2; leftWall.rotation.y = Math.PI/2; leftWall.receiveShadow = true; this.scene.add(leftWall);
    const rightWall = new THREE.Mesh(sideWallGeometry, mat); rightWall.position.x = this.ROOM_SIZE/2; rightWall.position.y = wallHeight/2; rightWall.rotation.y = -Math.PI/2; rightWall.receiveShadow = true; this.scene.add(rightWall);
  }
  createLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.4); this.scene.add(ambient);
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.5); mainLight.position.set(2, 3.8, 2); mainLight.castShadow = true; this.scene.add(mainLight);
    const spotlight = new THREE.SpotLight(0xffffff, 10); spotlight.position.set(0, 3.8, 0); spotlight.angle = Math.PI/6; spotlight.penumbra = 0.2; spotlight.decay = 1.5; spotlight.distance = 20; spotlight.castShadow = true; spotlight.shadow.bias = -0.001; spotlight.shadow.mapSize.width = 1024; spotlight.shadow.mapSize.height = 1024; this.scene.add(spotlight); this.spotlight = spotlight;
  }
  loadPeacock() {
    const loader = new GLTFLoader();
    loader.load(
      '/level6/merak_burung_poli_rendah.glb',
      (gltf) => {
        const peacock = gltf.scene;
        peacock.scale.set(0.5, 0.5, 0.5);
        peacock.position.set(0, 0, -2);
        peacock.rotation.y = Math.PI;
        peacock.castShadow = true; peacock.receiveShadow = true;
        this.scene.add(peacock); this.peacock = peacock;
      },
      undefined,
      (err) => { try { console.error('Failed to load peacock:', err); } catch {} }
    );
  }
  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'ArrowUp': case 'KeyW': if (this.controlsEnabled) this.moveForward = true; break;
        case 'ArrowDown': case 'KeyS': if (this.controlsEnabled) this.moveBackward = true; break;
        case 'ArrowLeft': case 'KeyA': if (this.controlsEnabled) this.moveLeft = true; break;
        case 'ArrowRight': case 'KeyD': if (this.controlsEnabled) this.moveRight = true; break;
        case 'Escape': this.moveForward = this.moveBackward = this.moveLeft = this.moveRight = false; this.controlsEnabled = false; break;
      }
    });
    document.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'ArrowUp': case 'KeyW': this.moveForward = false; break;
        case 'ArrowDown': case 'KeyS': this.moveBackward = false; break;
        case 'ArrowLeft': case 'KeyA': this.moveLeft = false; break;
        case 'ArrowRight': case 'KeyD': this.moveRight = false; break;
      }
    });
    document.addEventListener('mousemove', (e) => {
      if (this.camera && this.controlsEnabled) {
        const newH = this.cameraRotation.horizontal - e.movementX * this.MOUSE_SENSITIVITY.horizontal;
        if (newH >= -this.ROTATION_LIMITS.horizontal && newH <= this.ROTATION_LIMITS.horizontal) { this.cameraRotation.horizontal = newH; this.camera.rotation.y = newH; }
        const newV = this.cameraRotation.vertical - e.movementY * this.MOUSE_SENSITIVITY.vertical;
        if (newV >= -this.ROTATION_LIMITS.vertical && newV <= this.ROTATION_LIMITS.vertical) { this.cameraRotation.vertical = newV; this.camera.rotation.x = newV; }
      }
    });
    const canvas = this.renderer.domElement; if (canvas) canvas.addEventListener('click', () => { this.controlsEnabled = true; });
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight; this.camera.updateProjectionMatrix(); this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
  updateMovement(delta) {
    if (!this.controlsEnabled) { const d = 8.0; this.velocity.x -= this.velocity.x * d * delta; this.velocity.z -= this.velocity.z * d * delta; return; }
    const acceleration = 12.0, damping = 6.0, maxSpeed = 4.5;
    const forward = new THREE.Vector3(); this.camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0), forward).normalize();
    const accel = new THREE.Vector3(); if (this.moveForward) accel.add(forward); if (this.moveBackward) accel.sub(forward); if (this.moveRight) accel.add(right); if (this.moveLeft) accel.sub(right);
    if (accel.lengthSq() > 0) { accel.normalize().multiplyScalar(acceleration); this.velocity.addScaledVector(accel, delta); }
    this.velocity.x -= this.velocity.x * damping * delta; this.velocity.z -= this.velocity.z * damping * delta;
    const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z); if (horizSpeed > maxSpeed) { const s = maxSpeed / horizSpeed; this.velocity.x *= s; this.velocity.z *= s; }
    const half = this.ROOM_SIZE / 2 - 0.5; const newX = this.camera.position.x + this.velocity.x * delta; const newZ = this.camera.position.z + this.velocity.z * delta;
    if (Math.abs(newX) < half) this.camera.position.x = newX; if (Math.abs(newZ) < half) this.camera.position.z = newZ;
  }
  updateFloatingTexts() {
    const t = Date.now(); if (this.peacock && t - this.lastTextSpawnTime > this.spawnInterval) { this.createFloatingText(); this.lastTextSpawnTime = t; }
    for (let i = this.textSprites.length - 1; i >= 0; i--) {
      const sprite = this.textSprites[i]; const age = t - sprite.userData.birthTime; if (age >= sprite.userData.lifetime) { this.scene.remove(sprite); this.textSprites.splice(i, 1); continue; }
      if (age > sprite.userData.fadeOutStart) { const fp = (age - sprite.userData.fadeOutStart) / (sprite.userData.lifetime - sprite.userData.fadeOutStart); sprite.material.opacity = 1 - fp; }
      sprite.quaternion.copy(this.camera.quaternion); sprite.position.y += Math.sin(t * 0.006) * 0.002;
    }
  }
  createFloatingText() {
    const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); canvas.width = 512; canvas.height = 128;
    ctx.fillStyle = 'white'; ctx.font = 'bold 60px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Linear B', 256, 64);
    const texture = new THREE.CanvasTexture(canvas); const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 1 }); const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1.5, 0.4, 1); const radius = 0.8 + Math.random() * 0.7; const angle = Math.random() * Math.PI * 2; const offsetX = Math.cos(angle) * radius; const offsetZ = Math.sin(angle) * radius;
    sprite.position.copy(this.peacock.position); sprite.position.x += offsetX; sprite.position.y += 0.5 + Math.random() * 1.5; sprite.position.z += offsetZ;
    sprite.userData = { birthTime: Date.now(), lifetime: 800 + Math.random() * 400, fadeOutStart: 500 };
    this.textSprites.push(sprite); this.scene.add(sprite);
  }
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    const now = performance.now(); const delta = Math.min(0.05, (now - this.prevTime) / 1000); this.prevTime = now;
    this.updateMovement(delta); this.updateFloatingTexts();
    if (this.peacock && this.spotlight) { this.spotlight.target = this.peacock; this.peacock.rotation.y += 0.05; this.peacock.rotation.x = Math.sin(Date.now() * 0.005) * 0.1; this.peacock.rotation.z = Math.cos(Date.now() * 0.005) * 0.1; }
    this.renderer.render(this.scene, this.camera);
  }
}

new Room();

