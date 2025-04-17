// Face detection configuration
const DETECTION_INTERVAL = 100; // Check every 100ms
const LOCKDOWN_THRESHOLD = 3; // Number of detections needed to trigger lockdown
const FACE_CAPTURE_SIZE = 150; // Size of the face capture square
let detectionCount = 0;
let isLockdownActive = false;
let isProtectionEnabled = true;

// Get DOM elements
const aiToggle = document.getElementById('aiProtectionToggle');
const cameraContainer = document.getElementById('cameraContainer');
const capturedFace = document.getElementById('capturedFace');
const captureCanvas = document.getElementById('captureCanvas');

// Initialize capture canvas
captureCanvas.width = FACE_CAPTURE_SIZE;
captureCanvas.height = FACE_CAPTURE_SIZE;

// Initialize face detection
async function initFaceDetection() {
    try {
        // Load AI models
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');

        // Set up toggle event listener
        aiToggle.addEventListener('change', handleProtectionToggle);

        if (aiToggle.checked) {
            await startCamera();
        }
    } catch (error) {
        console.error('Error initializing face detection:', error);
        document.getElementById('cameraStatus').textContent = 'Camera niet beschikbaar';
    }
}

// Handle protection toggle
async function handleProtectionToggle() {
    isProtectionEnabled = aiToggle.checked;
    if (isProtectionEnabled) {
        await startCamera();
    } else {
        stopCamera();
    }
}

// Start camera
async function startCamera() {
    try {
        const video = document.getElementById('cameraFeed');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'user',
                width: { ideal: 320 },
                height: { ideal: 240 }
            } 
        });
        video.srcObject = stream;
        cameraContainer.style.display = 'block';

        // Start detection when video is playing
        video.addEventListener('play', startFaceDetection);
    } catch (error) {
        console.error('Error starting camera:', error);
        document.getElementById('cameraStatus').textContent = 'Camera niet beschikbaar';
    }
}

// Stop camera
function stopCamera() {
    const video = document.getElementById('cameraFeed');
    const stream = video.srcObject;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    video.srcObject = null;
    cameraContainer.style.display = 'none';
}

// Start continuous face detection
async function startFaceDetection() {
    const video = document.getElementById('cameraFeed');
    const canvas = document.getElementById('cameraOverlay');
    const status = document.getElementById('cameraStatus');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    async function detect() {
        if (!isProtectionEnabled || isLockdownActive) return;

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

            // Draw red circle around face
            detections.forEach(detection => {
                const box = detection.detection.box;
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 3;
                ctx.beginPath();
                const centerX = box.x + box.width / 2;
                const centerY = box.y + box.height / 2;
                const radius = Math.max(box.width, box.height) / 2 + 10;
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.stroke();
            });

            if (detectionCount >= LOCKDOWN_THRESHOLD) {
                // Capture face before lockdown
                const detection = detections[0].detection;
                captureFace(video, detection.box);
                activateLockdown();
                return;
            }
        } else {
            // Reset if no face detected
            detectionCount = Math.max(0, detectionCount - 1);
            status.textContent = '✓ Veilig';
            status.style.color = 'var(--success-color)';
        }

        // Continue detection if protection is enabled
        if (isProtectionEnabled) {
            setTimeout(detect, DETECTION_INTERVAL);
        }
    }

    detect();
}

// Capture face image
function captureFace(video, box) {
    const ctx = captureCanvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, FACE_CAPTURE_SIZE, FACE_CAPTURE_SIZE);

    // Calculate source and destination rectangles for centered face capture
    const size = Math.max(box.width, box.height) * 1.5;
    const sx = box.x + box.width/2 - size/2;
    const sy = box.y + box.height/2 - size/2;

    ctx.drawImage(video, sx, sy, size, size, 0, 0, FACE_CAPTURE_SIZE, FACE_CAPTURE_SIZE);
    
    // Add red overlay
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(0, 0, FACE_CAPTURE_SIZE, FACE_CAPTURE_SIZE);

    // Show captured face
    capturedFace.classList.remove('hidden');
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

    // Play alert sound
    const alertSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVK/n77BdGAg+ltryxnMpBSl+zPLaizsIGGS57OihUBELTKXh8bllHgU2jdXzzn0vBSF1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z1YU2Bhxqvu7mnEoODlGt5fCzYBoGPJPY88p2KwUme8rx3I4+CRZiturqpVITC0mi4PK8aB8GM4nU8tGAMQYfcsLu45hEDBFYr+btrVoXCECY3PLEcSYELIHO8diJOQgZaLvt559NEAxPqOPwtmMcBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hVFApGnt/yvmwhBTCG0fPTgjQGHm7A7eSaSQ0PVK/n77BdGAg+ltrzxnUoBSh+zPLaizsIGGS57OihUBELTKXh8bllHgU1jdT0z3wvBSJ1xe/glEILElyx6OyrWRUIQ5zd8sFuJAUug8/z1YU2BhxpvujlnEoPDlGt5fCzYRoGPJPY88p3KgUme8rx3I4+CRVht+rqpVMSC0mi4PK8aiAFM4nT89GAMQYfccPu45hEDBFYr+btrVwWCECY3PLEcSYELIHO8diJOQgZZ7zs559NEAxPqOPwtmQbBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hWEwpGnt/yvmwhBTCG0fPTgzQGHm3A7eSaSQ0PVK/n77BdGAg+ltvyxnUoBSh9zfLaizsIGGS57OihUBELTKXh8blmHQU1jdT0z3wvBSJ0xe/glEILElyx6OyrWRUIRJzd8sFuJAUug8/z1YU2BhxpvujlnEoPDlGt5fCzYRoGPJPY88p3KgUmfMrx3I4+CRVht+rqpVMSC0mi4PK8aiAFM4nT89GAMQYfccPu45hEDBFYr+btrVwWCECY3PLEcSYELIHO8diJOQgZZ7zs559NEAxPqOPwtmQbBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hWEwpGnt/yvmwhBTCG0fPTgzQGHm3A7eSaSQ0PVK/n77BdGAg+ltvyxnUoBSh9zfLaizsIGGS57OihUBELTKXh8blmHQU1jdT0z3wvBSJ0xe/glEILElyx6OyrWRUIRJzd8sFuJAUug8/z1YU2BhxpvujlnEoPDlGt5fCzYRoGPJPY88p3KgUmfMrx3I4+CRVht+rqpVMSC0mi4PK8aiAFM4nT89GAMQYfccPu45hEDBFYr+btrVwWCECY3PLEcSYELIHO8diJOQgZZ7zs559NEAxPqOPxtmQbBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hWEwpGnt/yvmwhBTCG0fPTgzQGHm3A7eSaSQ0PVK/n77BdGAg+ltvyxnUoBSh9zfLaizsIGGS57OihUBELTKXh8blmHQU1jdT0z3wvBSJ0xe/glEILElyx6OyrWRUIRJzd8sFuJAUug8/z1YU2BhxpvujlnEoPDlGt5fCzYRoGPJPY88p3KgUmfMrx3I4+CRVht+rqpVMSC0mi4PK8aiAFM4nT89GAMQYfccPu45hEDBFYr+btrVwWCECY3PLEcSYELIHO8diJOQgZZ7zs559NEAxPqOPxtmQbBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hWEwpGnt/yvmwhBTCG0fPTgzQGHm3A7eSaSQ0PVK/n77BdGAg+ltvyxnUoBSh9zfLaizsIGGS57OihUBELTKXh8blmHQU1jdT0z3wvBSJ0xe/glEILElyx6OyrWRUIRJzd8sFuJAU=');
    alertSound.play();

    // Redirect after showing the captured face
    setTimeout(() => {
        if (studyUrl) {
            window.location.href = studyUrl;
        } else {
            window.location.reload();
        }
    }, 3000);
}
