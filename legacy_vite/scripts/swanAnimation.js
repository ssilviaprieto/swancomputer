import * as THREE from 'three';

export function createWaterAnimation() {
    // Create a canvas that covers the whole page
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '1'; // Behind content but visible
    canvas.style.pointerEvents = 'none'; // Allow clicking through
    document.body.prepend(canvas);

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
        window.innerWidth / -2,
        window.innerWidth / 2,
        window.innerHeight / 2,
        window.innerHeight / -2,
        1,
        1000
    );
    camera.position.z = 100;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background

    // Create water particles
    const particles = new THREE.Group();
    const waterSymbols = ['.', '~', '≈', '∽'];
    const particleCount = 200;

    // Custom shader material for text
    const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        uniform vec3 color;
        uniform float opacity;
        void main() {
            gl_FragColor = vec4(color, opacity);
        }
    `;

    // Create canvas texture for each symbol
    function createTextTexture(text) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 32;
        canvas.height = 32;
        ctx.fillStyle = '#33ff33';
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width/2, canvas.height/2);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    // Create particles
    for (let i = 0; i < particleCount; i++) {
        const symbol = waterSymbols[Math.floor(Math.random() * waterSymbols.length)];
        const texture = createTextTexture(symbol);
        
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: Math.random() * 0.3 + 0.1
        });

        const particle = new THREE.Sprite(material);
        
        // Random position across the screen
        particle.position.x = Math.random() * window.innerWidth - window.innerWidth/2;
        particle.position.y = Math.random() * window.innerHeight - window.innerHeight/2;
        particle.position.z = Math.random() * 100;
        
        // Scale the particle
        const scale = Math.random() * 20 + 10;
        particle.scale.set(scale, scale, 1);
        
        // Add movement properties
        particle.userData = {
            speedX: Math.random() * 0.5 - 0.25,
            speedY: Math.random() * 0.5 - 0.25,
            originalX: particle.position.x,
            originalY: particle.position.y
        };
        
        particles.add(particle);
    }

    scene.add(particles);

    // Animation
    function animate() {
        requestAnimationFrame(animate);
        
        particles.children.forEach((particle) => {
            // Move particle
            particle.position.x += particle.userData.speedX;
            particle.position.y += particle.userData.speedY;
            
            // Wrap around screen
            if (particle.position.x > window.innerWidth/2) {
                particle.position.x = -window.innerWidth/2;
            }
            if (particle.position.x < -window.innerWidth/2) {
                particle.position.x = window.innerWidth/2;
            }
            if (particle.position.y > window.innerHeight/2) {
                particle.position.y = -window.innerHeight/2;
            }
            if (particle.position.y < -window.innerHeight/2) {
                particle.position.y = window.innerHeight/2;
            }
            
            // Fade opacity based on position
            const material = particle.material;
            material.opacity = Math.random() * 0.3 + 0.1;
        });
        
        renderer.render(scene, camera);
    }

    // Handle window resize
    function onWindowResize() {
        camera.left = window.innerWidth / -2;
        camera.right = window.innerWidth / 2;
        camera.top = window.innerHeight / 2;
        camera.bottom = window.innerHeight / -2;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onWindowResize);

    // Start animation
    animate();
}