import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  Sparkles,
  Download,
  RefreshCw,
  Send,
  Radio,
  CheckCircle2,
  Zap,
  History as HistoryIcon
} from 'lucide-react';
import { AmharicTextEditor } from './AmharicTextEditor';
import {
  VoicePersona,
  EmotionType,
  SpeechSettings,
  GeneratedSpeechResult,
  TimelineClip
} from '../types';
import { VOICE_PERSONAS } from '../data/voices';
import { audioEngine } from '../utils/audioEngine';
import { useHistory } from '../context/HistoryContext';

interface TTSStudioProps {
  onSendToDAW: (clip: Partial<TimelineClip>, trackType?: 'voice') => void;
  onOpenExportModal: () => void;
  activeGeneratedSpeech: GeneratedSpeechResult | null;
  setActiveGeneratedSpeech: (result: GeneratedSpeechResult | null) => void;
}

export const TTSStudio: React.FC<TTSStudioProps> = ({
  onSendToDAW,
  activeGeneratedSpeech,
  setActiveGeneratedSpeech,
}) => {
  const { addHistoryItem, registerScriptLoader, setIsHistoryModalOpen, historyItems } = useHistory();

  const [selectedVoice, setSelectedVoice] = useState<VoicePersona>(VOICE_PERSONAS[0]);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType>('neutral');

  const [settings, setSettings] = useState<SpeechSettings>({
    pitch: 0,
    speed: 1.0,
    intensity: 100,
    breathiness: 20,
    pauseCadence: 1.0,
    vocalClarity: 100,
  });

  const [text, setText] = useState<string>(
    'ሰላም ለኢትዮጵያ! የአማርኛ ንግግር እና ድምፅ ስቱዲዮ እንኳን ደህና መጡ። እዚህ ማንኛውንም ጽሑፍ በከፍተኛ ጥራት ወደ እውነተኛ ንግግር መቀየር ይችላሉ።'
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [previewPlayingVoiceId, setPreviewPlayingVoiceId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    registerScriptLoader((newText: string, voiceId?: string) => {
      setText(newText);
      if (voiceId) {
        const found = VOICE_PERSONAS.find((v) => v.id === voiceId);
        if (found) {
          setSelectedVoice(found);
        }
      }
    });
  }, [registerScriptLoader]);

  const handleUpdateSettings = (newSettings: Partial<SpeechSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleResetSettings = () => {
    setSettings({
      pitch: selectedVoice.pitchDefault,
      speed: selectedVoice.speedDefault,
      intensity: 100,
      breathiness: 20,
      pauseCadence: 1.0,
      vocalClarity: 100,
    });
  };

  const handleSelectVoice = (voice: VoicePersona) => {
    setSelectedVoice(voice);
    setSettings((prev) => ({
      ...prev,
      pitch: voice.pitchDefault,
      speed: voice.speedDefault,
    }));
  };

  const handlePreviewSample = async (voice: VoicePersona) => {
    try {
      if (previewPlayingVoiceId === voice.id) {
        if (audioRef.current) audioRef.current.pause();
        setPreviewPlayingVoiceId(null);
        return;
      }
      setPreviewPlayingVoiceId(voice.id);
      const res = await fetch('/api/tts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceId: voice.id, emotion: selectedEmotion }),
      });
      const data = await res.json();
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        audio.play();
        audio.onended = () => setPreviewPlayingVoiceId(null);
      } else {
        setPreviewPlayingVoiceId(null);
      }
    } catch {
      setPreviewPlayingVoiceId(null);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    try {
      setIsGenerating(true);
      setGenerationProgress('Analyzing Amharic Ge\'ez phonemes & accents...');
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: selectedVoice.id,
          emotion: selectedEmotion,
          pitch: settings.pitch,
          speed: settings.speed,
          intensity: settings.intensity,
          breathiness: settings.breathiness,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }
      setGenerationProgress('Rendering multi-layer acoustic synthesis...');
      const data: GeneratedSpeechResult = await response.json();
      setActiveGeneratedSpeech(data);

      try {
        await addHistoryItem({
          type: 'tts',
          title: `${selectedVoice.name} (${selectedVoice.amharicName})`,
          amharicTitle: `${selectedVoice.amharicName} - ${selectedEmotion}`,
          description: text.slice(0, 120) + (text.length > 120 ? '...' : ''),
          fullText: text,
          voiceName: selectedVoice.name,
          voiceAmharic: selectedVoice.amharicName,
          voiceId: selectedVoice.id,
          emotion: selectedEmotion,
          duration: data.duration,
          audioBase64: data.audioBase64,
          wordCount: text.trim().split(/\s+/).length,
          characterCount: text.length,
        });
      } catch (histErr) {
        console.error('Failed to log history', histErr);
      }

      if (audioRef.current) {
        audioRef.current.src = `data:audio/wav;base64,${data.audioBase64}`;
        audioRef.current.playbackRate = 1.0;
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioEngine.getContext();
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSendToDAW = () => {
    if (!activeGeneratedSpeech) return;
    onSendToDAW({
      title: `${selectedVoice.name} - ${selectedEmotion} (${activeGeneratedSpeech.duration.toFixed(1)}s)`,
      audioBase64: activeGeneratedSpeech.audioBase64,
      duration: activeGeneratedSpeech.duration,
      color: '#f59e0b',
    }, 'voice');
  };

  const handleDownloadWav = () => {
    if (!activeGeneratedSpeech) return;
    const link = document.createElement('a');
    link.href = `data:audio/wav;base64,${activeGeneratedSpeech.audioBase64}`;
    link.download = `amharic-tts-${selectedVoice.name.toLowerCase()}-${Date.now()}.wav`;
    link.click();
  };

  const currentWordIndex = activeGeneratedSpeech?.wordTimings?.findIndex(
    (wt) => currentTime >= wt.startTime && currentTime <= wt.endTime
  );

  return (
    <div className="space-y-6">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      <AmharicTextEditor
        text={text}
        onChangeText={setText}
        selectedVoice={selectedVoice}
        onSelectVoice={handleSelectVoice}
        previewPlayingVoiceId={previewPlayingVoiceId}
        onPreviewSample={handlePreviewSample}
        selectedEmotion={selectedEmotion}
        onSelectEmotion={setSelectedEmotion}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetSettings={handleResetSettings}
      />

      <div className="rounded-2xl sm:rounded-3xl border-2 border-blue-900/60 bg-[#040a24]/90 p-4 sm:p-5 backdrop-blur-xl shadow-[0_0_30px_rgba(0,140,255,0.2)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 flex items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Zap className="h-5 w-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm sm:text-base">
                  Ready to Synthesize: <span className="text-amber-300">{selectedVoice.name}</span> ({selectedVoice.amharicName})
                </span>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/30">
                  {selectedEmotion.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-cyan-300/80 mt-0.5">
                Speed: {settings.speed.toFixed(2)}x • Pitch: {settings.pitch}st • 100% Free Unrestricted Master
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-blue-800/80 bg-[#061239] hover:bg-blue-900/50 hover:border-cyan-400/60 px-4 py-3 text-xs font-bold text-cyan-300 transition-all cursor-pointer shadow-md"
              title="View your past actions and generated speech"
            >
              <HistoryIcon className="h-4 w-4 text-cyan-400" />
              <span>Past Actions</span>
              <span className="rounded-full bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 text-[10px] font-mono border border-cyan-500/40">
                {historyItems.length}
              </span>
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !text.trim()}
              className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-6 py-3 text-sm font-extrabold text-zinc-950 shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer ring-1 ring-amber-300/60"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-zinc-950" />
                  <span>Synthesizing Audio...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 fill-zinc-950" />
                  <span>Generate Amharic Speech</span>
                </>
              )}
            </button>
          </div>
        </div>

        {isGenerating && (
          <div className="mt-4 pt-3 border-t border-blue-900/60 flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-blue-950/80 overflow-hidden border border-blue-800/40">
              <div className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 animate-pulse w-3/4 rounded-full" />
            </div>
            <span className="text-xs font-semibold text-amber-300 animate-pulse">
              {generationProgress || 'Processing continuous audio chunks...'}
            </span>
          </div>
        )}
      </div>

      {activeGeneratedSpeech && (
        <div className="rounded-2xl sm:rounded-3xl border-2 border-amber-500/50 bg-[#040822]/95 p-4 sm:p-5 shadow-[0_0_35px_rgba(245,158,11,0.25)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Speech Generated Successfully</span>
                  <span className="font-mono text-xs font-normal text-cyan-300">
                    ({activeGeneratedSpeech.duration.toFixed(1)}s • {activeGeneratedSpeech.chunksProcessed} chunks)
                  </span>
                </h3>
                <p className="text-xs text-zinc-300">
                  Ready for playback, direct timeline editing, or studio master export.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSendToDAW}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-zinc-950 font-extrabold px-4 py-2 text-xs shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send to DAW Timeline</span>
              </button>
              <button
                onClick={handleDownloadWav}
                className="flex items-center gap-1.5 rounded-xl border border-blue-900 bg-[#08153c] hover:bg-[#0c1f55] text-cyan-200 font-semibold px-4 py-2 text-xs transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" />
                <span>Download WAV</span>
              </button>
            </div>
          </div>

          <div className="bg-[#020518]/90 rounded-2xl p-4 border border-blue-900/60 space-y-3.5 shadow-inner">
            <div className="flex items-center gap-3.5">
              <button
                onClick={togglePlay}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 hover:brightness-110 text-zinc-950 font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all cursor-pointer active:scale-95"
              >
                {isPlaying ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
              </button>

              <div className="flex-1 space-y-1">
                <input
                  type="range"
                  min="0"
                  max={activeGeneratedSpeech.duration || 1}
                  step="0.05"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[11px] font-mono text-cyan-300">
                  <span>{currentTime.toFixed(1)}s</span>
                  <span>{activeGeneratedSpeech.duration.toFixed(1)}s</span>
                </div>
              </div>
            </div>

            {activeGeneratedSpeech.wordTimings && activeGeneratedSpeech.wordTimings.length > 0 && (
              <div className="p-3.5 rounded-xl bg-[#030922] border border-blue-900/60 max-h-28 overflow-y-auto">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-cyan-400 mb-1.5">
                  <Radio className="h-3 w-3 text-amber-400 animate-pulse" />
                  <span>Real-Time Karaoke Sync:</span>
                </div>
                <p className="font-ethiopic text-sm sm:text-base leading-relaxed text-zinc-200">
                  {activeGeneratedSpeech.wordTimings.map((wt, idx) => {
                    const isCurrent = idx === currentWordIndex;
                    return (
                      <span
                        key={idx}
                        className={`inline-block mr-1.5 px-1.5 py-0.5 rounded-lg transition-all ${
                          isCurrent
                            ? 'bg-amber-400 text-zinc-950 font-extrabold scale-105 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                            : 'text-zinc-300 hover:text-white'
                        }`}
                      >
                        {wt.word}
                      </span>
                    );
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
