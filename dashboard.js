document.addEventListener('DOMContentLoaded', () => {
    
    function loadDashboardData() {
        chrome.storage.local.get(['stats', 'blockedSites', 'customRewards'], (data) => {
            // Load Stats
            let stats = data.stats || { xp: 0, coins: 0, sessions: 0, streak: 0, totalTime: 0 };
            
            const hours = Math.floor(stats.totalTime / 3600);
            const mins = Math.floor((stats.totalTime % 3600) / 60);
            document.getElementById('dash-total-time').textContent = `${hours}h ${mins}m`;
            document.getElementById('dash-streak').textContent = `${stats.streak} 🔥`;
            document.getElementById('dash-sessions').textContent = stats.sessions;
            document.getElementById('dash-coins').textContent = `${stats.coins} 🪙`;

            // Load Pet Data & New Pet Tiers
            const currentLevel = Math.floor(Math.sqrt(stats.xp / 100)) + 1;
            const xpForNextLevel = Math.pow(currentLevel, 2) * 100;
            const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
            
            const progressInLevel = stats.xp - xpForCurrentLevel;
            const totalLevelXp = xpForNextLevel - xpForCurrentLevel;
            const progressPercent = (progressInLevel / totalLevelXp) * 100;

            document.getElementById('dash-level').textContent = `Level ${currentLevel}`;
            document.getElementById('dash-xp-text').textContent = `${Math.floor(progressInLevel)} / ${totalLevelXp} XP to next level`;
            document.getElementById('xp-bar').style.width = `${progressPercent}%`;

            const petEmoji = currentLevel >= 20 ? '🦄' : currentLevel >= 15 ? '🐉' : currentLevel >= 10 ? '🦅' : currentLevel >= 6 ? '🐥' : currentLevel >= 3 ? '🐣' : '🥚';
            document.getElementById('dash-pet').textContent = petEmoji;

            // Unlock Pet Gallery items
            if(currentLevel >= 3) document.getElementById('pet-slot-3').classList.add('unlocked');
            if(currentLevel >= 6) document.getElementById('pet-slot-6').classList.add('unlocked');
            if(currentLevel >= 10) document.getElementById('pet-slot-10').classList.add('unlocked');
            if(currentLevel >= 15) document.getElementById('pet-slot-15').classList.add('unlocked');
            if(currentLevel >= 20) document.getElementById('pet-slot-20').classList.add('unlocked');

            // Load Blocked Sites
            const sites = data.blockedSites || [];
            const siteList = document.getElementById('site-list');
            siteList.innerHTML = '';
            sites.forEach((site, index) => {
                const li = document.createElement('li');
                li.className = 'site-item';
                li.innerHTML = `
                    <span>${site}</span>
                    <button class="remove-btn" data-index="${index}">Remove</button>
                `;
                siteList.appendChild(li);
            });

            document.querySelectorAll('.remove-btn').forEach(btn => {
                btn.onclick = (e) => {
                    const idx = e.target.getAttribute('data-index');
                    sites.splice(idx, 1);
                    chrome.storage.local.set({ blockedSites: sites }, loadDashboardData);
                };
            });

            // Load Custom Rewards
            const rewards = data.customRewards || [];
            const shopList = document.getElementById('shop-list');
            shopList.innerHTML = '';
            rewards.forEach((reward, index) => {
                const li = document.createElement('li');
                li.className = 'site-item';
                li.innerHTML = `
                    <span style="flex:1;"><b>${reward.name}</b></span>
                    <span style="margin-right: 15px; color: #fbbf24;">${reward.price} 🪙</span>
                    <button class="buy-btn" data-index="${index}">Buy</button>
                    <button class="remove-btn" data-index="${index}" style="margin-left:5px;">🗑️</button>
                `;
                shopList.appendChild(li);
            });

            // Reward Button Listeners
            document.querySelectorAll('.buy-btn').forEach(btn => {
                btn.onclick = (e) => {
                    const idx = e.target.getAttribute('data-index');
                    const rewardToBuy = rewards[idx];
                    if (stats.coins >= rewardToBuy.price) {
                        stats.coins -= rewardToBuy.price;
                        chrome.storage.local.set({ stats: stats }, () => {
                            showShopMessage(`Enjoy your ${rewardToBuy.name}!`, '#22c55e');
                            loadDashboardData();
                        });
                    } else {
                        showShopMessage(`Not enough coins! You need ${rewardToBuy.price - stats.coins} more.`, '#ef4444');
                    }
                };
            });

            document.querySelectorAll('.site-item .remove-btn').forEach(btn => {
                if(btn.textContent === '🗑️') {
                    btn.onclick = (e) => {
                        const idx = e.target.getAttribute('data-index');
                        rewards.splice(idx, 1);
                        chrome.storage.local.set({ customRewards: rewards }, loadDashboardData);
                    };
                }
            });
        });
    }

    function showShopMessage(msg, color) {
        const msgEl = document.getElementById('shop-message');
        msgEl.textContent = msg;
        msgEl.style.color = color;
        setTimeout(() => { msgEl.textContent = ''; }, 3000);
    }

    // Add new blocked site
    document.getElementById('add-site-btn').onclick = () => {
        const input = document.getElementById('new-site');
        const val = input.value.trim().toLowerCase();
        if (val) {
            chrome.storage.local.get(['blockedSites'], (data) => {
                const sites = data.blockedSites || [];
                if (!sites.includes(val)) {
                    sites.push(val);
                    chrome.storage.local.set({ blockedSites: sites }, () => {
                        input.value = '';
                        loadDashboardData();
                    });
                }
            });
        }
    };

    // Add new Custom Reward
    document.getElementById('add-reward-btn').onclick = () => {
        const nameInput = document.getElementById('reward-name');
        const priceInput = document.getElementById('reward-price');
        const nameVal = nameInput.value.trim();
        const priceVal = parseInt(priceInput.value);

        if (nameVal && priceVal > 0) {
            chrome.storage.local.get(['customRewards'], (data) => {
                const rewards = data.customRewards || [];
                rewards.push({ name: nameVal, price: priceVal });
                chrome.storage.local.set({ customRewards: rewards }, () => {
                    nameInput.value = '';
                    priceInput.value = '';
                    loadDashboardData();
                });
            });
        } else {
            showShopMessage('Please enter a valid name and price.', '#ef4444');
        }
    };

    loadDashboardData();
});