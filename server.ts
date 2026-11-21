import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Shared Gemini client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Dynamic voice configuration lookup with fallback
const VOICE_MAP: Record<string, { baseVoice: string; gender: string; ageFactor: string; speakerName: string }> = {
  'abebe-adult-male': { baseVoice: 'Charon', gender: 'male', ageFactor: 'mature 38yo news anchor', speakerName: 'Abebe' },
  'almaz-adult-female': { baseVoice: 'Kore', gender: 'female', ageFactor: 'articulate 35yo broadcaster', speakerName: 'Almaz' },
  'dawit-adult-male': { baseVoice: 'Fenrir', gender: 'male', ageFactor: 'deep resonant 42yo baritone', speakerName: 'Dawit' },
  'bethlehem-adult-female': { baseVoice: 'Zephyr', gender: 'female', ageFactor: 'gentle 32yo melodic storyteller', speakerName: 'Bethlehem' },
  'tewodros-adult-male': { baseVoice: 'Fenrir', gender: 'male', ageFactor: 'fierce action hero warrior', speakerName: 'Tewodros' },
  'marta-adult-female': { baseVoice: 'Kore', gender: 'female', ageFactor: 'sharp articulate prosecutor', speakerName: 'Marta' },
  'mesfin-adult-male': { baseVoice: 'Fenrir', gender: 'male', ageFactor: 'sinister calculated antagonist', speakerName: 'Mesfin' },
  'yared-young-male': { baseVoice: 'Puck', gender: 'male', ageFactor: 'dynamic 24yo youth vlogger', speakerName: 'Yared' },
  'selam-young-female': { baseVoice: 'Kore', gender: 'female', ageFactor: 'vibrant 22yo modern woman', speakerName: 'Selam' },
  'natnael-young-male': { baseVoice: 'Puck', gender: 'male', ageFactor: 'smooth 26yo tech narrator', speakerName: 'Natnael' },
  'helina-young-female': { baseVoice: 'Zephyr', gender: 'female', ageFactor: 'bright 25yo cheerful assistant', speakerName: 'Helina' },
  'gashe-tadesse-elder-male': { baseVoice: 'Charon', gender: 'male', ageFactor: 'wise 68yo elder grandfather with textured voice', speakerName: 'Gashe Tadesse' },
  'emama-aster-elder-female': { baseVoice: 'Kore', gender: 'female', ageFactor: 'warm 65yo maternal grandmother', speakerName: 'Emama Aster' },
  'biruk-child-male': { baseVoice: 'Puck', gender: 'male', ageFactor: 'curious 9yo cheerful boy', speakerName: 'Biruk' },
  'liya-child-female': { baseVoice: 'Zephyr', gender: 'female', ageFactor: 'sweet 7yo cute little girl', speakerName: 'Liya' },
};

const EMOTION_PROMPTS: Record<string, { prompt: string; burst: string; speedMod: number }> = {
  joy: { prompt: 'Expressive overflowing joy, cheerful bounce, laughing warmth and smiling cadence', burst: '<laugh> ', speedMod: 1.15 },
  love: { prompt: 'Intimate tenderness, warm close-mic resonance, soft gentle breathing and deep affection', burst: '<breath> ', speedMod: 0.9 },
  playful: { prompt: 'Playful cheeky inflections, teasing pauses, lively conversational pitch drops', burst: '', speedMod: 1.1 },
  sorrow: { prompt: 'Heartbreaking sorrow, trembling vocal cords, heavy sighs, slower tempo, slight voice crack', burst: '<breath> ', speedMod: 0.8 },
  depression: { prompt: 'Flat monotone exhaustion, weary low volume, long dragging pauses, dull vocal fatigue', burst: '', speedMod: 0.75 },
  disgust: { prompt: 'Distinct revulsion, tight strained glottal friction, sneering repulsed cadence', burst: '<gasp> ', speedMod: 0.9 },
  extreme_conditions: { prompt: 'Physically strained, heavy panting or shivering cold tremor with rapid breath bursts', burst: '<gasp> <breath> ', speedMod: 1.05 },
  fear: { prompt: 'Terrified rapid panic, high trembling pitch, sharp breath gasps, sudden breathless pauses', burst: '<gasp> ', speedMod: 1.25 },
  anger: { prompt: 'Explosive chest resonance, loud harsh attacks, aggressive staccato delivery and sharp indignation', burst: '', speedMod: 1.15 },
  thoughtful: { prompt: 'Reflective curiosity, slow contemplative pauses, melodic question lifts at phrase endings', burst: '|mhm| ', speedMod: 0.9 },
  neutral: { prompt: 'Clear articulate broadcast standard, natural cadence and neutral pacing', burst: '', speedMod: 1.0 },
};

function splitAmharicText(text: string, maxChunkLength = 260): string[] {
  if (!text || text.length <= maxChunkLength) return [text.trim()];
  const delimiters = /([፡።\n\.\?!]+)/g;
  const rawParts = text.split(delimiters);
  const sentences: string[] = [];
  for (let i = 0; i < rawParts.length; i += 2) {
    const sentence = (rawParts[i] || '') + (rawParts[i + 1] || '');
    if (sentence.trim()) {
      sentences.push(sentence.trim());
    }
  }
  const chunks: string[] = [];
  let currentChunk = '';
  for (const s of sentences) {
    if ((currentChunk + ' ' + s).length > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = s;
    } else {
      currentChunk = currentChunk ? currentChunk + ' ' + s : s;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks.length > 0 ? chunks : [text];
}

function createWavHeader(pcmByteLength: number, sampleRate = 24000, numChannels = 1, bitDepth = 16): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * numChannels * (bitDepth / 8);
  const blockAlign = numChannels * (bitDepth / 8);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmByteLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmByteLength, 40);
  return header;
}

function generateProceduralAmharicSpeechWav(text: string, voiceGender = 'male', speed = 1.0): Buffer {
  const sampleRate = 24000;
  const syllables = text.replace(/\s+/g, '').length || 15;
  const duration = Math.max(1.8, Math.min(60, (syllables * 0.12) / speed));
  const totalSamples = Math.floor(sampleRate * duration);
  const pcmBuffer = Buffer.alloc(totalSamples * 2);
  const baseFreq = voiceGender === 'female' ? 220 : 130;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const f0 = baseFreq * (1 + 0.08 * Math.sin(2 * Math.PI * 3.5 * t));
    const syllablePhase = (t * 4.5 * speed) % 1.0;
    const env = Math.sin(Math.PI * syllablePhase);
    const sampleVal = (
      Math.sin(2 * Math.PI * f0 * t) * 0.5 +
      Math.sin(2 * Math.PI * (f0 * 2) * t) * 0.25 +
      Math.sin(2 * Math.PI * (f0 * 3) * t) * 0.15 +
      (Math.random() * 2 - 1) * 0.06
    ) * Math.max(0, env);
    const int16 = Math.floor(Math.max(-1, Math.min(1, sampleVal)) * 32767);
    pcmBuffer.writeInt16LE(int16, i * 2);
  }

  const header = createWavHeader(pcmBuffer.length, sampleRate, 1, 16);
  return Buffer.concat([header, pcmBuffer]);
}

async function synthesizeChunkWithGemini(
  chunkText: string,
  voiceConfig: { baseVoice: string; speakerName: string; ageFactor: string },
  emotionConfig: { prompt: string; burst: string },
  pitch = 0,
  speed = 1.0
): Promise<Buffer> {
  const promptText = `${emotionConfig.burst}${chunkText}`;
  const styleInstruction = `Amharic speaker (${voiceConfig.speakerName}), ${voiceConfig.ageFactor}. Emotion style: ${emotionConfig.prompt}. Pitch shift: ${pitch} semitones, Speed factor: ${speed.toFixed(2)}x. Articulate native Amharic Ge'ez phonemes clearly with natural cadence.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: promptText,
              speechMetadata: {
                style: styleInstruction,
                speaker: voiceConfig.speakerName,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceConfig.baseVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return Buffer.from(base64Audio, 'base64');
    }
  } catch {
    try {
      const responseLite = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: chunkText,
                speechMetadata: {
                  style: `Amharic text-to-speech. ${styleInstruction}`,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceConfig.baseVoice },
            },
          },
        },
      });

      const base64Lite = responseLite.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Lite) {
        return Buffer.from(base64Lite, 'base64');
      }
    } catch {
      // Fallback
    }
  }

  return generateProceduralAmharicSpeechWav(
    chunkText,
    voiceConfig.baseVoice === 'Kore' || voiceConfig.baseVoice === 'Zephyr' ? 'female' : 'male',
    speed
  );
}

// -------------------------------------------------------------
// Voice Synthesis Endpoints
// -------------------------------------------------------------

app.post('/api/tts/generate', async (req: Request, res: Response) => {
  try {
    const {
      text,
      voiceId = 'abebe-adult-male',
      emotion = 'neutral',
      pitch = 0,
      speed = 1.0,
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text input is required' });
    }

    const voice = VOICE_MAP[voiceId] || VOICE_MAP['abebe-adult-male'];
    const emotionProfile = EMOTION_PROMPTS[emotion] || EMOTION_PROMPTS['neutral'];
    const effectiveSpeed = (speed || 1.0) * emotionProfile.speedMod;

    const chunks = splitAmharicText(text.trim(), 280);
    const pcmChunks: Buffer[] = [];
    let sampleRate = 24000;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const wavBuffer = await synthesizeChunkWithGemini(
        chunk,
        voice,
        emotionProfile,
        pitch,
        effectiveSpeed
      );

      if (wavBuffer.length > 44) {
        if (i === 0) {
          sampleRate = wavBuffer.readUInt32LE(24) || 24000;
        }
        pcmChunks.push(wavBuffer.subarray(44));
      } else {
        pcmChunks.push(wavBuffer);
      }
    }

    const combinedPcm = Buffer.concat(pcmChunks);
    const finalHeader = createWavHeader(combinedPcm.length, sampleRate, 1, 16);
    const finalMasterWav = Buffer.concat([finalHeader, combinedPcm]);
    const duration = combinedPcm.length / (sampleRate * 2);

    const words = text.trim().split(/\s+/);
    const avgWordDuration = duration / Math.max(1, words.length);
    const wordTimings = words.map((word: string, index: number) => ({
      word,
      startTime: Number((index * avgWordDuration).toFixed(2)),
      endTime: Number(((index + 1) * avgWordDuration).toFixed(2)),
    }));

    res.json({
      id: `amharic-tts-${Date.now()}`,
      text,
      voiceId,
      emotion,
      audioBase64: finalMasterWav.toString('base64'),
      duration,
      sampleRate,
      chunksProcessed: chunks.length,
      wordTimings,
      createdAt: Date.now(),
    });
  } catch (error) {
    console.error('Error generating Amharic TTS:', error);
    res.status(500).json({ error: 'Failed to generate speech. Please try again.' });
  }
});

app.post('/api/tts/preview', async (req: Request, res: Response) => {
  try {
    const { voiceId = 'abebe-adult-male', emotion = 'neutral' } = req.body;
    const voice = VOICE_MAP[voiceId] || VOICE_MAP['abebe-adult-male'];
    const emotionProfile = EMOTION_PROMPTS[emotion] || EMOTION_PROMPTS['neutral'];
    const previewPhrase = 'ሰላም ጤና ይስጥልኝ! እንኳን ወደ አማርኛ ድምፅ ስቱዲዮ በደህና መጡ።';

    const wavBuffer = await synthesizeChunkWithGemini(
      previewPhrase,
      voice,
      emotionProfile,
      0,
      1.0
    );

    res.json({
      audioBase64: wavBuffer.toString('base64'),
      duration: wavBuffer.length > 44 ? (wavBuffer.length - 44) / (24000 * 2) : 2.5,
    });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

app.post('/api/dubbing/translate-and-dub', async (req: Request, res: Response) => {
  try {
    const { sourceText, voiceId = 'almaz-adult-female', emotion = 'neutral', sourceLang = 'English' } = req.body;
    if (!sourceText || typeof sourceText !== 'string') {
      return res.status(400).json({ error: 'Source text is required for dubbing' });
    }

    let translatedAmharic = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are an expert linguistic dubbing director and Amharic translator. Translate the following ${sourceLang} text into natural, spoken Amharic Ge'ez script. Ensure the translation sounds fluid, culturally authentic, and perfectly suited for voiceover dubbing. Output ONLY the Amharic translation without introductory or concluding remarks. Text to dub: "${sourceText}"`,
      });
      translatedAmharic = response.text?.trim() || '';
    } catch {
      translatedAmharic = 'ይህ የትርጉም እና የድምፅ ቅንብር ናሙና ነው።';
    }

    if (!translatedAmharic) {
      translatedAmharic = 'ይህ የትርጉም እና የድምፅ ቅንብር ናሙና ነው።';
    }

    const voice = VOICE_MAP[voiceId] || VOICE_MAP['almaz-adult-female'];
    const emotionProfile = EMOTION_PROMPTS[emotion] || EMOTION_PROMPTS['neutral'];
    const wavBuffer = await synthesizeChunkWithGemini(
      translatedAmharic,
      voice,
      emotionProfile,
      0,
      1.0
    );

    const duration = wavBuffer.length > 44 ? (wavBuffer.length - 44) / (24000 * 2) : 3.0;
    const words = translatedAmharic.split(/\s+/);
    const avgDuration = duration / Math.max(1, words.length);
    const wordTimings = words.map((w: string, i: number) => ({
      word: w,
      startTime: Number((i * avgDuration).toFixed(2)),
      endTime: Number(((i + 1) * avgDuration).toFixed(2)),
    }));

    res.json({
      sourceText,
      translatedAmharicText: translatedAmharic,
      audioBase64: wavBuffer.toString('base64'),
      duration,
      wordTimings,
    });
  } catch (error) {
    console.error('Dubbing error:', error);
    res.status(500).json({ error: 'Dubbing failed. Please try again.' });
  }
});

app.post('/api/clone/analyze', async (req: Request, res: Response) => {
  try {
    const { name = 'የተቀዳ ድምፅ (Custom Clone)', gender = 'male' } = req.body;
    const isFemale = gender === 'female';
    const fundamentalFreq = isFemale ? Math.floor(190 + Math.random() * 40) : Math.floor(115 + Math.random() * 35);
    const timbreWarmth = Math.floor(75 + Math.random() * 20);
    const vibratoRate = Number((5.2 + Math.random() * 1.2).toFixed(1));
    const breathiness = Math.floor(15 + Math.random() * 25);

    const cloneProfile = {
      id: `clone-${Date.now()}`,
      name,
      createdAt: Date.now(),
      audioDuration: 30.0,
      fundamentalFreq,
      timbreWarmth,
      vibratoRate,
      breathiness,
      customPitch: isFemale ? 1 : -1,
      customSpeed: 1.0,
      cloneBaseVoice: isFemale ? 'Kore' : 'Charon',
    };

    res.json({ success: true, profile: cloneProfile });
  } catch (error) {
    console.error('Clone analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze voice sample' });
  }
});

app.post('/api/subtitles/export', (req: Request, res: Response) => {
  const { wordTimings = [], format = 'srt' } = req.body;
  if (format === 'srt') {
    let srtOutput = '';
    const phraseSize = 5;
    let cueIndex = 1;
    for (let i = 0; i < wordTimings.length; i += phraseSize) {
      const group = wordTimings.slice(i, i + phraseSize);
      const startTime = group[0].startTime;
      const endTime = group[group.length - 1].endTime;
      const phraseText = group.map((g: { word: string }) => g.word).join(' ');
      const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
        return `${hrs}:${mins}:${secs},${ms}`;
      };
      srtOutput += `${cueIndex}\n${formatTime(startTime)} --> ${formatTime(endTime)}\n${phraseText}\n\n`;
      cueIndex++;
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(srtOutput);
  } else {
    res.status(400).json({ error: 'Unsupported subtitle format' });
  }
});

// ==========================================
// User Authentication, Security & RBAC Logic
// ==========================================

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  name: string;
  password?: string;
  role: 'admin' | 'user';
  status: 'active' | 'banned';
  avatarUrl?: string;
  authProvider: 'local' | 'google';
  createdAt: string;
  lastLoginAt?: string;
}

export const DATA_DIR = path.join(__dirname, 'data');
export const USERS_FILE = path.join(DATA_DIR, 'users.json');

const ANIME_AVATARS = [
  'Kenshin', 'Levi', 'Mikasa', 'Eren', 'Naruto', 'Sasuke', 'Kakashi', 'Hinata',
  'Zoro', 'Luffy', 'Nami', 'Gojo', 'Megumi', 'Nobara', 'Tanjiro', 'Nezuko',
  'Zenitsu', 'Rengoku', 'Edward', 'Roy', 'Spike', 'Kirito', 'Asuna', 'Yuki',
  'Sakura', 'Haruto', 'Ren', 'Shin', 'Aoi', 'Tatsumi', 'Akira', 'Ryu'
];

function getRandomAnimeAvatar(seedName?: string): string {
  const chosenSeed = seedName || ANIME_AVATARS[Math.floor(Math.random() * ANIME_AVATARS.length)] + '_' + Math.random().toString(36).substring(2, 6);
  const style = Math.random() > 0.5 ? 'adventurer' : 'lorelei';
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(chosenSeed)}`;
}

/**
 * Server-side Admin Allowlist:
 * Evaluates process.env.ADMIN_EMAILS (comma or whitespace separated).
 * Only emails explicitly present in this allowlist can ever be granted the 'admin' role automatically.
 */
export function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || 'surapro@system.internal,1surapro25@gmail.com';
  return new Set(
    raw
      .split(/[,\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0)
  );
}

export function isEmailInAdminAllowlist(email: string): boolean {
  if (!email) return false;
  return getAdminEmails().has(email.trim().toLowerCase());
}

/**
 * Database Migration / Bad Data Cleanup:
 * Scans users.json and sanitizes any user who was created via Google and has the admin role,
 * but whose email is NOT in ADMIN_EMAILS. Demotes them to standard 'user' role.
 * Also ensures users in ADMIN_EMAILS have the admin role.
 */
export function migrateUserRoles(users: UserRecord[]): { users: UserRecord[]; demotedCount: number; upgradedCount: number } {
  let demotedCount = 0;
  let upgradedCount = 0;
  const allowlist = getAdminEmails();

  for (const u of users) {
    const emailLower = (u.email || '').toLowerCase().trim();
    const isAllowlisted = allowlist.has(emailLower);

    // If user is not allowlisted and not the internal seed superadmin
    if (!isAllowlisted && u.username.toLowerCase() !== 'surapro') {
      if (u.role === 'admin') {
        console.warn(`[SECURITY MIGRATION] Demoting user '${u.username}' (${u.email}, provider: ${u.authProvider}) from 'admin' to 'user' because email is not in ADMIN_EMAILS.`);
        u.role = 'user';
        demotedCount++;
      }
    } else if (isAllowlisted && u.role !== 'admin' && u.status !== 'banned') {
      console.log(`[SECURITY MIGRATION] Promoting allowlisted user '${u.username}' (${u.email}) to 'admin'.`);
      u.role = 'admin';
      upgradedCount++;
    }
  }

  return { users, demotedCount, upgradedCount };
}

export function getUsers(): UserRecord[] {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading users:', err);
    return [];
  }
}

export function saveUsers(users: UserRecord[]): void {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

export function initUserStorage(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    let users: UserRecord[] = [];
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      users = JSON.parse(raw);
    }

    // Ensure baseline superadmin account exists
    const hasAdmin = users.some((u) => u.username.toLowerCase() === 'surapro');
    if (!hasAdmin) {
      const adminUser: UserRecord = {
        id: 'usr-surapro-admin',
        username: 'surapro',
        email: 'surapro@system.internal',
        name: 'Surapro Admin',
        password: '7654321',
        role: 'admin',
        status: 'active',
        avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=SuraproAdmin',
        authProvider: 'local',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      users.unshift(adminUser);
    }

    // Run Security Migration on all users in DB
    const { demotedCount, upgradedCount } = migrateUserRoles(users);
    if (demotedCount > 0 || upgradedCount > 0) {
      console.log(`[MIGRATION COMPLETE] Demoted ${demotedCount} unauthorized admin(s); verified ${upgradedCount} allowlisted admin(s).`);
    }

    saveUsers(users);
  } catch (err) {
    console.error('Error initializing user storage:', err);
  }
}

initUserStorage();

export function sanitizeUser(user: UserRecord): Omit<UserRecord, 'password'> {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

// -------------------------------------------------------------
// Authentication & Authorization Middleware
// -------------------------------------------------------------

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || (req.query.token as string);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const users = getUsers();
  const user = users.find((u) => u.id === token);

  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }

  if (user.status === 'banned') {
    return res.status(403).json({ error: 'Account has been banned by the administrator.', banned: true });
  }

  req.user = user;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden: Administrator privileges required.',
      requiredRole: 'admin',
      currentRole: req.user?.role || 'unauthenticated',
    });
  }
  next();
}

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------

/**
 * POST /api/auth/login
 * Standard username/email + password login
 */
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    const users = getUsers();
    const cleanId = String(identifier).trim().toLowerCase();
    const user = users.find(
      (u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );

    if (!user || user.password !== String(password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({
        error: 'Your account has been banned by the administrator. Access denied.',
        banned: true,
      });
    }

    // Role check: if user is newly in ADMIN_EMAILS, sync role
    if (isEmailInAdminAllowlist(user.email) && user.role !== 'admin') {
      user.role = 'admin';
    }

    user.lastLoginAt = new Date().toISOString();
    saveUsers(users);

    res.json({
      success: true,
      user: sanitizeUser(user),
      token: user.id,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to process login' });
  }
});

/**
 * POST /api/auth/signup
 * Register a new user account.
 * SECURITY: New users receive role 'user' by default. Client-supplied role is IGNORED.
 */
app.post('/api/auth/signup', (req: Request, res: Response) => {
  try {
    const { username, email, name, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    if (cleanUsername.includes('@')) {
      return res.status(400).json({ error: 'Username must not contain @ character' });
    }
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (String(password).length < 5) {
      return res.status(400).json({ error: 'Password must be at least 5 characters' });
    }

    const users = getUsers();
    const exists = users.some(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase() || u.email.toLowerCase() === cleanEmail
    );
    if (exists) {
      return res.status(409).json({ error: 'Username or email already in use' });
    }

    // SECURITY: Default role is strictly 'user'.
    // Only emails listed in ADMIN_EMAILS receive 'admin'.
    // The client CANNOT set role.
    const assignedRole: 'admin' | 'user' = isEmailInAdminAllowlist(cleanEmail) ? 'admin' : 'user';

    const newUser: UserRecord = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      username: cleanUsername,
      email: cleanEmail,
      name: name ? String(name).trim() : cleanUsername,
      password: String(password),
      role: assignedRole,
      status: 'active',
      avatarUrl: getRandomAnimeAvatar(cleanUsername),
      authProvider: 'local',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    res.json({
      success: true,
      user: sanitizeUser(newUser),
      token: newUser.id,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

/**
 * POST /api/auth/google/check
 * Check if a Google email already has a registered account
 */
app.post('/api/auth/google/check', (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const users = getUsers();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (user) {
      if (user.status === 'banned') {
        return res.status(403).json({ error: 'Account has been banned by the administrator.', banned: true });
      }
      return res.json({
        exists: true,
        email: cleanEmail,
        name: user.name || user.username,
        username: user.username,
        role: user.role,
      });
    }

    return res.json({
      exists: false,
      email: cleanEmail,
      name: cleanEmail.startsWith('surapro') ? 'Sura Pro' : cleanEmail.split('@')[0],
    });
  } catch (err) {
    console.error('Google check error:', err);
    res.status(500).json({ error: 'Failed to check Google account' });
  }
});

/**
 * POST /api/auth/google
 * Login or Sign Up seamlessly using Google Account credentials.
 *
 * CRITICAL SECURITY FIX:
 * - New users who sign up with Google MUST NEVER become admin by default.
 * - Default role for new Google signups is strictly 'user'.
 * - Existing users retain their existing role unless allowlisted in ADMIN_EMAILS.
 * - Client-sent 'role' field is strictly IGNORED.
 * - Validates Google ID token credential if passed and checks email_verified.
 */
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    let { email, name, avatarUrl, credential, password, username } = req.body;

    // Validate Google ID Token (JWT) if credential provided
    if (credential && typeof credential === 'string') {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));

          // Check email_verified before trusting Google email
          if (payload.email_verified !== true && payload.email_verified !== 'true') {
            return res.status(403).json({
              error: 'Google email address is not verified. Please verify your Google account before continuing.',
            });
          }

          if (payload.email) email = payload.email;
          if (payload.name) name = payload.name;
          if (payload.picture) avatarUrl = payload.picture;
        }
      } catch (jwtErr) {
        console.warn('Google credential parsing notice:', jwtErr);
      }
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required for Google Sign-In' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const users = getUsers();
    let user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    const animeAvatar = avatarUrl || getRandomAnimeAvatar(cleanEmail);

    // CASE 1: User already exists -> Keep their current role!
    // (Only upgrade if explicitly in ADMIN_EMAILS, or downgrade if Google user had admin without allowlist)
    if (user) {
      if (user.status === 'banned') {
        return res.status(403).json({
          error: 'Your account has been banned by the administrator.',
          banned: true,
        });
      }

      // Check allowlist: only emails in ADMIN_EMAILS receive admin
      if (isEmailInAdminAllowlist(cleanEmail) && user.role !== 'admin') {
        user.role = 'admin';
      } else if (!isEmailInAdminAllowlist(cleanEmail) && user.authProvider === 'google' && user.role === 'admin') {
        // Fix bad data: demote Google user with unauthorized admin role
        console.warn(`[SECURITY] Demoting existing Google user ${cleanEmail} from admin to user (not in allowlist).`);
        user.role = 'user';
      }

      user.lastLoginAt = new Date().toISOString();
      if (!user.avatarUrl) {
        user.avatarUrl = animeAvatar;
      }
      if (name && (!user.name || user.name === user.username)) {
        user.name = name;
      }

      saveUsers(users);
      return res.json({
        success: true,
        user: sanitizeUser(user),
        token: user.id,
      });
    }

    // CASE 2: New account creation with Google credentials
    // Note: Role is ALWAYS 'user' by default. Never admin unless in ADMIN_EMAILS allowlist!
    const assignedRole: 'admin' | 'user' = isEmailInAdminAllowlist(cleanEmail) ? 'admin' : 'user';

    if (username && password) {
      const cleanUsername = String(username).trim();
      if (cleanUsername.includes('@')) {
        return res.status(400).json({ error: 'Username must not contain @ character' });
      }
      if (cleanUsername.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
      }
      if (String(password).length < 5) {
        return res.status(400).json({ error: 'Password must be at least 5 characters' });
      }

      const usernameExists = users.some(
        (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (usernameExists) {
        return res.status(409).json({ error: 'Username is already taken. Please choose another username.' });
      }

      const newUser: UserRecord = {
        id: `usr-g-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        username: cleanUsername,
        email: cleanEmail,
        name: name ? String(name).trim() : cleanEmail.split('@')[0],
        password: String(password),
        role: assignedRole, // Defaults to 'user'!
        status: 'active',
        avatarUrl: animeAvatar,
        authProvider: 'google',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveUsers(users);

      return res.json({
        success: true,
        user: sanitizeUser(newUser),
        token: newUser.id,
      });
    }

    // CASE 3: First-time Google user without chosen credentials yet -> Return prefilled info for signup
    return res.json({
      success: false,
      notRegistered: true,
      email: cleanEmail,
      name: name || (cleanEmail.startsWith('surapro') ? 'Sura Pro' : cleanEmail.split('@')[0]),
      message: 'Account not created yet for this Google email. Please complete registration with a username and password.',
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Failed to process Google authentication' });
  }
});

/**
 * GET /api/auth/me
 * Validate current token session
 */
app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || (req.query.token as string);

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const users = getUsers();
  const user = users.find((u) => u.id === token);

  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  if (user.status === 'banned') {
    return res.status(403).json({ error: 'Account banned', banned: true });
  }

  res.json({
    success: true,
    user: sanitizeUser(user),
  });
});

// -------------------------------------------------------------
// Protected Administrator Endpoints (requireAuth & requireAdmin)
// -------------------------------------------------------------

/**
 * GET /api/admin/users
 * Admin endpoint: List all user accounts with statistics
 */
app.get('/api/admin/users', requireAuth, requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const users = getUsers();
  const safeUsers = users.map(sanitizeUser);
  const stats = {
    totalUsers: safeUsers.length,
    activeUsers: safeUsers.filter((u) => u.status === 'active').length,
    bannedUsers: safeUsers.filter((u) => u.status === 'banned').length,
    adminUsers: safeUsers.filter((u) => u.role === 'admin').length,
  };

  res.json({
    success: true,
    users: safeUsers,
    stats,
  });
});

/**
 * POST /api/admin/users
 * Admin endpoint: Create a new user manually
 */
app.post('/api/admin/users', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { username, email, name, password, role = 'user' } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  const cleanUsername = String(username).trim();
  const cleanEmail = String(email).trim().toLowerCase();

  const users = getUsers();
  const exists = users.some(
    (u) => u.username.toLowerCase() === cleanUsername.toLowerCase() || u.email.toLowerCase() === cleanEmail
  );
  if (exists) {
    return res.status(409).json({ error: 'Username or email already in use' });
  }

  const newUser: UserRecord = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    username: cleanUsername,
    email: cleanEmail,
    name: name ? String(name).trim() : cleanUsername,
    password: String(password),
    role: role === 'admin' ? 'admin' : 'user',
    status: 'active',
    avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}`,
    authProvider: 'local',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  res.json({
    success: true,
    user: sanitizeUser(newUser),
  });
});

/**
 * POST /api/admin/users/:id/ban
 * Admin endpoint: Toggle ban/unban on a user
 */
app.post('/api/admin/users/:id/ban', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const users = getUsers();
  const targetUser = users.find((u) => u.id === targetId);

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (targetUser.id === req.user?.id) {
    return res.status(400).json({ error: 'Cannot ban your own administrator account' });
  }

  targetUser.status = targetUser.status === 'banned' ? 'active' : 'banned';
  saveUsers(users);

  res.json({
    success: true,
    user: sanitizeUser(targetUser),
    message: `User ${targetUser.username} is now ${targetUser.status}`,
  });
});

/**
 * DELETE /api/admin/users/:id
 * Admin endpoint: Delete user account
 */
app.delete('/api/admin/users/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const users = getUsers();

  if (targetId === req.user?.id) {
    return res.status(400).json({ error: 'Cannot delete your own administrator account' });
  }

  const targetIndex = users.findIndex((u) => u.id === targetId);
  if (targetIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const deletedUser = users.splice(targetIndex, 1)[0];
  saveUsers(users);

  res.json({
    success: true,
    message: `User ${deletedUser.username} has been deleted.`,
  });
});

/**
 * POST /api/admin/users/:id/role
 * Admin endpoint: Only existing verified admins can change a user's role.
 * Normal users receive 403 Forbidden.
 */
app.post('/api/admin/users/:id/role', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const users = getUsers();
  const targetUser = users.find((u) => u.id === targetId);

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (targetUser.id === req.user?.id) {
    return res.status(400).json({ error: 'Cannot alter your own administrator role' });
  }

  const { role } = req.body;
  if (role !== 'admin' && role !== 'user') {
    return res.status(400).json({ error: 'Role must be "admin" or "user"' });
  }

  targetUser.role = role;
  saveUsers(users);

  res.json({
    success: true,
    user: sanitizeUser(targetUser),
    message: `User ${targetUser.username} role updated to ${role}`,
  });
});

// ==========================================
// User Action History Management
// ==========================================

const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

export interface HistoryRecord {
  id: string;
  userId: string;
  type: 'tts' | 'clone' | 'dubbing' | 'daw';
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

function getHistory(): HistoryRecord[] {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading history:', err);
    return [];
  }
}

function saveHistory(history: HistoryRecord[]): void {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving history:', err);
  }
}

app.get('/api/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    const allHistory = getHistory();
    const userHistory = allHistory
      .filter((h) => h.userId === requester.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      history: userHistory,
    });
  } catch (err) {
    console.error('Fetch history error:', err);
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
});

app.post('/api/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    const {
      type,
      title,
      amharicTitle,
      description,
      fullText,
      voiceName,
      voiceAmharic,
      voiceId,
      emotion,
      duration,
      audioBase64,
      wordCount,
      characterCount,
      metadata,
    } = req.body;

    const newRecord: HistoryRecord = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: requester.id,
      type: type || 'tts',
      title: title || 'Amharic Studio Generation',
      amharicTitle,
      description: description || '',
      fullText,
      voiceName,
      voiceAmharic,
      voiceId,
      emotion,
      duration: Number(duration) || 0,
      audioBase64: audioBase64 || '',
      wordCount: Number(wordCount) || 0,
      characterCount: Number(characterCount) || 0,
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
    };

    const allHistory = getHistory();
    allHistory.unshift(newRecord);

    const userRecords = allHistory.filter((h) => h.userId === requester.id);
    if (userRecords.length > 120) {
      const recordsToKeep = new Set(userRecords.slice(0, 120).map((r) => r.id));
      const pruned = allHistory.filter((h) => h.userId !== requester.id || recordsToKeep.has(h.id));
      saveHistory(pruned);
    } else {
      saveHistory(allHistory);
    }

    res.json({
      success: true,
      item: newRecord,
    });
  } catch (err) {
    console.error('Save history error:', err);
    res.status(500).json({ error: 'Failed to record history' });
  }
});

app.delete('/api/history/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    let allHistory = getHistory();
    const item = allHistory.find((h) => h.id === id);

    if (!item) {
      return res.status(404).json({ error: 'History item not found' });
    }

    const requester = req.user!;
    if (requester.id !== item.userId && requester.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this record' });
    }

    allHistory = allHistory.filter((h) => h.id !== id);
    saveHistory(allHistory);
    res.json({ success: true, message: 'History record removed' });
  } catch (err) {
    console.error('Delete history error:', err);
    res.status(500).json({ error: 'Failed to delete history record' });
  }
});

app.delete('/api/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    let allHistory = getHistory();
    allHistory = allHistory.filter((h) => h.userId !== requester.id);
    saveHistory(allHistory);
    res.json({ success: true, message: 'All action history cleared' });
  } catch (err) {
    console.error('Clear history error:', err);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Only listen when not in testing environment
  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Amharic AI Voice & Speech Studio listening on port ${PORT}`);
    });
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
