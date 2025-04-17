// Face detection configuration
const DETECTION_INTERVAL = 100; // Check every 100ms
const LOCKDOWN_THRESHOLD = 3; // Number of detections needed to trigger lockdown
let detectionCount = 0;
let isLockdownActive = false;

// Initialize face detection
async function initFaceDetection() {
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');

        // Start video stream
        const video = document.getElementById('cameraFeed');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'user',
                width: { ideal: 320 },
                height: { ideal: 240 }
            } 
        });
        video.srcObject = stream;

        // Start detection when video is playing
        video.addEventListener('play', startFaceDetection);
    } catch (error) {
        console.error('Error initializing face detection:', error);
        document.getElementById('cameraStatus').textContent = 'Camera niet beschikbaar';
    }
}

// Start continuous face detection
async function startFaceDetection() {
    const video = document.getElementById('cameraFeed');
    const canvas = document.getElementById('cameraOverlay');
    const status = document.getElementById('cameraStatus');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    async function detect() {
        if (isLockdownActive) return;

        const detections = await faceapi.detectAllFaces(
            video, 
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks();

        // Clear previous drawings
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detections && detections.length > 0) {
            // Someone is looking at the screen
            detectionCount++;
            status.textContent = `⚠️ Iemand kijkt mee! (${detectionCount}/${LOCKDOWN_THRESHOLD})`;
            status.style.color = 'var(--error-color)';

            if (detectionCount >= LOCKDOWN_THRESHOLD) {
                activateLockdown();
                return;
            }
        } else {
            // Reset if no face detected
            detectionCount = Math.max(0, detectionCount - 1);
            status.textContent = '✓ Veilig';
            status.style.color = 'var(--success-color)';
        }

        // Draw face detections for debugging (only visible to user)
        faceapi.draw.drawDetections(canvas, detections);
        
        // Continue detection
        setTimeout(detect, DETECTION_INTERVAL);
    }

    detect();
}

// Activate lockdown mode
function activateLockdown() {
    isLockdownActive = true;
    const studyUrl = document.getElementById('studyUrl').value;
    
    // Hide game content immediately
    const gameContent = document.getElementById('gameContent');
    gameContent.style.display = 'none';
    gameContent.classList.remove('active');

    // Show lockdown message
    const lockdownOverlay = document.getElementById('lockdownOverlay');
    lockdownOverlay.classList.remove('hidden');

    // Redirect after a short delay
    setTimeout(() => {
        if (studyUrl) {
            window.location.href = studyUrl;
        } else {
            window.location.reload();
        }
    }, 2000);
}
