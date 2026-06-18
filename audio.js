export let audioCtx = null;
export const audioState = { sfxEnabled: true, musicEnabled: true };

export function setSfxEnabled(val) { audioState.sfxEnabled = val; }
export function setMusicEnabled(val) { audioState.musicEnabled = val; }

export function getAudioCtx() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

export const resumeAudio = () => { getAudioCtx(); };

export function playTone(freq, type, duration, vol=0.2) {
    if(!audioState.sfxEnabled) return;
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    
    gain.gain.setValueAtTime(vol, t);
    gain.gain.linearRampToValueAtTime(0.01, t + duration); 
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
}