import { StorageEngine } from './storage.js';

export const AudioEngine = {
    muted: StorageEngine.get('a2_muted', false),
    volumes: StorageEngine.get('a2_volumes', { click: 0.5, hit: 0.5, success: 0.5, error: 0.5 }),
    audioCtx: null,
    init() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) this.audioCtx = new AudioContext();
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    },
    play(type) {
        if (this.muted) return;
        this.init();
        if (!this.audioCtx) return;

        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            const now = this.audioCtx.currentTime;
            const vol = (this.volumes[type] !== undefined ? this.volumes[type] : 0.5) * 0.3;

            if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                gain.gain.setValueAtTime(vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'success') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(880, now + 0.08);
                gain.gain.setValueAtTime(vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.setValueAtTime(120, now + 0.1);
                gain.gain.setValueAtTime(vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'levelup') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.setValueAtTime(500, now + 0.1);
                osc.frequency.setValueAtTime(800, now + 0.2);
                gain.gain.setValueAtTime(vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
            }
        } catch (e) {
            console.warn("[AudioEngine] Playback error:", e);
        }
    }
};

export let autoSpeakOnFlip = StorageEngine.get('a2_autospeak', false);
export let currentSpeechRate = StorageEngine.get('a2_speech_rate', 0.9);

export function toggleAudioMute() {
    AudioEngine.muted = !AudioEngine.muted;
    StorageEngine.set('a2_muted', AudioEngine.muted);
    syncSoundUI();
    AudioEngine.play('click');
}

export function updateAudioVolume(val) {
    const num = parseInt(val) / 100;
    AudioEngine.volumes = { click: num, hit: num, success: num, error: num, levelup: num };
    StorageEngine.set('a2_volumes', AudioEngine.volumes);
    const label = document.getElementById("volume-val-label");
    if (label) label.innerText = `${val}%`;
    AudioEngine.play('click');
}

export function toggleAutoSpeak() {
    autoSpeakOnFlip = !autoSpeakOnFlip;
    StorageEngine.set('a2_autospeak', autoSpeakOnFlip);
    syncSoundUI();
    AudioEngine.play('click');
}

export function toggleSpeechRate() {
    currentSpeechRate = currentSpeechRate === 0.9 ? 0.7 : 0.9;
    StorageEngine.set('a2_speech_rate', currentSpeechRate);
    syncSoundUI();
    AudioEngine.play('click');
}

export function syncSoundUI() {
    const muted = AudioEngine.muted;
    const icon = document.getElementById("sound-icon");
    if (icon) icon.className = muted ? 'fa-solid fa-volume-xmark text-pink-500' : 'fa-solid fa-volume-high text-cyan-400';
    
    const masterBtnHeader = document.getElementById("sound-master-btn-header");
    if (masterBtnHeader) masterBtnHeader.className = muted ? 'interactive-btn glass-panel text-pink-500 p-2.5 rounded-xl border border-pink-500/30 hover:bg-slate-800' : 'interactive-btn glass-panel text-cyan-400 p-2.5 rounded-xl border border-cyan-500/30 hover:bg-slate-800';

    const masterBtnModal = document.getElementById("sound-master-btn");
    if (masterBtnModal) {
        masterBtnModal.className = muted ? 'interactive-btn px-4 py-2 rounded-xl font-black text-[10px] bg-slate-800 text-slate-500' : 'interactive-btn px-4 py-2 rounded-xl font-black text-[10px] bg-cyan-400 text-slate-950 shadow-md';
        masterBtnModal.textContent = muted ? 'ВИМКНЕНО' : 'УВІМКНЕНО';
    }

    const autoBtn = document.getElementById("sound-autospeak-btn");
    if (autoBtn) {
        autoBtn.className = autoSpeakOnFlip ? 'interactive-btn px-4 py-2 rounded-xl font-black text-[10px] bg-cyan-400 text-slate-950 shadow-md' : 'interactive-btn px-4 py-2 rounded-xl font-black text-[10px] bg-slate-800 text-slate-500';
        autoBtn.textContent = autoSpeakOnFlip ? 'УВІМКНЕНО' : 'ВИМКНЕНО';
    }

    const rateBtn = document.getElementById("sound-rate-btn");
    if (rateBtn) {
        rateBtn.textContent = currentSpeechRate === 0.7 ? 'ПОВІЛЬНА (0.7X)' : 'НОРМАЛЬНА (0.9X)';
    }

    const currentVol = Math.round((AudioEngine.volumes.click !== undefined ? AudioEngine.volumes.click : 0.5) * 100);
    const slider = document.getElementById("sound-volume-slider");
    const label = document.getElementById("volume-val-label");
    if (slider) slider.value = currentVol;
    if (label) label.innerText = `${currentVol}%`;
}