import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// PointerLockControls not used; removed to avoid import errors in browser

class Room {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector('#room'),
            antialias: true
        });
        
        this.textSprites = []; // Store active text sprites
        this.lastTextSpawnTime = 0; // Track last spawn time
        this.spawnInterval = 300; // Spawn every 300ms (much faster)
        
        // Room dimensions
        this.ROOM_SIZE = 10;
        this.WALL_THICKNESS = 0.1;
        this.PLAYER_RADIUS = 0.5; // Collision radius for the player
        
        // Movement flags
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.velocity = new THREE.Vector3(); // Smoothed velocity (units/sec)
        this.controlsEnabled = true; // Toggle with ESC
        this.prevTime = performance.now();
        
        // Add camera rotation tracking with limits
        this.cameraRotation = {
            horizontal: 0,
            vertical: 0
        };
        
        // Define rotation limits (in radians)
        this.ROTATION_LIMITS = {
            horizontal: Math.PI / 2, // 90 degrees to each side
            vertical: Math.PI / 3    // 60 degrees up/down
        };
        
        // Mouse sensitivity settings
        this.MOUSE_SENSITIVITY = {
            horizontal: 0.0016,  // Slightly gentler for realism
            vertical: 0.0012     // Reduced vertical sensitivity
        };
        
        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

        // Display the stanza in the console upon entering the room
        try {
            console.log(
                'On clay they whispered,\n' +
                'The sea bore their script.\n' +
                'Who, discoverer of all,\n' +
                "bears the archangel's name?"
            );
        } catch {}

        // Setup camera
        this.camera.position.set(0, 1.6, 0); // Start at center of room
        this.camera.lookAt(0, 1.6, -1); // Look slightly forward

        // Setup room
        this.createRoom();
        this.createLights();
        this.loadCat();
        
        // Event listeners
        this.setupEventListeners();
        
        // Start animation
        this.animate();
    }

    createRoom() {
        // Wall material with pale brown color
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x9b8579, // Pale brown color
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        // Ceiling material with darker brown color
        const ceilingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8b7355, // More brownish color for ceiling
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(this.ROOM_SIZE, this.ROOM_SIZE);
        const floor = new THREE.Mesh(floorGeometry, wallMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Ceiling with darker material
        const ceiling = new THREE.Mesh(floorGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 4;
        ceiling.receiveShadow = true;
        this.scene.add(ceiling);

        // Walls
        const wallHeight = 4;

        // Back wall
        const backWallGeometry = new THREE.PlaneGeometry(this.ROOM_SIZE, wallHeight);
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.position.z = -this.ROOM_SIZE/2;
        backWall.position.y = wallHeight/2;
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // Front wall
        const frontWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        frontWall.position.z = this.ROOM_SIZE/2;
        frontWall.position.y = wallHeight/2;
        frontWall.rotation.y = Math.PI;
        frontWall.receiveShadow = true;
        this.scene.add(frontWall);

        // Left wall
        const sideWallGeometry = new THREE.PlaneGeometry(this.ROOM_SIZE, wallHeight);
        const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        leftWall.position.x = -this.ROOM_SIZE/2;
        leftWall.position.y = wallHeight/2;
        leftWall.rotation.y = Math.PI/2;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        // Right wall
        const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        rightWall.position.x = this.ROOM_SIZE/2;
        rightWall.position.y = wallHeight/2;
        rightWall.rotation.y = -Math.PI/2;
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);

        // Adjust spotlight position to be just below ceiling
        if (this.spotlight) {
            this.spotlight.position.y = 3.8;
            if (this.spotlightCone) {
                this.spotlightCone.position.y = 3.8;
            }
        }
    }

    createLights() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        // Main room light
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.5);
        mainLight.position.set(2, 3.8, 2);
        mainLight.castShadow = true;
        this.scene.add(mainLight);

        // Spotlight
        const spotlight = new THREE.SpotLight(0xffffff, 10);
        spotlight.position.set(0, 3.8, 0);
        spotlight.angle = Math.PI / 6;
        spotlight.penumbra = 0.2;
        spotlight.decay = 1.5;
        spotlight.distance = 20;
        spotlight.castShadow = true;
        spotlight.shadow.bias = -0.001;
        spotlight.shadow.mapSize.width = 1024;
        spotlight.shadow.mapSize.height = 1024;

        this.scene.add(spotlight);
        this.spotlight = spotlight;
    }

    createFloatingText() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;

        // Set text style
        ctx.fillStyle = 'white';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Linear B', 256, 64);

        // Create sprite
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 1
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(1.5, 0.4, 1); // Slightly smaller text
        
        // Closer radius around peacock
        const radius = 0.8 + Math.random() * 0.7; // Random distance between 0.8 and 1.5 units
        const angle = Math.random() * Math.PI * 2;
        const offsetX = Math.cos(angle) * radius;
        const offsetZ = Math.sin(angle) * radius;
        
        sprite.position.copy(this.peacock.position);
        sprite.position.x += offsetX;
        sprite.position.y += 0.5 + Math.random() * 1.5; // Lower height, between 0.5 and 2 units
        sprite.position.z += offsetZ;

        // Shorter lifetime for faster disappearance
        sprite.userData = {
            birthTime: Date.now(),
            lifetime: 800 + Math.random() * 400, // 0.8-1.2 seconds lifetime
            fadeOutStart: 500, // Start fading out after 0.5 seconds
        };

        this.textSprites.push(sprite);
        this.scene.add(sprite);
    }

    loadCat() {
        const loader = new GLTFLoader();
        loader.load(
            '/merak_burung_poli_rendah.glb',
            (gltf) => {
                const peacock = gltf.scene;
                peacock.scale.set(0.5, 0.5, 0.5);
                peacock.position.set(0, 0, -2);
                peacock.rotation.y = Math.PI;
                peacock.castShadow = true;
                peacock.receiveShadow = true;
                this.scene.add(peacock);
                this.peacock = peacock;
            },
            (progress) => {
                console.log('Loading model...', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading peacock model:', error);
            }
        );
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    if (this.controlsEnabled) this.moveForward = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    if (this.controlsEnabled) this.moveBackward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    if (this.controlsEnabled) this.moveLeft = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    if (this.controlsEnabled) this.moveRight = true;
                    break;
                case 'Escape':
                    // Stop movement and disable controls
                    this.moveForward = this.moveBackward = this.moveLeft = this.moveRight = false;
                    this.controlsEnabled = false;
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        });

        // Updated mouse movement for camera with adjusted sensitivity
        document.addEventListener('mousemove', (event) => {
            if (this.camera && this.controlsEnabled) {
                // Horizontal rotation (limited) with normal sensitivity
                const newHorizontal = this.cameraRotation.horizontal - 
                    event.movementX * this.MOUSE_SENSITIVITY.horizontal;
                
                if (newHorizontal >= -this.ROTATION_LIMITS.horizontal && 
                    newHorizontal <= this.ROTATION_LIMITS.horizontal) {
                    this.cameraRotation.horizontal = newHorizontal;
                    this.camera.rotation.y = this.cameraRotation.horizontal;
                }

                // Vertical rotation (limited) with reduced sensitivity
                const newVertical = this.cameraRotation.vertical - 
                    event.movementY * this.MOUSE_SENSITIVITY.vertical;
                
                if (newVertical >= -this.ROTATION_LIMITS.vertical && 
                    newVertical <= this.ROTATION_LIMITS.vertical) {
                    this.cameraRotation.vertical = newVertical;
                    this.camera.rotation.x = this.cameraRotation.vertical;
                }
            }
        });

        // Click canvas to re-enable controls after ESC
        const canvas = this.renderer.domElement;
        if (canvas) {
            canvas.addEventListener('click', () => {
                this.controlsEnabled = true;
            });
        }

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    updateMovement(delta) {
        if (!this.controlsEnabled) {
            // Apply friction to bring velocity to stop
            const damping = 8.0;
            this.velocity.x -= this.velocity.x * damping * delta;
            this.velocity.z -= this.velocity.z * damping * delta;
            return;
        }

        // Movement parameters (snappier, like welcomeRoom)
        const acceleration = 12.0; // units/s^2
        const damping = 6.0;       // friction
        const maxSpeed = 4.5;      // units/s

        // Directions from camera (ignore vertical for walking)
        // Camera forward points toward where you look
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        // Right vector: up x forward (matches welcomeRoom behavior)
        const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();

        // Accumulate acceleration based on keys
        const accelVec = new THREE.Vector3();
        if (this.moveForward) accelVec.add(forward);
        if (this.moveBackward) accelVec.sub(forward);
        if (this.moveRight) accelVec.add(right);
        if (this.moveLeft) accelVec.sub(right);
        if (accelVec.lengthSq() > 0) {
            accelVec.normalize().multiplyScalar(acceleration);
            this.velocity.addScaledVector(accelVec, delta);
        }

        // Apply friction
        this.velocity.x -= this.velocity.x * damping * delta;
        this.velocity.z -= this.velocity.z * damping * delta;

        // Clamp horizontal speed
        const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z);
        if (horizSpeed > maxSpeed) {
            const scale = maxSpeed / horizSpeed;
            this.velocity.x *= scale;
            this.velocity.z *= scale;
        }

        // Attempt movement with simple collision bounds per axis
        const half = this.ROOM_SIZE / 2 - 0.5;
        const newX = this.camera.position.x + this.velocity.x * delta;
        const newZ = this.camera.position.z + this.velocity.z * delta;
        if (Math.abs(newX) < half) this.camera.position.x = newX;
        if (Math.abs(newZ) < half) this.camera.position.z = newZ;
    }

    updateFloatingTexts() {
        const currentTime = Date.now();

        // Spawn new text if enough time has passed
        if (this.peacock && currentTime - this.lastTextSpawnTime > this.spawnInterval) {
            this.createFloatingText();
            this.lastTextSpawnTime = currentTime;
        }

        // Update existing texts
        for (let i = this.textSprites.length - 1; i >= 0; i--) {
            const sprite = this.textSprites[i];
            const age = currentTime - sprite.userData.birthTime;
            
            // Remove expired sprites
            if (age >= sprite.userData.lifetime) {
                this.scene.remove(sprite);
                this.textSprites.splice(i, 1);
                continue;
            }

            // Update opacity for fade out
            if (age > sprite.userData.fadeOutStart) {
                const fadeProgress = (age - sprite.userData.fadeOutStart) / 
                                  (sprite.userData.lifetime - sprite.userData.fadeOutStart);
                sprite.material.opacity = 1 - fadeProgress;
            }

            // Make text face camera
            sprite.quaternion.copy(this.camera.quaternion);

            // Faster floating motion
            sprite.position.y += Math.sin(currentTime * 0.006) * 0.002;
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        const now = performance.now();
        const delta = Math.min(0.05, (now - this.prevTime) / 1000); // clamp delta
        this.prevTime = now;

        this.updateMovement(delta);
        this.updateFloatingTexts();

        if (this.peacock && this.spotlight) {
            this.spotlight.target = this.peacock;
            this.peacock.rotation.y += 0.05;
            this.peacock.rotation.x = Math.sin(Date.now() * 0.005) * 0.1;
            this.peacock.rotation.z = Math.cos(Date.now() * 0.005) * 0.1;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Start the room
new Room(); 
