/**
 * Studio-Grade Web Audio Engine for Amharic Voice & DAW
 * Handles multi-track mixing, Web Audio effect processing, waveform extraction,
 * and lossless WAV master rendering.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;

  getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx({ sampleRate: 44100 });
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  getAnalyser(): AnalyserNode {
    const ctx = this.getContext();
    if (!this.analyser) {
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
    }
    return this.analyser;
  }

  /**
   * Decode base64 audio string (WAV, MP3, etc.) to an AudioBuffer
   */
  async decodeBase64Audio(base64: string): Promise<AudioBuffer> {
    const ctx = this.getContext();
    const cleanBase64 = base64.replace(/^data:audio\/\w+;base64,/, '');
    const binary = atob(cleanBase64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return await ctx.decodeAudioData(bytes.buffer.slice(0));
  }

  /**
   * Extract waveform peaks (e.g. 100-200 bars) for timeline visualizer
   */
  extractWaveformData(audioBuffer: AudioBuffer, numSamples = 120): number[] {
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / numSamples);
    const peaks: number[] = [];
    for (let i = 0; i < numSamples; i++) {
      const start = i * blockSize;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[start + j] || 0);
      }
      const avg = sum / blockSize;
      peaks.push(Math.min(1, avg * 3.5)); // Normalized with slight boost for visibility
    }
    return peaks;
  }

  /**
   * Generate an algorithmic reverb impulse response buffer
   */
  createReverbImpulse(duration = 2.0, decay = 2.5): AudioBuffer {
    const ctx = this.getContext();
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
      const n = i / length;
      const factor = Math.exp(-n * decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  /**
   * Apply voice changer / EQ filter chain to an AudioNode
   */
  applyEffectChain(
    ctx: BaseAudioContext,
    source: AudioNode,
    destination: AudioNode,
    preset: 'clean' | 'radio' | 'megaphone' | 'telephone' | 'church' | 'mechanical',
    eqLow = 0,
    eqMid = 0,
    eqHigh = 0,
    _reverbWet = 0.1
  ) {
    // 3-Band Parametric EQ
    const lowNode = ctx.createBiquadFilter();
    lowNode.type = 'lowshelf';
    lowNode.frequency.value = 320;
    lowNode.gain.value = eqLow;

    const midNode = ctx.createBiquadFilter();
    midNode.type = 'peaking';
    midNode.frequency.value = 1800;
    midNode.Q.value = 1.0;
    midNode.gain.value = eqMid;

    const highNode = ctx.createBiquadFilter();
    highNode.type = 'highshelf';
    highNode.frequency.value = 4500;
    highNode.gain.value = eqHigh;

    // Filter preset customizations
    let currentNode: AudioNode = source;
    currentNode.connect(lowNode);
    lowNode.connect(midNode);
    midNode.connect(highNode);
    currentNode = highNode;

    if (preset === 'radio') {
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1200;
      bandpass.Q.value = 1.8;
      currentNode.connect(bandpass);
      currentNode = bandpass;
    } else if (preset === 'telephone') {
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 400;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3200;
      currentNode.connect(hp);
      hp.connect(lp);
      currentNode = lp;
    } else if (preset === 'megaphone') {
      const peak = ctx.createBiquadFilter();
      peak.type = 'peaking';
      peak.frequency.value = 2200;
      peak.Q.value = 3.5;
      peak.gain.value = 14;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 600;
      currentNode.connect(hp);
      hp.connect(peak);
      currentNode = peak;
    } else if (preset === 'mechanical') {
      const waveShaper = ctx.createWaveShaper();
      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.7);
      }
      waveShaper.curve = curve;
      currentNode.connect(waveShaper);
      currentNode = waveShaper;
    }

    // Dynamic Limiter/Compressor
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-18, ctx.currentTime);
    compressor.knee.setValueAtTime(15, ctx.currentTime);
    compressor.ratio.setValueAtTime(4, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.15, ctx.currentTime);

    currentNode.connect(compressor);
    compressor.connect(destination);
  }

  /**
   * Render full multi-track DAW project into a single master AudioBuffer
   */
  async renderMasterMix(
    tracks: {
      volume: number;
      pan: number;
      muted: boolean;
      clips: {
        startTime: number;
        volume: number;
        audioBuffer?: AudioBuffer;
      }[];
    }[],
    targetSampleRate = 44100
  ): Promise<AudioBuffer> {
    // Calculate total duration
    let maxDuration = 1.0;
    tracks.forEach((track) => {
      if (track.muted) return;
      track.clips.forEach((clip) => {
        if (clip.audioBuffer) {
          const end = clip.startTime + clip.audioBuffer.duration;
          if (end > maxDuration) maxDuration = end;
        }
      });
    });

    // Add 1 second tail for natural reverb release
    maxDuration += 0.8;

    const offlineCtx = new OfflineAudioContext(
      2, // Stereo
      Math.ceil(maxDuration * targetSampleRate),
      targetSampleRate
    );

    tracks.forEach((track) => {
      if (track.muted) return;
      const trackGain = offlineCtx.createGain();
      trackGain.gain.value = track.volume;
      const panner = offlineCtx.createStereoPanner ? offlineCtx.createStereoPanner() : null;
      if (panner) {
        panner.pan.value = track.pan;
        trackGain.connect(panner);
        panner.connect(offlineCtx.destination);
      } else {
        trackGain.connect(offlineCtx.destination);
      }

      track.clips.forEach((clip) => {
        if (!clip.audioBuffer) return;
        const clipSource = offlineCtx.createBufferSource();
        clipSource.buffer = clip.audioBuffer;
        const clipGain = offlineCtx.createGain();
        clipGain.gain.value = clip.volume;
        clipSource.connect(clipGain);
        clipGain.connect(trackGain);
        clipSource.start(clip.startTime);
      });
    });

    return await offlineCtx.startRendering();
  }

  /**
   * Convert an AudioBuffer to standard uncompressed 16-bit PCM WAV Blob
   */
  audioBufferToWav(buffer: AudioBuffer, optSampleRate?: number): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = optSampleRate || buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const numSamples = buffer.length;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;

    const bufferSize = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Interleave channels & write 16-bit PCM samples
    let offset = 44;
    const channels: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = channels[ch][i];
        // Clip sample
        sample = Math.max(-1, Math.min(1, sample));
        // Scale to 16-bit signed integer
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  /**
   * Procedural synthesizer for Ethiopian Traditional BGM loop
   * Features pentatonic Krar, Washint flute harmonics, and Kebero drum accents
   */
  async createEthiopianTraditionalBGM(durationSec = 24): Promise<AudioBuffer> {
    const ctx = this.getContext();
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(2, sampleRate * durationSec, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    // Ethiopian Tizita/Ambassel modal pentatonic scale frequencies (Hz)
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
    const bpm = 94;
    const beatDuration = 60 / bpm; // ~0.638s

    for (let t = 0; t < buffer.length; t++) {
      const timeInSec = t / sampleRate;
      const currentBeat = timeInSec / beatDuration;

      // Kebero Drum Kick on beat 1 and 3 (heavy warmth)
      const beatPhase = currentBeat % 1.0;
      let drum = 0;
      if (beatPhase < 0.25) {
        const drumFreq = 65 * Math.exp(-beatPhase * 18);
        drum = Math.sin(2 * Math.PI * drumFreq * timeInSec) * Math.exp(-beatPhase * 10) * 0.45;
      }

      // Shaker / Tsentsil rhythm (every eighth note)
      const eighthPhase = (currentBeat * 2) % 1.0;
      let shaker = 0;
      if (eighthPhase < 0.1) {
        shaker = (Math.random() * 2 - 1) * Math.exp(-eighthPhase * 25) * 0.12;
      }

      // Krar acoustic pluck arpeggio
      const noteIndex = Math.floor(currentBeat * 2) % notes.length;
      const freq = notes[noteIndex];
      const notePhase = (currentBeat * 2) % 1.0;
      const krarPluck = Math.sin(2 * Math.PI * freq * timeInSec) *
        Math.exp(-notePhase * 4.5) * 0.28 +
        Math.sin(2 * Math.PI * (freq * 2.01) * timeInSec) * Math.exp(-notePhase * 6) * 0.12;

      // Washint Flute subtle drone (warm breath)
      const droneFreq = 130.81; // C3
      const washint = Math.sin(2 * Math.PI * droneFreq * timeInSec) * 0.08 +
        Math.sin(2 * Math.PI * (droneFreq * 3) * timeInSec) * 0.03;

      const sampleL = (drum + shaker * 0.7 + krarPluck * 0.9 + washint) * 0.65;
      const sampleR = (drum + shaker * 1.2 + krarPluck * 1.1 + washint) * 0.65;

      left[t] = sampleL;
      right[t] = sampleR;
    }

    return buffer;
  }

  /**
   * Procedural SFX generator for Addis Cafe Ambiance / Chimes / Claps
   */
  async createProceduralSFX(type: 'cafe' | 'chimes' | 'applause' | 'rain', durationSec = 10): Promise<AudioBuffer> {
    const ctx = this.getContext();
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(2, sampleRate * durationSec, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let t = 0; t < buffer.length; t++) {
      const timeInSec = t / sampleRate;

      if (type === 'rain') {
        const white = Math.random() * 2 - 1;
        const lowRumble = Math.sin(2 * Math.PI * 45 * timeInSec) * 0.08;
        left[t] = (white * 0.08 + lowRumble) * 0.8;
        right[t] = ((Math.random() * 2 - 1) * 0.08 + lowRumble) * 0.8;
      } else if (type === 'chimes') {
        const bellFreq = 587.33; // D5
        const bellDecay = (timeInSec % 3.0);
        const chime = Math.sin(2 * Math.PI * bellFreq * timeInSec) * Math.exp(-bellDecay * 1.5) * 0.25 +
          Math.sin(2 * Math.PI * (bellFreq * 1.5) * timeInSec) * Math.exp(-bellDecay * 2.0) * 0.15;
        left[t] = chime;
        right[t] = chime;
      } else if (type === 'applause') {
        const isClap = Math.random() < 0.003;
        const clapVal = isClap ? (Math.random() * 2 - 1) * 0.5 : 0;
        left[t] = (Math.random() * 2 - 1) * 0.05 + clapVal;
        right[t] = (Math.random() * 2 - 1) * 0.05 + clapVal;
      } else {
        const murmur = Math.sin(2 * Math.PI * 180 * timeInSec) * 0.03 + (Math.random() * 2 - 1) * 0.02;
        left[t] = murmur;
        right[t] = murmur;
      }
    }

    return buffer;
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export function secondsToSMPTE(seconds: number, fps: 24 | 30 | 60 = 24): string {
  const safeSec = Math.max(0, seconds);
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = Math.floor(safeSec % 60);
  const remainder = safeSec - Math.floor(safeSec);
  const frames = Math.min(fps - 1, Math.floor(remainder * fps));
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}

export function smpteToSeconds(timecode: string, fps: 24 | 30 | 60 = 24): number {
  const parts = timecode.split(':').map((p) => parseInt(p, 10) || 0);
  if (parts.length < 4) return 0;
  const [hrs, mins, secs, frames] = parts;
  return hrs * 3600 + mins * 60 + secs + frames / fps;
}

export function countAmharicSyllables(text: string): number {
  if (!text) return 0;
  const fidelMatches = text.match(/[\u1200-\u137F]/g);
  return fidelMatches ? fidelMatches.length : text.replace(/\s+/g, '').length || 1;
}

export function calculateNonLinearFit(amharicText: string, windowDurationSec: number): {
  syllables: number;
  idealDuration: number;
  autoFitSpeed: number;
  fitStatus: 'perfect' | 'compressed' | 'stretched';
} {
  const syllables = countAmharicSyllables(amharicText);
  const idealDuration = Math.max(0.5, syllables * 0.115);
  const safeWindow = Math.max(0.4, windowDurationSec);
  let autoFitSpeed = Number((idealDuration / safeWindow).toFixed(2));
  autoFitSpeed = Math.max(0.8, Math.min(1.35, autoFitSpeed));
  let fitStatus: 'perfect' | 'compressed' | 'stretched' = 'perfect';
  if (autoFitSpeed > 1.08) {
    fitStatus = 'compressed';
  } else if (autoFitSpeed < 0.92) {
    fitStatus = 'stretched';
  }

  return {
    syllables,
    idealDuration,
    autoFitSpeed,
    fitStatus,
  };
}

export const audioEngine = new AudioEngine();
