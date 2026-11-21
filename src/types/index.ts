export type VoiceGender = 'male' | 'female';
export type VoiceAgeGroup = 'adult' | 'young_adult' | 'elderly' | 'child';

export interface VoicePersona {
  id: string;
  name: string;
  amharicName: string;
  gender: VoiceGender;
  ageGroup: VoiceAgeGroup;
  age: number;
  description: string;
  amharicDescription: string;
  avatarUrl: string;
  baseVoice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  tags: string[];
  toneQualities: string[];
  pitchDefault: number; // -12 to 12
  speedDefault: number; // 0.25 to 4.0
  sampleText: string;
}

export type EmotionType =
  | 'joy'
  | 'love'
  | 'playful'
  | 'sorrow'
  | 'depression'
  | 'disgust'
  | 'extreme_conditions'
  | 'fear'
  | 'anger'
  | 'thoughtful'
  | 'neutral';

export interface EmotionProfile {
  id: EmotionType;
  name: string;
  amharicName: string;
  emojis: string[];
  description: string;
  amharicDescription: string;
  pitchModifier: number; // semitones
  speedModifier: number; // multiplier
  intensityDefault: number; // 0 to 200%
  breathinessDefault: number; // 0 to 100%
  vocalEffects: string[];
  burstPrompt: string;
}

export interface SpeechSettings {
  pitch: number; // -12 to +12 semitones
  speed: number; // 0.25 to 4.0
  intensity: number; // 0% to 200%
  breathiness: number; // 0% to 100%
  pauseCadence: number; // 0.5 to 2.0x pause duration
  vocalClarity: number; // 0 to 100%
}

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  phonemes?: string[];
}

export interface GeneratedSpeechResult {
  id: string;
  text: string;
  voiceId: string;
  emotion: EmotionType;
  audioBase64: string; // WAV audio
  duration: number; // in seconds
  sampleRate: number;
  createdAt: number;
  wordTimings: WordTiming[];
  chunksProcessed: number;
}

export interface SubtitleCue {
  id: number;
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
}

export interface AudioFilterSettings {
  preset: 'clean' | 'radio' | 'megaphone' | 'telephone' | 'church' | 'mechanical';
  eqLow: number; // -12 to +12 dB
  eqMid: number; // -12 to +12 dB
  eqHigh: number; // -12 to +12 dB
  reverbWet: number; // 0 to 1
  roomSize: number; // 0 to 1
  noiseReduction: number; // 0 to 1
  compression: number; // 0 to 1
}

export interface TimelineClip {
  id: string;
  trackId: string;
  title: string;
  startTime: number; // seconds along timeline
  duration: number; // seconds
  audioBase64: string;
  audioBuffer?: AudioBuffer;
  volume: number; // 0 to 2
  pan: number; // -1 to 1
  muted: boolean;
  color: string;
  waveformData?: number[];
}

export interface TimelineTrack {
  id: string;
  name: string;
  amharicName: string;
  type: 'voice' | 'music' | 'sfx' | 'aux';
  volume: number; // 0 to 2 (1 = 0dB)
  pan: number; // -1 (L) to 1 (R)
  muted: boolean;
  solo: boolean;
  clips: TimelineClip[];
}

export interface VoiceCloneProfile {
  id: string;
  name: string;
  createdAt: number;
  audioDuration: number;
  fundamentalFreq: number; // Hz
  timbreWarmth: number; // %
  vibratoRate: number; // Hz
  breathiness: number; // %
  sampleVoiceUrl?: string;
  customPitch: number;
  customSpeed: number;
  cloneBaseVoice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
}

export interface DubbingRequest {
  sourceLanguage: string;
  targetLanguage: 'amharic';
  originalText?: string;
  audioBase64?: string;
  voiceId: string;
  emotion: EmotionType;
}

export interface DubbingResult {
  sourceText: string;
  translatedAmharicText: string;
  audioBase64: string;
  duration: number;
  detectedEmotion?: string;
  wordTimings: WordTiming[];
}

export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'banned';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  authProvider: 'local' | 'google';
  createdAt: string;
  lastLoginAt?: string;
}

export interface DeviceAccount {
  id: string;
  username: string;
  email: string;
  name: string;
  avatarUrl: string;
  role: UserRole;
  token: string;
  lastUsedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export type HistoryActionType = 'tts' | 'clone' | 'dubbing' | 'daw';

export interface UserActionHistoryItem {
  id: string;
  userId: string;
  type: HistoryActionType;
  title: string;
  amharicTitle?: string;
  description: string;
  fullText?: string;
  voiceName?: string;
  voiceAmharic?: string;
  voiceId?: string;
  emotion?: string;
  duration?: number;
  audioBase64?: string;
  wordCount?: number;
  characterCount?: number;
  metadata?: Record<string, any>;
  createdAt: string;
}
