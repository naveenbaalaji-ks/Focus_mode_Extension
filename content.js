chrome.storage.local.get(['blockedSites', 'timerActive', 'bypassedUntil', 'stats'], (data) => {
    const currentDomain = window.location.hostname.toLowerCase();
    const now = Date.now();
    const isBypassed = data.bypassedUntil && data.bypassedUntil[currentDomain] > now;

    if (data.timerActive && !isBypassed) {
        const sites = data.blockedSites || [];
        if (sites.some(site => currentDomain.includes(site))) {
            window.stop(); 
            injectBlockPage(data.stats, currentDomain);
        }
    }
});

function injectBlockPage(stats, domain) {
    document.documentElement.innerHTML = ''; 
    const xp = stats?.xp || 0;
    const level = Math.floor(Math.sqrt(xp / 100)) + 1;
    
    // UPDATED PET TIERS HERE
    const emoji = level >= 20 ? '🦄' : level >= 15 ? '🐉' : level >= 10 ? '🦅' : level >= 6 ? '🐥' : level >= 3 ? '🐣' : '🥚';

    const container = document.createElement('div');
    container.className = 'block-wrapper';
    container.innerHTML = `
        <div class="block-card">
            <div class="pet-emoji">${emoji}</div>
            <h1 class="block-title">Focus Mode Active</h1>
            <p class="block-subtitle">Your companion blocked <b>${domain}</b>. Get back to work!</p>
            <div id="action-buttons">
                <button class="btn" id="btn-return">Return to Task</button>
                <span class="bypass-link" id="btn-show-bypass">I really need this site...</span>
            </div>
            <div id="bypass-form" class="bypass-form">
                <div id="error-msg" class="error-msg">Please provide a valid reason (10+ chars).</div>
                <textarea id="reason-input" placeholder="Reason for bypassing?"></textarea>
                <button class="btn" style="background:var(--border); color:white;" id="btn-submit-bypass">Submit & Enter (5 mins)</button>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    document.getElementById('btn-return').onclick = () => {
        chrome.runtime.sendMessage({ action: 'closeTab' });
        window.location.href = "https://www.google.com";
    };

    document.getElementById('btn-show-bypass').onclick = () => {
        document.getElementById('action-buttons').style.display = 'none';
        document.getElementById('bypass-form').style.display = 'block';
    };

    document.getElementById('btn-submit-bypass').onclick = () => {
        if (document.getElementById('reason-input').value.trim().length < 10) { 
            document.getElementById('error-msg').style.display = 'block'; return; 
        }
        chrome.storage.local.get(['bypassedUntil'], (d) => {
            const bypasses = d.bypassedUntil || {};
            bypasses[domain] = Date.now() + 300000; // 5 minutes
            chrome.storage.local.set({ bypassedUntil: bypasses }, () => {
                window.location.reload();
            });
        });
    };
}