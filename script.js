const videoElement = document.getElementById('inputVideo');
const canvasElement = document.getElementById('outputCanvas');
const canvasCtx = canvasElement.getContext('2d');
const volumeKnob = document.getElementById('volumeKnob');
const volumeValue = document.getElementById('volumeValue');
const volumeIcon = document.getElementById('volumeIcon');
const demoAudio = document.getElementById('demoAudio');
const playBtn = document.getElementById('playBtn');

let isPlaying = false;
let currentVolume = 50; // 0 to 100
let isPinching = false;
let startAngle = 0;
let startVolume = 50;

// Initialize Knob Rotation
function updateKnob(vol) {
    // Map volume 0-100 to rotation -135deg to 135deg (total 270deg range)
    // 0 -> -135
    // 50 -> 0
    // 100 -> 135
    const degrees = (vol / 100) * 270 - 135;
    volumeKnob.style.transform = `rotate(${degrees}deg)`;
    volumeValue.textContent = `${Math.round(vol)}`;

    // Update audio volume
    if (demoAudio) {
        demoAudio.volume = vol / 100;
    }

    // Color Interpolation
    // 0: White (255, 255, 255)
    // 33: Green (0, 255, 0)
    // 66: Yellow (255, 255, 0)
    // 100: Red (255, 0, 0)

    let r, g, b;

    if (vol < 33) {
        // White -> Green
        // White: 255, 255, 255
        // Green: 0, 255, 0
        // R: 255 -> 0
        // G: 255 -> 255
        // B: 255 -> 0
        const t = vol / 33;
        r = Math.round(255 * (1 - t));
        g = 255;
        b = Math.round(255 * (1 - t));
    } else if (vol < 66) {
        // Green -> Yellow
        // Green: 0, 255, 0
        // Yellow: 255, 255, 0
        // R: 0 -> 255
        // G: 255 -> 255
        // B: 0 -> 0
        const t = (vol - 33) / 33;
        r = Math.round(255 * t);
        g = 255;
        b = 0;
    } else {
        // Yellow -> Red
        // Yellow: 255, 255, 0
        // Red: 255, 0, 0
        // R: 255 -> 255
        // G: 255 -> 0
        // B: 0 -> 0
        const t = (vol - 66) / 34; // 100 - 66 = 34
        r = 255;
        g = Math.round(255 * (1 - t));
        b = 0;
    }

    const color = `rgb(${r}, ${g}, ${b})`;
    volumeKnob.style.setProperty('--accent-color', color);
}

// Initial set
updateKnob(currentVolume);

// Audio Control
playBtn.addEventListener('click', () => {
    if (isPlaying) {
        demoAudio.pause();
        playBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
    } else {
        demoAudio.play().catch(e => console.log("Audio play failed, likely interaction needed", e));
        playBtn.innerHTML = '<span class="material-icons">stop</span>';
    }
    isPlaying = !isPlaying;
});

// MediaPipe Hands Setup
function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
                { color: '#00FF00', lineWidth: 5 });
            drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });


            // Logic for "Open Hand" Control
            // To detect if user is holding a knob (active), we check if hand is OPEN.
            // Fist (Closed Hand) = STOP.

            const wrist = landmarks[0];
            const indexMCP = landmarks[5];
            const indexTip = landmarks[8];
            const middleMCP = landmarks[9];

            if (wrist && indexMCP && indexTip && middleMCP) {
                // Calculate Palm Ratio (Reference Size)
                const palmSize = Math.sqrt(
                    Math.pow(indexMCP.x - wrist.x, 2) +
                    Math.pow(indexMCP.y - wrist.y, 2)
                );

                // Calculate Tip Distance
                const tipDist = Math.sqrt(
                    Math.pow(indexTip.x - wrist.x, 2) +
                    Math.pow(indexTip.y - wrist.y, 2)
                );

                // Threshold: We want "Open Hand" to be Active, "Fist" to be Inactive.
                // Extended hand Tip Distance is usually > 2.0x Palm Size.
                // Fist is < 1.5x.
                const FIST_THRESHOLD = 1.6;

                if (tipDist > palmSize * FIST_THRESHOLD) {
                    // OPEN HAND: Active Volume Control

                    // Calculate Rotation using Wrist -> MiddleMCP vector
                    // This vector represents hand orientation in 2D plane
                    const aspectRatio = canvasElement.width / canvasElement.height;
                    const dx = (middleMCP.x - wrist.x) * aspectRatio;
                    const dy = middleMCP.y - wrist.y;

                    const currentAngle = Math.atan2(dy, dx);

                    if (!isPinching) {
                        // Just opened hand - lock state
                        isPinching = true;
                        startAngle = currentAngle;
                        startVolume = currentVolume;
                        volumeKnob.classList.add('active');
                    } else {
                        // Rotating
                        let deltaAngle = currentAngle - startAngle;

                        if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
                        if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

                        // Sensitivity 
                        const sensitivity = 80;
                        const volChange = -(deltaAngle * sensitivity);

                        // Calculate RAW target volume based on gesture
                        let targetVol = startVolume + volChange;
                        targetVol = Math.max(0, Math.min(100, targetVol));

                        // SMOOTHING: Lerp (Linear Interpolation)
                        // This filters out jitter/flicker
                        // Factor 0.1 = Very smooth, slow
                        // Factor 0.5 = Responsive, some jitter
                        // Factor 0.15 = Balanced
                        currentVolume = currentVolume + (targetVol - currentVolume) * 0.15;

                        updateKnob(currentVolume);
                    }
                } else {
                    // FIST (Closed Hand) - Inactive/Pause
                    isPinching = false;
                    volumeKnob.classList.remove('active');

                    // Snap to rounded value when releasing to stop micro-drifts
                    currentVolume = Math.round(currentVolume);
                    updateKnob(currentVolume);
                }
            }
        }
    }
    canvasCtx.restore();
}

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

// Camera Setup
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

camera.start();
