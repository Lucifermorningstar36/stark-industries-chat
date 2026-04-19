// hologram.js
// 3D Energy Sphere (Tony Stark Expo style) controlled via PalmReader events

let scene, camera, renderer;
let energyCore, outerShell;
let hologramGroup;

// Target transform state influenced by gestures
let targetState = {
    x: 0,
    y: 0,
    z: 0,
    scale: 1.0,
    rotationY: 0,
    visible: true,
    scaleMult: 1.0
};

// Current transform state for smooth lerping
let currentState = {
    x: 0,
    y: 0,
    z: 0,
    scale: 1.0,
    rotationY: 0,
    scaleMult: 1.0
};

const LERP_FACTOR = 0.1;

function initThreeJS() {
    const container = document.getElementById('three_container');

    scene = new THREE.Scene();
    
    // Transparent camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 10;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    hologramGroup = new THREE.Group();

    // 1. Inner Energy Core (Glowing solid)
    const coreGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0x00aaff,
        transparent: true,
        opacity: 0.9
        // Removed AdditiveBlending to fix browser composite layer invisible bug
    });
    energyCore = new THREE.Mesh(coreGeometry, coreMaterial);
    hologramGroup.add(energyCore);

    // 2. Outer Wireframe Shell (Holographic grid)
    const shellGeometry = new THREE.IcosahedronGeometry(1.8, 2);
    const shellMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
        wireframe: true
    });
    outerShell = new THREE.Mesh(shellGeometry, shellMaterial);
    hologramGroup.add(outerShell);

    scene.add(hologramGroup);

    // Listen for resize
    window.addEventListener('resize', onWindowResize, false);
    
    // Listen for custom gesture events
    window.addEventListener('PalmReader3DControl', onGestureControl, false);

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onGestureControl(event) {
    const payload = event.detail;

    // Convert normalized coordinates (0 to 1) to screen space for virtual buttons (-1 viewport -> +1 viewport)
    // ThreeJS coordinate mapping roughly based on distance
    const viewWidth = 14; 
    const viewHeight = 8;
    
    // Mirrored camera coordinates
    // When my hand moves right on screen, normX goes from 1 to 0 due to mirror.
    // So X should be mapped from 1 to 0 -> -Width/2 to Width/2
    const targetX = -(payload.position.x - 0.5) * viewWidth;
    const targetY = -(payload.position.y - 0.5) * viewHeight;

    if (!targetState.visible) {
        // Even if invisible, we can resurrect it
        checkVirtualButtons(payload);
        return; 
    }

    if (payload.gesture === 'HOVER') {
        targetState.x = targetX;
        targetState.y = targetY;
        
    } else if (payload.gesture === 'GRAB') {
        // Dragging and Rotating
        // Rotate the sphere based on hand movement
        targetState.rotationY += (targetX - targetState.x) * 0.5;
        targetState.x = targetX;
        targetState.y = targetY;
        
    } else if (payload.gesture === 'PINCH') {
        // Scale logic based on Y axis moving up/down while pinching, or button click
        // Map Y position to a scale multiplier
        const pinchScaleInput = 1.0 + (targetY * 0.2);
        targetState.scaleMult = Math.max(0.2, Math.min(3.0, pinchScaleInput));
        
        targetState.x = targetX;
        targetState.y = targetY;

        checkVirtualButtons(payload);
    }
}

function checkVirtualButtons(payload) {
    const btnDestroy = document.getElementById('btn_destroy');
    const btnRecreate = document.getElementById('btn_recreate');
    
    // Check if the palm's screen X/Y (not the mirrored 3D coordinate) hits the button bounds
    const screenX = payload.position.x * window.innerWidth;
    const screenY = payload.position.y * window.innerHeight;

    // elementsFromPoint can be tricky with pointer-events:none on overlays.
    // Let's use simple bounding box check
    const destroyRect = btnDestroy.getBoundingClientRect();
    const recreateRect = btnRecreate.getBoundingClientRect();

    if (intersectRect(screenX, screenY, destroyRect)) {
        btnDestroy.classList.add('active');
        destroyHologram();
        setTimeout(() => btnDestroy.classList.remove('active'), 500);
    } else if (intersectRect(screenX, screenY, recreateRect)) {
        btnRecreate.classList.add('active');
        recreateHologram();
        setTimeout(() => btnRecreate.classList.remove('active'), 500);
    }
}

function intersectRect(x, y, rect) {
    // Add some padding to the rect for easier clicking with hand tracking
    const pad = 40;
    return (x > rect.left - pad && x < rect.right + pad && y > rect.top - pad && y < rect.bottom + pad);
}

function destroyHologram() {
    targetState.visible = false;
}

function recreateHologram() {
    targetState.visible = true;
    targetState.x = 0;
    targetState.y = 0;
    targetState.scaleMult = 1.0;
    
    // Instantly reset visual tracking for cool spawn effect
    currentState.scaleMult = 0.01; 
    currentState.x = 0;
    currentState.y = 0;
}

function animate() {
    requestAnimationFrame(animate);

    // Default spin
    outerShell.rotation.y += 0.005;
    outerShell.rotation.x += 0.002;
    energyCore.rotation.y -= 0.01;

    // Lerp to target state
    currentState.x += (targetState.x - currentState.x) * LERP_FACTOR;
    currentState.y += (targetState.y - currentState.y) * LERP_FACTOR;
    
    // If hidden, shrink to 0
    let targetVisualScale = targetState.visible ? targetState.scaleMult : 0.0;
    currentState.scaleMult += (targetVisualScale - currentState.scaleMult) * (LERP_FACTOR * 1.5);
    
    currentState.rotationY += (targetState.rotationY - currentState.rotationY) * LERP_FACTOR;

    // Apply states
    hologramGroup.position.x = currentState.x;
    hologramGroup.position.y = currentState.y;
    hologramGroup.rotation.y = currentState.rotationY;
    
    hologramGroup.scale.set(currentState.scaleMult, currentState.scaleMult, currentState.scaleMult);

    renderer.render(scene, camera);
}

// Boot up
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThreeJS);
} else {
    initThreeJS();
}
