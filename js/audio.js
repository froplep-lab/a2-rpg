import { showToast } from './utils.js';

let audioCtx = null;
let masterVolume = 0.5;
let isMuted = false;
let autoSpeak = false;
let currentSpeechRate = 0.9;

export { currentSpeechRate };

export function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
    return audioCtx;
}

export const AudioEngine = {
    play(soundName) {
        if (isMuted) return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;
            gain.gain.setValueAtTime(masterVolume * 0.2, now);

            if (soundName === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.04);
                osc.start(now);
                osc.stop(now + 0.04);
            } else if (soundName === 'success') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(660, now + 0.06);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (soundName === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.setValueAtTime(120, now + 0.08);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (soundName === 'levelup') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.setValueAtTime(659.25, now + 0.08);
                osc.frequency.setValueAtTime(783.99, now + 0.16);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            }
        } catch (e) {
            // Silently catch audio restrictions on mobile webviews
        }
    }
};

export function toggleAudioMute() {
    isMuted = !isMuted;
    syncSoundUI();
    showToast(isMuted ? "Звук вимкнено" : "Звук увімкнено", "info");
}

export function updateAudioVolume(val) {
    masterVolume = Number(val) / 100;
    const lbl = document.getElementById("volume-val-label");
    if (lbl) lbl.innerText = `${val}%`;
}

export function toggleAutoSpeak() {
    autoSpeak = !autoSpeak;
    const btn = document.getElementById("sound-autospeak-btn");
    if (btn) {
        btn.innerText = autoSpeak ? "УВІМКНЕНО" : "ВИМКНЕНО";
        btn.className = autoSpeak ? 
            "interactive-btn px-4 py-2 rounded-xl font-black text-[10px] bg-cyan-400 text-slate-950 shadow-md" : 
            "interactive-btn px-4 py-2 rounded-xl font-black text-[10px] bg-slate-800 text-slate-500";
    }
}

export function toggleSpeechRate() {
    if (currentSpeechRate === 0.9) {
        currentSpeechRate = 0.75;
    } else if (currentSpeechRate === 0.75) {
        currentSpeechRate = 1.0;
    } else {
        currentSpeechRate = 0.9;
    }
    const btn = document.getElementById("sound-rate-btn");
    if (btn) {
        let label = "НОРМАЛЬНА (0.9X)";
        if (currentSpeechRate === 0.75) label = "ПОВІЛЬНА (0.75X)";
        if (currentSpeechRate === 1.0) label = "ШВИДКА (1.0X)";
        btn.innerText = label;
    }
}

export function syncSoundUI() {
    const btnHeader = document.getElementById("sound-master-btn-header");
    const btnModal = document.getElementById("sound-master-btn");
    const icon = document.getElementById("sound-icon");

    if (isMuted) {
        if (icon) icon.className = "fa-solid fa-volume-xmark text-pink-400";
        if (btnHeader) btnHeader.classList.add("border-pink-500/50");
        if (btnModal) {
            btnModal.innerText = "ВИМКНЕНО";
            btnModal.className = "interactive-btn px-4 py-2 rounded-xl font-black text-[10px] bg-pink-500 text-white shadow-md";
        }
    } else {
        if (icon) icon.className = "fa-solid fa-volume-high text-cyan-400";
        if (btnHeader) btnHeader.classList.remove("border-pink-500/50");
        if (btnModal) {
            btnModal.innerText = "УВІМКНЕНО";
            btnModal.className = "interactive-btn px-4 py-2 rounded-xl font-black text-[10px] bg-cyan-400 text-slate-950 shadow-md";
        }
    }
}

window.toggleAudioMute = toggleAudioMute;
window.updateAudioVolume = updateAudioVolume;
window.toggleAutoSpeak = toggleAutoSpeak;
window.toggleSpeechRate = toggleSpeechRate;
