const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const trackingStatus = document.getElementById('tracking_status');
const fpsCounter = document.getElementById('fps_counter');

// Telemetry DOM
const gestureModeEl = document.getElementById('gesture_mode');
const txEl = document.getElementById('t_x');
const tyEl = document.getElementById('t_y');
const tzEl = document.getElementById('t_z');

let lastFrameTime = performance.now();
let frameCount = 0;
let rotationAngle = 0; // for animating UI components

// Resize canvas to fill window
function resizeCanvas() {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
        calculateFPS();
    },
    width: 1280,
    height: 720
});
camera.start();

function calculateFPS() {
    frameCount++;
    const now = performance.now();
    if (now - lastFrameTime >= 1000) {
        fpsCounter.innerText = `${frameCount} FPS`;
        frameCount = 0;
        lastFrameTime = now;
    }
}

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw mirrored video background
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);
    
    // Maintain aspect ratio for video
    const videoRatio = results.image.width / results.image.height;
    const windowRatio = canvasElement.width / canvasElement.height;
    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

    if (windowRatio > videoRatio) {
        drawWidth = canvasElement.width;
        drawHeight = canvasElement.width / videoRatio;
        offsetY = (canvasElement.height - drawHeight) / 2;
    } else {
        drawWidth = canvasElement.height * videoRatio;
        drawHeight = canvasElement.height;
        offsetX = (canvasElement.width - drawWidth) / 2;
    }

    // Draw the camera feed very dimly for Stark aesthetic
    canvasCtx.globalAlpha = 0.3; 
    canvasCtx.drawImage(results.image, offsetX, offsetY, drawWidth, drawHeight);
    canvasCtx.globalAlpha = 1.0;

    // Apply Stark Filter (vignette / color tint effect)
    canvasCtx.fillStyle = 'rgba(5, 10, 14, 0.6)';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Calculate global time for animations
    rotationAngle += 0.02;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        if (trackingStatus.innerText !== "ACQUIRED") {
            trackingStatus.innerText = "ACQUIRED";
            trackingStatus.className = "value success";
        }

        for (const landmarks of results.multiHandLandmarks) {
            drawKinematicDashboard(landmarks, drawWidth, drawHeight, offsetX, offsetY);
        }
    } else {
        if (trackingStatus.innerText !== "SEARCHING...") {
            trackingStatus.innerText = "SEARCHING...";
            trackingStatus.className = "value highlight pulsing";
        }
    }
    
    canvasCtx.restore();
}

function drawKinematicDashboard(landmarks, drawWidth, drawHeight, offsetX, offsetY) {
    // Map normalized landmarks to canvas coordinates
    const mappedLandmarks = landmarks.map(lm => ({
        x: lm.x * drawWidth + offsetX,
        y: lm.y * drawHeight + offsetY,
        z: lm.z
    }));

    // Find center of palm (avg of WRIST [0], INDEX_MCP [5], and PINKY_MCP [17])
    const wrist = mappedLandmarks[0];
    const indexMcp = mappedLandmarks[5];
    const pinkyMcp = mappedLandmarks[17];
    const middleMcp = mappedLandmarks[9];

    const palmX = (wrist.x + indexMcp.x + pinkyMcp.x) / 3;
    const palmY = (wrist.y + indexMcp.y + pinkyMcp.y) / 3;
    const palmZ = (wrist.z + indexMcp.z + pinkyMcp.z) / 3;

    // Calculate rotation angle of the hand (WRIST to MIDDLE_MCP)
    const handAngle = Math.atan2(middleMcp.y - wrist.y, middleMcp.x - wrist.x);

    // GESTURE RECOGNITION
    const thumbTip = mappedLandmarks[4];
    const indexTip = mappedLandmarks[8];
    const get2DDistance = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    
    // Pinch detection (Thumb tip to Index tip)
    const pinchDistance = get2DDistance(thumbTip, indexTip);
    
    // Grab detection (Average distance of fingertips to palm)
    const middleTip = mappedLandmarks[12];
    const ringTip = mappedLandmarks[16];
    const pinkyTip = mappedLandmarks[20];
    const grabDist = (get2DDistance(indexTip, wrist) + get2DDistance(middleTip, wrist) + get2DDistance(ringTip, wrist) + get2DDistance(pinkyTip, wrist)) / 4;
    
    // Determine State based on thresholds (thresholds in pixels)
    // Scale thresholds roughly based on hand size
    const handSize = get2DDistance(wrist, middleMcp);
    let gesture = "HOVER";
    let uiColor = "#00f0ff"; // default cyan
    let uiColorDim = "rgba(0, 240, 255, 0.3)";
    let gestureClass = "value success";

    if (pinchDistance < handSize * 0.4) {
        gesture = "PINCH";
        uiColor = "#ff3366"; // Red for clicking
        uiColorDim = "rgba(255, 51, 102, 0.3)";
        gestureClass = "value danger";
    } else if (grabDist < handSize * 1.2) {
        gesture = "GRAB";
        uiColor = "#ff9900"; // Orange for grabbing
        uiColorDim = "rgba(255, 153, 0, 0.3)";
        gestureClass = "value warning pulsing";
    }

    // Update Telemetry GUI
    if (gestureModeEl.innerText !== gesture) {
        gestureModeEl.innerText = gesture;
        gestureModeEl.className = gestureClass;
    }
    
    // Convert to normalized coordinates for output (0.0 to 1.0)
    const normX = palmX / drawWidth;
    const normY = palmY / drawHeight;
    txEl.innerText = normX.toFixed(3);
    tyEl.innerText = normY.toFixed(3);
    tzEl.innerText = palmZ.toFixed(3);

    // Broadcast Event for Admin Panel Integration
    const payload = {
        gesture: gesture,
        position: { x: normX, y: normY, z: palmZ },
        rotation: handAngle,
        pinchScale: pinchDistance / handSize
    };
    window.dispatchEvent(new CustomEvent('PalmReader3DControl', { detail: payload }));

    // Render Palm Radial Interface
    canvasCtx.save();
    canvasCtx.translate(palmX, palmY);
    
    // The canvas was mirrored (-1, 1), so to draw text properly we must flip X back temporarily for text
    canvasCtx.scale(-1, 1);
    
    // Reverse the angle for visual compensation because of mirror
    const visualAngle = -handAngle + Math.PI/2; 
    canvasCtx.rotate(visualAngle);

    drawStarkCircuits(uiColor, uiColorDim);
    
    canvasCtx.restore();

    // Draw connecting lines to fingertips
    drawFingerLinks(mappedLandmarks, palmX, palmY);
}

function drawStarkCircuits(cyan = '#00f0ff', cyanDim = 'rgba(0, 240, 255, 0.3)') {
    canvasCtx.shadowColor = cyan;
    canvasCtx.shadowBlur = 15;

    // Inner glowing ring
    canvasCtx.beginPath();
    canvasCtx.arc(0, 0, 40, 0, 2 * Math.PI);
    canvasCtx.strokeStyle = cyan;
    canvasCtx.lineWidth = 2;
    canvasCtx.stroke();

    // Inner rotating dashed ring
    canvasCtx.save();
    canvasCtx.rotate(rotationAngle * 2);
    canvasCtx.setLineDash([10, 15]);
    canvasCtx.beginPath();
    canvasCtx.arc(0, 0, 55, 0, 2 * Math.PI);
    canvasCtx.strokeStyle = cyan;
    canvasCtx.lineWidth = 3;
    canvasCtx.stroke();
    canvasCtx.restore();

    // Outer rotating tech arcs
    canvasCtx.save();
    canvasCtx.rotate(-rotationAngle * 1.5);
    canvasCtx.setLineDash([]);
    canvasCtx.beginPath();
    canvasCtx.arc(0, 0, 80, 0, Math.PI * 0.7);
    canvasCtx.strokeStyle = cyanDim;
    canvasCtx.lineWidth = 8;
    canvasCtx.stroke();

    canvasCtx.beginPath();
    canvasCtx.arc(0, 0, 80, Math.PI, Math.PI * 1.5);
    canvasCtx.strokeStyle = cyan;
    canvasCtx.lineWidth = 4;
    canvasCtx.stroke();
    canvasCtx.restore();
    
    // Outer dashed boundary
    canvasCtx.save();
    canvasCtx.rotate(rotationAngle * 0.5);
    canvasCtx.setLineDash([2, 5]);
    canvasCtx.beginPath();
    canvasCtx.arc(0, 0, 110, 0, 2 * Math.PI);
    canvasCtx.strokeStyle = cyanDim;
    canvasCtx.lineWidth = 1;
    canvasCtx.stroke();
    canvasCtx.restore();

    // Center UI elements
    canvasCtx.fillStyle = cyan;
    canvasCtx.shadowBlur = 0;
    canvasCtx.beginPath();
    canvasCtx.arc(0, 0, 5, 0, 2 * Math.PI);
    canvasCtx.fill();

    // Text Overlay
    canvasCtx.font = "12px 'Share Tech Mono'";
    canvasCtx.fillStyle = cyan;
    canvasCtx.textAlign = "center";
    canvasCtx.fillText("PALM READER", 0, -20);
    canvasCtx.fillText("SYS.ACTIVE", 0, 30);
}

function drawFingerLinks(lm, palmX, palmY) {
    const cyan = '#00f0ff';
    const fingertips = [
        { name: "THUMB", id: 4 },
        { name: "INDEX", id: 8 },
        { name: "MIDDLE", id: 12 },
        { name: "RING", id: 16 },
        { name: "PINKY", id: 20 }
    ];

    canvasCtx.lineWidth = 1;

    fingertips.forEach(finger => {
        const point = lm[finger.id];
        
        // Draw line from palm to fingertip
        canvasCtx.beginPath();
        canvasCtx.moveTo(palmX, palmY);
        // Due to the mirroring effect `scale(-1, 1)` set globally in onResults,
        // we use the X and Y directly, but remember that the canvas context has scale(-1, 1) applied,
        // so to draw to positive coordinates from palmX, we just use the raw mapped coordinates.
        // Wait, palmX and point.x are already raw mapped coordinates. 
        // We shouldn't translate here, we should just lineTo.
        
        // But since we applied canvasCtx.scale(-1, 1) earlier globally over the whole canvas...
        // The mappedLandmarks were mapped WITHOUT considering scale(-1, 1).
        // BUT wait:
        // canvasCtx.translate(width, 0);
        // canvasCtx.scale(-1, 1);
        // This means a point at (x, y) visually appears at (width - x, y).
        // If we just use lineTo(point.x, point.y), it will be drawn at (width - point.x, point.y).
        
        // Let's modify mappedLandmarks coordinates X so they represent the visual position under normal scaling?
        // No, we are drawing inside the mirrored context! 
        // So we just draw to point.x and point.y because the context mirrors it for us perfectly!
        
        canvasCtx.lineTo(point.x, point.y);
        
        // Gradient line
        const grad = canvasCtx.createLinearGradient(palmX, palmY, point.x, point.y);
        grad.addColorStop(0, 'rgba(0, 240, 255, 0.1)');
        grad.addColorStop(1, 'rgba(0, 240, 255, 0.8)');
        canvasCtx.strokeStyle = grad;
        canvasCtx.stroke();

        // Fingertip Node
        canvasCtx.beginPath();
        canvasCtx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        canvasCtx.fillStyle = cyan;
        canvasCtx.fill();
        
        // Fingertip Label
        // To draw text properly (un-mirrored text), we need to save, translate to point, flip, draw text, restore
        canvasCtx.save();
        canvasCtx.translate(point.x, point.y);
        canvasCtx.scale(-1, 1);
        canvasCtx.font = "10px 'Share Tech Mono'";
        canvasCtx.fillStyle = "rgba(0, 240, 255, 0.8)";
        canvasCtx.textAlign = "left";
        canvasCtx.fillText(finger.name + "_TRK", 10, -5);
        
        // Crosshair
        canvasCtx.strokeStyle = cyan;
        canvasCtx.lineWidth = 0.5;
        canvasCtx.beginPath();
        canvasCtx.moveTo(-10, 0); canvasCtx.lineTo(10, 0);
        canvasCtx.moveTo(0, -10); canvasCtx.lineTo(0, 10);
        canvasCtx.stroke();

        canvasCtx.restore();
    });
}
