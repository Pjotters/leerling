// DOM Elements
const studyUrlInput = document.getElementById('studyUrl');
const gameUrlInput = document.getElementById('gameUrl');
const startButton = document.getElementById('startButton');
const inputContainer = document.getElementById('inputContainer');
const contentContainer = document.getElementById('contentContainer');
const studyFrame = document.getElementById('studyFrame');
const gameFrame = document.getElementById('gameFrame');
const gameContent = document.getElementById('gameContent');
const toggleButton = document.getElementById('toggleButton');
const backButton = document.getElementById('backButton');
const recentStudyUrls = document.getElementById('recentStudyUrls');
const recentGameUrls = document.getElementById('recentGameUrls');

// Constants
const MAX_RECENT_URLS = 5;
const STORAGE_KEY_STUDY = 'recentStudyUrls';
const STORAGE_KEY_GAME = 'recentGameUrls';

// Load recent URLs from localStorage
let recentStudyUrlsList = JSON.parse(localStorage.getItem(STORAGE_KEY_STUDY) || '[]');
let recentGameUrlsList = JSON.parse(localStorage.getItem(STORAGE_KEY_GAME) || '[]');

// Update recent URLs display
function updateRecentUrls() {
    recentStudyUrls.innerHTML = '<h4>Recent Study URLs:</h4>' + 
        recentStudyUrlsList.map(url => `<div class="recent-url" onclick="loadUrls('${url}', null)">${url}</div>`).join('');
    
    recentGameUrls.innerHTML = '<h4>Recent Game URLs:</h4>' + 
        recentGameUrlsList.map(url => `<div class="recent-url" onclick="loadUrls(null, '${url}')">${url}</div>`).join('');
}

// Add URL to recent list
function addToRecent(url, isStudy) {
    const list = isStudy ? recentStudyUrlsList : recentGameUrlsList;
    const key = isStudy ? STORAGE_KEY_STUDY : STORAGE_KEY_GAME;
    
    if (!url) return;

    // Remove if exists and add to front
    const index = list.indexOf(url);
    if (index > -1) list.splice(index, 1);
    list.unshift(url);
    
    // Keep only MAX_RECENT_URLS items
    if (list.length > MAX_RECENT_URLS) list.pop();
    
    // Save to localStorage
    localStorage.setItem(key, JSON.stringify(list));
    updateRecentUrls();
}

// Update browser URL and title
function updateBrowserUrl(url) {
    if (!url) return;
    
    try {
        const urlObj = new URL(url);
        window.history.pushState({}, '', url);
        document.title = urlObj.hostname;
    } catch (e) {
        console.error('Invalid URL:', e);
    }
}

// Load URLs into frames
function loadUrls(studyUrl = null, gameUrl = null) {
    if (!studyUrl) studyUrl = studyUrlInput.value;
    if (!gameUrl) gameUrl = gameUrlInput.value;
    
    if (!studyUrl && !gameUrl) {
        alert('Voer tenminste één URL in!');
        return;
    }

    // Show content container first
    inputContainer.classList.add('hidden');
    contentContainer.classList.remove('hidden');

    // Load study URL
    if (studyUrl) {
        studyFrame.src = studyUrl;
        studyUrlInput.value = studyUrl;
        addToRecent(studyUrl, true);
        updateBrowserUrl(studyUrl);
    }
    
    // Load game URL with a slight delay to ensure proper loading
    if (gameUrl) {
        setTimeout(() => {
            gameFrame.src = gameUrl;
            gameUrlInput.value = gameUrl;
            addToRecent(gameUrl, false);
        }, 500);
    }
}

// Toggle game overlay
function toggleGame() {
    const isActive = gameContent.classList.toggle('active');
    if (isActive) {
        gameContent.style.display = 'block';
        setTimeout(() => {
            gameContent.style.opacity = '1';
        }, 50);
    } else {
        gameContent.style.opacity = '0';
        setTimeout(() => {
            gameContent.style.display = 'none';
        }, 300);
    }
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        toggleGame();
    }
});

toggleButton.addEventListener('click', toggleGame);

backButton.addEventListener('click', () => {
    contentContainer.classList.add('hidden');
    inputContainer.classList.remove('hidden');
    // Reset URL and title
    window.history.pushState({}, '', window.location.pathname);
    document.title = 'URLusion - The Pjotters-Company';
});

startButton.addEventListener('click', () => loadUrls());

// Initialize recent URLs display
updateRecentUrls();
