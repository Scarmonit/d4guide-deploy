/* ========================================
   Shadow Quest - Audio System
   Web Audio API sound manager
   ======================================== */

const AudioManager = {
    ctx: null,
    masterVolume: 0.5,
    bgmVolume: 0.3,
    sfxVolume: 0.6,
    currentBGM: null,
    muted: false,

    // Sound definitions (procedurally generated)
    sounds: {
        attack: { freq: 200, duration: 0.1, type: 'sawtooth' },
        hit: { freq: 300, duration: 0.15, type: 'square' },
        enemyHit: { freq: 150, duration: 0.1, type: 'square' },
        death: { freq: 100, duration: 0.3, type: 'sawtooth', decay: true },
        levelUp: { freq: 523, duration: 0.5, type: 'sine', arpeggio: [523, 659, 784] },
        purchase: { freq: 800, duration: 0.1, type: 'sine' },
        collect: { freq: 600, duration: 0.08, type: 'sine' },
        heal: { freq: 400, duration: 0.2, type: 'sine', sweep: 600 },
        dash: { freq: 100, duration: 0.15, type: 'noise' },
        ability: { freq: 350, duration: 0.2, type: 'sawtooth' },
        bossSpawn: { freq: 80, duration: 0.8, type: 'sawtooth', decay: true },
        combo: { freq: 440, duration: 0.1, type: 'sine' },
        critical: { freq: 500, duration: 0.15, type: 'square' }
    },

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    },

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    playSFX(soundName) {
        if (!this.ctx || this.muted) return;
        this.resume();

        const sound = this.sounds[soundName];
        if (!sound) return;

        const gainNode = this.ctx.createGain();
        gainNode.connect(this.ctx.destination);
        gainNode.gain.setValueAtTime(this.sfxVolume * this.masterVolume, this.ctx.currentTime);

        if (sound.arpeggio) {
            // Play arpeggio (for level up)
            sound.arpeggio.forEach((freq, i) => {
                this.playTone(freq, sound.duration / sound.arpeggio.length, sound.type, i * 0.1);
            });
        } else if (sound.type === 'noise') {
            // White noise (for dash)
            this.playNoise(sound.duration);
        } else if (sound.sweep) {
            // Frequency sweep (for heal)
            this.playSweep(sound.freq, sound.sweep, sound.duration);
        } else {
            this.playTone(sound.freq, sound.duration, sound.type, 0, sound.decay);
        }
    },

    playTone(freq, duration, type = 'sine', delay = 0, decay = false) {
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);

        const vol = this.sfxVolume * this.masterVolume;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime + delay);

        if (decay) {
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + delay + duration);
        } else {
            gain.gain.setValueAtTime(vol, this.ctx.currentTime + delay + duration - 0.01);
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + delay + duration);
        }

        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + duration);
    },

    playNoise(duration) {
        if (!this.ctx) return;

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();

        noise.buffer = buffer;
        noise.connect(gain);
        gain.connect(this.ctx.destination);

        const vol = this.sfxVolume * this.masterVolume * 0.3;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

        noise.start();
    },

    playSweep(startFreq, endFreq, duration) {
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

        const vol = this.sfxVolume * this.masterVolume;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    // Simple procedural BGM
    startBGM(type = 'combat') {
        if (!this.ctx || this.currentBGM) return;
        this.resume();

        const playLoop = () => {
            if (!this.currentBGM) return;

            // Simple bass notes
            const notes = type === 'combat'
                ? [110, 110, 130, 110, 82, 82, 110, 98]
                : [220, 196, 175, 165];

            notes.forEach((freq, i) => {
                if (!this.currentBGM) return;

                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.25);

                const vol = this.bgmVolume * this.masterVolume * 0.3;
                gain.gain.setValueAtTime(0, this.ctx.currentTime + i * 0.25);
                gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + i * 0.25 + 0.02);
                gain.gain.setValueAtTime(vol, this.ctx.currentTime + i * 0.25 + 0.15);
                gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + i * 0.25 + 0.24);

                osc.start(this.ctx.currentTime + i * 0.25);
                osc.stop(this.ctx.currentTime + i * 0.25 + 0.25);
            });

            if (this.currentBGM) {
                this.currentBGM = setTimeout(playLoop, notes.length * 250);
            }
        };

        this.currentBGM = true;
        playLoop();
    },

    stopBGM() {
        if (this.currentBGM && typeof this.currentBGM === 'number') {
            clearTimeout(this.currentBGM);
        }
        this.currentBGM = null;
    },

    setMasterVolume(vol) {
        this.masterVolume = Math.max(0, Math.min(1, vol));
    },

    setSFXVolume(vol) {
        this.sfxVolume = Math.max(0, Math.min(1, vol));
    },

    setBGMVolume(vol) {
        this.bgmVolume = Math.max(0, Math.min(1, vol));
    },

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopBGM();
        }
        return this.muted;
    }
};

// Initialize on first user interaction
document.addEventListener('click', () => AudioManager.init(), { once: true });
document.addEventListener('keydown', () => AudioManager.init(), { once: true });
