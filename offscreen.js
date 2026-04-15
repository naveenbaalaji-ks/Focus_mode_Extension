chrome.runtime.onMessage.addListener((msg) => {
    const audio = document.getElementById('bg-audio');
    if (msg.action === 'playAudio') {
        audio.src = msg.source;
        audio.volume = 0.5;
        audio.play().catch(err => console.error(err));
    } else if (msg.action === 'stopAudio') {
        audio.pause();
        audio.currentTime = 0;
    }
});