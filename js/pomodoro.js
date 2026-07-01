// StudyFlow Pomodoro Timer Module
import storage from './storage.js';

let intervalId = null;
let timerMode = 'focus'; // 'focus', 'shortBreak', 'longBreak'
let timerState = 'idle'; // 'idle', 'running', 'paused'
let timeLeft = 25 * 60; // in seconds
let totalDuration = 25 * 60;

// SVG progress circle dimensions
const CIRCLE_RADIUS = 140;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

// Web Audio API State
let audioCtx = null;
let ambientSource = null;
let ambientGain = null;
let activeAmbientSound = 'none'; // 'none', 'white', 'ocean', 'rain', 'ticking'

// Durations in minutes
const DURATIONS = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15
};

export const PomodoroModule = {
  init() {
    this.cacheDOM();
    this.bindEvents();
    this.updateCircleProgress();
    this.renderDigits();
  },

  cacheDOM() {
    this.digitsEl = document.getElementById('timer-digits');
    this.labelEl = document.getElementById('timer-label');
    this.progressCircle = document.getElementById('pomodoro-circle-progress');
    
    this.playBtn = document.getElementById('timer-play-btn');
    this.pauseBtn = document.getElementById('timer-pause-btn');
    this.resetBtn = document.getElementById('timer-reset-btn');
    
    this.modeButtons = document.querySelectorAll('.pomodoro-mode-btn');
    this.ambientButtons = document.querySelectorAll('.ambient-btn');
    
    if (this.progressCircle) {
      this.progressCircle.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`;
      this.progressCircle.style.strokeDashoffset = 0;
    }
  },

  bindEvents() {
    if (this.playBtn) this.playBtn.addEventListener('click', () => this.start());
    if (this.pauseBtn) this.pauseBtn.addEventListener('click', () => this.pause());
    if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.reset());

    if (this.modeButtons) {
      this.modeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const mode = e.currentTarget.dataset.mode;
          this.switchMode(mode);
        });
      });
    }

    if (this.ambientButtons) {
      this.ambientButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const sound = e.currentTarget.dataset.sound;
          this.toggleAmbient(sound);
        });
      });
    }
  },

  initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      ambientGain = audioCtx.createGain();
      ambientGain.gain.setValueAtTime(0.2, audioCtx.currentTime); // Soft volume
      ambientGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  },

  start() {
    if (timerState === 'running') return;
    
    this.initAudio();
    timerState = 'running';
    this.updateControlsUI();
    
    // Play active ambient sound if selected
    if (activeAmbientSound !== 'none') {
      this.playAmbient();
    }

    intervalId = setInterval(() => {
      timeLeft--;
      this.renderDigits();
      this.updateCircleProgress();

      if (timeLeft <= 0) {
        this.complete();
      }
    }, 1000);
  },

  pause() {
    if (timerState !== 'running') return;
    
    timerState = 'paused';
    clearInterval(intervalId);
    this.updateControlsUI();
    this.stopAmbient();
  },

  reset() {
    this.pause();
    timerState = 'idle';
    timeLeft = DURATIONS[timerMode] * 60;
    totalDuration = timeLeft;
    this.renderDigits();
    this.updateCircleProgress();
    this.updateControlsUI();
  },

  switchMode(mode) {
    this.modeButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.mode === mode) {
        btn.classList.add('active');
        if (mode !== 'focus') {
          btn.classList.add('break-mode');
        } else {
          btn.classList.remove('break-mode');
        }
      }
    });

    if (this.progressCircle) {
      if (mode !== 'focus') {
        this.progressCircle.classList.add('break-mode');
      } else {
        this.progressCircle.classList.remove('break-mode');
      }
    }

    timerMode = mode;
    this.labelEl.textContent = mode === 'focus' ? 'Focus Session' : 'Break Time';
    this.reset();
  },

  complete() {
    this.pause();
    this.playAlarm();
    
    if (timerMode === 'focus') {
      storage.incrementStat('pomodoroSessions');
      storage.incrementStat('pomodoroMinutes', DURATIONS.focus);
      alert('Focus session completed! Take a break.');
      this.switchMode('shortBreak');
    } else {
      alert('Break over! Let\'s focus again.');
      this.switchMode('focus');
    }
    
    document.dispatchEvent(new CustomEvent('pomodoroCompleted'));
  },

  renderDigits() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    if (this.digitsEl) {
      this.digitsEl.textContent = formatted;
    }
  },

  updateCircleProgress() {
    if (!this.progressCircle) return;
    const progress = timeLeft / totalDuration;
    const offset = CIRCLE_CIRCUMFERENCE * (1 - progress);
    this.progressCircle.style.strokeDashoffset = offset;
  },

  updateControlsUI() {
    if (timerState === 'running') {
      this.playBtn.style.display = 'none';
      this.pauseBtn.style.display = 'inline-flex';
    } else {
      this.playBtn.style.display = 'inline-flex';
      this.pauseBtn.style.display = 'none';
    }
  },

  /* Sound Synthesis Section */
  playAlarm() {
    try {
      this.initAudio();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 note

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.8);
      osc2.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.warn('Audio alarm playback failed: ', e);
    }
  },

  toggleAmbient(soundName) {
    this.initAudio();
    this.ambientButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.sound === soundName) {
        btn.classList.add('active');
      }
    });

    if (activeAmbientSound === soundName) {
      // Toggle off
      activeAmbientSound = 'none';
      this.stopAmbient();
      this.ambientButtons.forEach(btn => {
        if (btn.dataset.sound === 'none') btn.classList.add('active');
      });
      return;
    }

    activeAmbientSound = soundName;
    this.stopAmbient();

    if (timerState === 'running' && soundName !== 'none') {
      this.playAmbient();
    }
  },

  playAmbient() {
    if (activeAmbientSound === 'none') return;
    this.initAudio();

    try {
      let buffer;
      if (activeAmbientSound === 'white') {
        buffer = this.getWhiteNoiseBuffer();
      } else if (activeAmbientSound === 'ocean') {
        buffer = this.getBrownNoiseBuffer();
      } else if (activeAmbientSound === 'rain') {
        buffer = this.getRainBuffer();
      } else if (activeAmbientSound === 'ticking') {
        buffer = this.getTickingBuffer();
      }

      if (buffer) {
        ambientSource = audioCtx.createBufferSource();
        ambientSource.buffer = buffer;
        ambientSource.loop = true;

        if (activeAmbientSound === 'ocean') {
          // Ocean modulation (LFO wave filter)
          const filter = audioCtx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(300, audioCtx.currentTime);

          const lfo = audioCtx.createOscillator();
          lfo.type = 'sine';
          lfo.frequency.setValueAtTime(0.08, audioCtx.currentTime); // Very slow oscillation (12s cycle)

          const lfoGain = audioCtx.createGain();
          lfoGain.gain.setValueAtTime(150, audioCtx.currentTime); // Modulate cutoff by +-150Hz

          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);
          
          ambientSource.connect(filter);
          filter.connect(ambientGain);
          
          lfo.start();
          this.activeLfo = lfo;
        } else if (activeAmbientSound === 'rain') {
          // Bandpass filter to make noise sound like rain falling
          const filter = audioCtx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(800, audioCtx.currentTime);
          filter.Q.setValueAtTime(0.6, audioCtx.currentTime);

          ambientSource.connect(filter);
          filter.connect(ambientGain);
        } else {
          ambientSource.connect(ambientGain);
        }

        ambientSource.start(0);
      }
    } catch (e) {
      console.warn('Ambient synthesis failed: ', e);
    }
  },

  stopAmbient() {
    if (ambientSource) {
      try {
        ambientSource.stop();
      } catch (e) {}
      ambientSource = null;
    }
    if (this.activeLfo) {
      try {
        this.activeLfo.stop();
      } catch (e) {}
      this.activeLfo = null;
    }
  },

  /* Sound Buffers Synthesizers */
  getWhiteNoiseBuffer() {
    const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  },

  getBrownNoiseBuffer() {
    const bufferSize = audioCtx.sampleRate * 4; // 4 seconds
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brownian accumulator integration
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Compensate loss of volume
    }
    return buffer;
  },

  getRainBuffer() {
    const bufferSize = audioCtx.sampleRate * 3;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    // Generate soft brown noise mixed with light crackles
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      const brown = (lastOut + (0.015 * white)) / 1.015;
      lastOut = brown;
      
      // Random rain drop clicks
      let click = 0;
      if (Math.random() > 0.9995) {
        click = (Math.random() * 2 - 1) * 0.4;
      }
      data[i] = (brown * 3.0) + click;
    }
    return buffer;
  },

  getTickingBuffer() {
    const bufferSize = audioCtx.sampleRate * 1; // 1 second loop
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Rhythmic heart beat/ticking: a soft pulse at the start of every second
    const pulseWidth = Math.floor(audioCtx.sampleRate * 0.05); // 50ms pulse
    for (let i = 0; i < bufferSize; i++) {
      if (i < pulseWidth) {
        // Logarithmic decay tick
        const x = i / pulseWidth;
        data[i] = Math.sin(2 * Math.PI * 180 * x) * Math.exp(-6 * x) * 0.4;
      } else {
        data[i] = 0;
      }
    }
    return buffer;
  }
};
export default PomodoroModule;
