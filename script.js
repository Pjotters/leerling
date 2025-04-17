// DOM Elements
const studyUrlInput = document.getElementById('studyUrl');
const gameUrlInput = document.getElementById('gameUrl');
const startButton = document.getElementById('startButton');
const contentFrame = document.getElementById('contentFrame');
const studyFrame = document.getElementById('studyFrame');
const gameFrame = document.getElementById('gameFrame');
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
function addToRecent(url, isStydy) {
    const list = isStydy ? recentStudyUrlsList : recentGameUrlsList;
    const key = isStydy ? STORAGE_KEY_STUDY : STORAGE_KEY_GAME;
    
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

// Load URLs into frames
function loadUrls(studyUrl = null, gameUrl = null) {
    if (studyUrl) {
        studyUrlInput.value = studyUrl;
        studyFrame.src = studyUrl;
        addToRecent(studyUrl, true);
    }
    
    if (gameUrl) {
        gameUrlInput.value = gameUrl;
        gameFrame.src = gameUrl;
        addToRecent(gameUrl, false);
    }
    
    if (studyUrl || gameUrl) {
        contentFrame.classList.remove('hidden');
    }
}

// Toggle game overlay with keyboard shortcut (Ctrl + Space)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        gameFrame.classList.toggle('active');
    }
});

// Start button click handler
startButton.addEventListener('click', () => {
    const studyUrl = studyUrlInput.value;
    const gameUrl = gameUrlInput.value;
    
    if (!studyUrl && !gameUrl) {
        alert('Voer tenminste één URL in!');
        return;
    }
    
    loadUrls(studyUrl, gameUrl);
});

// Initialize recent URLs display
updateRecentUrls();
