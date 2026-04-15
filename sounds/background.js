let focusInterval = null;
let sessionStartTime = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startTimer') {
        startTimer(request.duration || 25, request.sound);
        sendResponse({ success: true });
    } else if (request.action === 'stopTimer') {
        stopSession(false); 
        sendResponse({ success: true });
    } else if (request.action === 'closeTab') {
        if (sender.tab && sender.tab.id) {
            chrome.tabs.remove(sender.tab.id);
        }
    } else if (request.action === 'changeAudio') {
        // Handles live audio switching mid-session
        if (request.sound && request.sound !== 'none') {
            createOffscreen().then(() => {
                chrome.runtime.sendMessage({ action: 'playAudio', source: request.sound }).catch(()=>{});
            });
        } else {
            chrome.runtime.sendMessage({ action: 'stopAudio' }).catch(()=>{});
        }
        sendResponse({ success: true });
    }
    return true; 
});

async function createOffscreen() {
    const existing = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
    if (existing.length > 0) return;
    await chrome.offscreen.createDocument({
        url: 'offscreen.html', reasons: ['AUDIO_PLAYBACK'], justification: 'Play background focus sounds'
    });
}

async function startTimer(minutes, soundPath) {
    if (focusInterval) clearInterval(focusInterval);
    if (soundPath && soundPath !== 'none') {
        await createOffscreen();
        chrome.runtime.sendMessage({ action: 'playAudio', source: soundPath }).catch(()=>{});
    }
    let timeLeft = minutes * 60;
    sessionStartTime = Date.now(); 
    chrome.storage.local.set({ timerActive: true, timeLeft: timeLeft });

    focusInterval = setInterval(() => {
        timeLeft--;
        chrome.storage.local.set({ timeLeft: timeLeft });
        if (timeLeft <= 0) stopSession(true); 
    }, 1000);
}

function stopSession(completedNaturally) {
    if (focusInterval) clearInterval(focusInterval);
    focusInterval = null;
    chrome.runtime.sendMessage({ action: 'stopAudio' }).catch(()=>{});

    let secondsSpent = 0;
    if (sessionStartTime) {
        secondsSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
        sessionStartTime = null; 
    }

    chrome.storage.local.get(['stats'], (data) => {
        let stats = data.stats || { xp: 0, coins: 0, sessions: 0, streak: 0, totalTime: 0 };
        stats.totalTime += secondsSpent;
        
        if (completedNaturally) {
            stats.xp += 50; 
            stats.coins += 20; 
            stats.sessions += 1; 
            stats.streak += 1;
        } else {
            stats.xp += Math.floor(secondsSpent / 60);
        }
        
        chrome.storage.local.set({ timerActive: false, timeLeft: 0, stats: stats });
    });
}
