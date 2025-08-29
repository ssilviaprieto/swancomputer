import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export function createRoom() {
    // Check if the canvas element exists
    const canvasElement = document.getElementById('room-canvas');
    if (!canvasElement) {
        console.error('Room canvas element not found!');
        return;
    }
    
    // Make sure the canvas has focus and can receive input events
    canvasElement.tabIndex = 0;
    
    // Ensure the canvas becomes focusable when clicked
    canvasElement.addEventListener('click', () => {
        canvasElement.focus();
    });
    
    // Make sure pointer lock is properly set up
    canvasElement.requestPointerLock = canvasElement.requestPointerLock || 
                                      canvasElement.mozRequestPointerLock ||
                                      canvasElement.webkitRequestPointerLock;
    
    document.exitPointerLock = document.exitPointerLock || 
                              document.mozExitPointerLock ||
                              document.webkitExitPointerLock;
    
    // Initialize pointer lock on canvas click
    canvasElement.addEventListener('click', () => {
        canvasElement.requestPointerLock();
    });
    
    // Make sure the canvas is positioned properly and visible
    canvasElement.style.position = 'fixed';
    canvasElement.style.top = '0';
    canvasElement.style.left = '0';
    canvasElement.style.width = '100%';
    canvasElement.style.height = '100%';
    canvasElement.style.zIndex = '-1'; // Make sure it's behind other content but still interactive
    
    // Add a hint for users
    const hint = document.createElement('div');
    hint.className = 'esc-hint';
    hint.textContent = 'Click to interact with the room. Press ESC to exit.';
    document.body.appendChild(hint);
    
    const renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true });
    const scene = new THREE.Scene();
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.7, 0); // Eye level

    // Controls
    const controls = new PointerLockControls(camera, document.body);
    
    // Movement variables
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;
    
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    let prevTime = performance.now();

    // Load textures
    const textureLoader = new THREE.TextureLoader();
    const wallTexture = textureLoader.load('/images/swanwall.png');
    const floorTexture = textureLoader.load('/images/floor.jpg');
    const ceilingTexture = textureLoader.load('/images/ceiling.jpg');
    
    // Configure textures
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(3, 1);
    
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4);
    
    ceilingTexture.wrapS = THREE.RepeatWrapping;
    ceilingTexture.wrapT = THREE.RepeatWrapping;
    ceilingTexture.repeat.set(1, 1);

    // Room dimensions
    const roomWidth = 10;
    const roomHeight = 4;
    const roomDepth = 10;

    // Create walls
    function createWall(width, height, depth, position, rotation, texture) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({ map: texture });
        const wall = new THREE.Mesh(geometry, material);
        wall.position.copy(position);
        wall.rotation.copy(rotation);
        return wall;
    }

    // Create room structure
    const walls = [
        // Back wall
        createWall(roomWidth, roomHeight, 0.1, 
            new THREE.Vector3(0, roomHeight/2, -roomDepth/2), 
            new THREE.Euler(0, 0, 0), 
            wallTexture),
        // Front wall
        createWall(roomWidth, roomHeight, 0.1, 
            new THREE.Vector3(0, roomHeight/2, roomDepth/2), 
            new THREE.Euler(0, 0, 0), 
            wallTexture),
        // Left wall
        createWall(0.1, roomHeight, roomDepth, 
            new THREE.Vector3(-roomWidth/2, roomHeight/2, 0), 
            new THREE.Euler(0, 0, 0), 
            wallTexture),
        // Right wall
        createWall(0.1, roomHeight, roomDepth, 
            new THREE.Vector3(roomWidth/2, roomHeight/2, 0), 
            new THREE.Euler(0, 0, 0), 
            wallTexture),
        // Ceiling
        createWall(roomWidth, 0.1, roomDepth, 
            new THREE.Vector3(0, roomHeight, 0), 
            new THREE.Euler(0, 0, 0), 
            ceilingTexture),
        // Floor
        createWall(roomWidth, 0.1, roomDepth, 
            new THREE.Vector3(0, 0, 0), 
            new THREE.Euler(0, 0, 0), 
            floorTexture)
    ];

    walls.forEach(wall => scene.add(wall));

    // Lighting - increased intensity
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Increased from 0.5 to 0.7
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.2); // Increased from 0.8 to 1.2
    pointLight.position.set(0, roomHeight/2, 0);
    scene.add(pointLight);

    // Movement controls - simplified for direct WASD mapping
    const onKeyDown = function(event) {
        switch(event.code) {
            case 'KeyW':
                moveForward = true;
                break;
            case 'KeyS':
                moveBackward = true;
                break;
            case 'KeyA':
                moveLeft = true;
                break;
            case 'KeyD':
                moveRight = true;
                break;
        }
    };

    const onKeyUp = function(event) {
        switch(event.code) {
            case 'KeyW':
                moveForward = false;
                break;
            case 'KeyS':
                moveBackward = false;
                break;
            case 'KeyA':
                moveLeft = false;
                break;
            case 'KeyD':
                moveRight = false;
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Click to start
    document.addEventListener('click', function() {
        controls.lock();
    });

    // Handle window resize
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onWindowResize);
    onWindowResize();

    // Update animation loop with faster movement and fixed variable names
    function animate() {
        requestAnimationFrame(animate);

        if (controls.isLocked) {
            const time = performance.now();
            const delta = (time - prevTime) / 1000;

            // Reset velocity
            velocity.x = 0;
            velocity.z = 0;

            // Get movement direction from keys
            if (moveForward) velocity.z = -1;  // Forward is negative Z
            if (moveBackward) velocity.z = 1;  // Backward is positive Z
            if (moveLeft) velocity.x = -1;     // Left is negative X
            if (moveRight) velocity.x = 1;     // Right is positive X

            // Normalize diagonal movement
            if (velocity.x !== 0 && velocity.z !== 0) {
                velocity.x *= Math.SQRT1_2;
                velocity.z *= Math.SQRT1_2;
            }

            // Apply movement speed - INCREASED for better responsiveness
            const moveSpeed = 4.0; // Increased from 2.5 to 4.0
            velocity.x *= moveSpeed * delta;
            velocity.z *= moveSpeed * delta;

            // Get the camera's direction vector
            const cameraDirection = new THREE.Vector3();
            controls.getObject().getWorldDirection(cameraDirection);
            
            // Calculate right vector (perpendicular to direction)
            const rightVector = new THREE.Vector3();
            rightVector.crossVectors(new THREE.Vector3(0, 1, 0), cameraDirection).normalize();
            
            // Calculate movement vector
            const moveVector = new THREE.Vector3();
            moveVector.addScaledVector(cameraDirection, -velocity.z); // Forward/backward along camera direction
            moveVector.addScaledVector(rightVector, velocity.x);      // Left/right perpendicular to camera
            
            // Calculate next position - FIX: Use moveVector components instead of undefined moveX/moveZ
            const newX = camera.position.x + moveVector.x;
            const newZ = camera.position.z + moveVector.z;
            
            // Simple boundary check
            const padding = 0.5;
            const halfWidth = roomWidth/2 - padding;
            const halfDepth = roomDepth/2 - padding;

            // Check if new X position is valid
            if (newX >= -halfWidth && newX <= halfWidth) {
                camera.position.x = newX;
            }
            
            // Check if new Z position is valid
            if (newZ >= -halfDepth && newZ <= halfDepth) {
                camera.position.z = newZ;
            }

            prevTime = time; // Update prevTime here
        }

        renderer.render(scene, camera);
    }
    animate();
} 