document.addEventListener('DOMContentLoaded', () => {
    const pet = document.getElementById('mini-pet');
    const zone = document.getElementById('interactive-zone');

    zone.addEventListener('mousemove', (e) => {
        const rect = pet.getBoundingClientRect();
        const angle = Math.atan2(e.clientY - (rect.top + rect.height / 2), e.clientX - (rect.left + rect.width / 2));
        const dist = Math.min(Math.hypot(e.clientX - (rect.left + rect.width / 2), e.clientY - (rect.top + rect.height / 2)) / 8, 15);
        pet.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) rotate(${angle * 10}deg)`;
    });
    
    zone.addEventListener('mouseleave', () => pet.style.transform = 'translate(0,0) rotate(0deg)');

    function updateUI() {
        chrome.storage.local.get(['timeLeft', 'timerActive', 'stats'], (data) => {
            const isActive = data.timerActive;

            // Display Logic for Custom Time vs Live Countdown
            document.getElementById('time-input-wrapper').style.display = isActive ? 'none' : 'flex';
            document.getElementById('timer-display').style.display = isActive ? 'block' : 'none';
            document.getElementById('start-btn').style.display = isActive ? 'none' : 'block';
            document.getElementById('stop-btn').style.display = isActive ? 'block' : 'none';
            // Note: The sound-choice dropdown remains visible at all times now!

            if (isActive) {
                const timeLeft = data.timeLeft !== undefined ? data.timeLeft : 1500;
                const minutes = Math.floor(timeLeft / 60);
                const seconds = (timeLeft % 60).toString().padStart(2, '0');
                document.getElementById('timer-display').textContent = `${minutes}:${seconds}`;
            }

            // Stats Update
            const stats = data.stats || { xp: 0, totalTime: 0, streak: 0 };
            document.getElementById('stat-streak').textContent = stats.streak;
            
            const hours = Math.floor(stats.totalTime / 3600);
            const mins = Math.floor((stats.totalTime % 3600) / 60);
            document.getElementById('stat-time').textContent = `${hours}h ${mins}m`;

            // Pet Update
            const level = Math.floor(Math.sqrt(stats.xp / 100)) + 1;
            document.getElementById('mini-level').textContent = `Level ${level}`;
            pet.textContent = level >= 20 ? '🦄' : level >= 15 ? '🐉' : level >= 10 ? '🦅' : level >= 6 ? '🐥' : level >= 3 ? '🐣' : '🥚';
        });
    }

    updateUI(); 
    setInterval(updateUI, 1000);

    // Dynamic Audio Switching Mid-Session
    document.getElementById('sound-choice').addEventListener('change', (e) => {
        const newSound = e.target.value;
        chrome.storage.local.get(['timerActive'], (data) => {
            if (data.timerActive) {
                chrome.runtime.sendMessage({ action: 'changeAudio', sound: newSound });
            }
        });
    });

    document.getElementById('start-btn').onclick = () => {
        const soundPath = document.getElementById('sound-choice').value;
        const customDuration = parseInt(document.getElementById('custom-time').value) || 25;
        chrome.runtime.sendMessage({ action: 'startTimer', duration: customDuration, sound: soundPath });
        updateUI();
    };

    document.getElementById('stop-btn').onclick = () => {
        chrome.runtime.sendMessage({ action: 'stopTimer' });
        updateUI();
    };

    document.getElementById('dash-btn').onclick = () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    };
});