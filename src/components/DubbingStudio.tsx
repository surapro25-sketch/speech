import React, { useState } from 'react';
import {
  Languages,
  Sparkles,
  Play,
  Square,
  Send,
  Download,
  RefreshCw,
  ArrowRight,
  Globe,
  Radio
} from 'lucide-react';
import { EmotionType, TimelineClip } from '../types';
import { VOICE_PERSONAS } from '../data/voices';
import { useHistory } from '../context/HistoryContext';

interface DubbingStudioProps {
  onSendToDAW: (clip: Partial<TimelineClip>, trackType?: 'voice' | 'aux') => void;
}

export const DubbingStudio: React.FC<DubbingStudioProps> = ({ onSendToDAW }) => {
  const { addHistoryItem } = useHistory();
  const [sourceLang, setSourceLang] = useState('English');
  const [sourceText, setSourceText] = useState(
    'Artificial intelligence is transforming communication across the world. With Amharic AI Voice Studio, language barriers are completely eliminated with free studio-grade speech.'
  );
  const [selectedVoiceId, setSelectedVoiceId] = useState(VOICE_PERSONAS[1].id);
  const [selectedEmotion] = useState<EmotionType>('neutral');
  const [isDubbing, setIsDubbing] = useState(false);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [dubbedAudioBase64, setDubbedAudioBase64] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handleDub = async () => {
    if (!sourceText.trim()) return;
    try {
      setIsDubbing(true);
      const res = await fetch('/api/dubbing/translate-and-dub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText,
          sourceLang,
          voiceId: selectedVoiceId,
          emotion: selectedEmotion,
        }),
      });
      const data = await res.json();
      setTranslatedText(data.translatedAmharicText);
      setDubbedAudioBase64(data.audioBase64);
      const audioDuration = data.duration || 4.0;
      setDuration(audioDuration);

      addHistoryItem({
        type: 'dubbing',
        title: `Dubbed from ${sourceLang}`,
        amharicTitle: 'የድምፅ ቅንብር',
        description: data.translatedAmharicText,
        fullText: data.translatedAmharicText,
        voiceId: selectedVoiceId,
        emotion: selectedEmotion,
        duration: audioDuration,
        audioBase64: data.audioBase64,
        metadata: { sourceLang, sourceText: sourceText.slice(0, 100) },
      });

      if (audioRef.current) {
        audioRef.current.src = `data:audio/wav;base64,${data.audioBase64}`;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDubbing(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSendToDAW = () => {
    if (!dubbedAudioBase64) return;
    onSendToDAW(
      {
        title: `Amharic Dub - ${sourceLang} (${duration.toFixed(1)}s)`,
        audioBase64: dubbedAudioBase64,
        duration: duration,
        color: '#8b5cf6',
      },
      'aux'
    );
  };

  return (
    <div className="space-y-6">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Languages className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Audio & Foreign Language to Amharic AI Dubbing</span>
              <span className="rounded bg-purple-500/10 px-2 py-0.5 text-xs text-purple-400 border border-purple-500/20">
                Semantic Cultural Adaptation
              </span>
            </h2>
            <p className="font-ethiopic text-xs text-zinc-400 mt-0.5">
              የውጭ ቋንቋዎችን በቀጥታ ወደ አማርኛ ንግግርና ድምፅ የመቀየር ስቱዲዮ
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Source Content
              </h3>
            </div>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="English">English</option>
              <option value="Arabic">Arabic</option>
              <option value="French">French</option>
              <option value="Oromo">Afaan Oromoo</option>
              <option value="Tigrinya">Tigrinya</option>
              <option value="Somali">Somali</option>
              <option value="Spanish">Spanish</option>
            </select>
          </div>

          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            rows={6}
            placeholder="Enter foreign language text to dub into Amharic..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 text-sm text-zinc-200 focus:border-purple-500 focus:outline-none"
          />

          <div className="space-y-2 pt-1 border-t border-zinc-800">
            <label className="text-xs font-semibold text-zinc-400">Target Amharic Persona:</label>
            <div className="grid grid-cols-2 gap-2">
              {VOICE_PERSONAS.slice(0, 4).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVoiceId(v.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedVoiceId === v.id
                      ? 'border-purple-500 bg-purple-500/15 text-white'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <img src={v.avatarUrl} alt={v.name} className="h-7 w-7 rounded-full object-cover" />
                  <div className="truncate">
                    <div className="text-xs font-semibold truncate">{v.name}</div>
                    <div className="font-ethiopic text-[10px] text-amber-400">{v.amharicName}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleDub}
            disabled={isDubbing || !sourceText.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-amber-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-purple-600/20 hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isDubbing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Translating & Synthesizing Amharic Dub...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Translate & Dub to Amharic</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Amharic Dubbed Output
              </h3>
            </div>
            {dubbedAudioBase64 && (
              <span className="font-mono text-xs text-amber-400">{duration.toFixed(1)}s Master</span>
            )}
          </div>

          {translatedText ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-1">
                  Amharic Ge&apos;ez Script
                </span>
                <p className="font-ethiopic text-sm sm:text-base leading-relaxed text-zinc-100 font-medium">
                  {translatedText}
                </p>
              </div>

              {dubbedAudioBase64 && (
                <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <button
                    onClick={togglePlay}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500 hover:bg-purple-400 text-zinc-950 font-bold transition-all shadow-md cursor-pointer"
                  >
                    {isPlaying ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                  </button>
                  <div className="text-xs text-zinc-300">
                    <div>Amharic Dub Audio Master</div>
                    <div className="text-zinc-500 text-[10px]">Studio broadcast clarity</div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={handleSendToDAW}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2.5 text-xs shadow-md transition-all cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Dub to DAW Track 4</span>
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `data:audio/wav;base64,${dubbedAudioBase64}`;
                    link.download = `amharic-dub-${Date.now()}.wav`;
                    link.click();
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>WAV</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-800 rounded-xl">
              <Radio className="h-8 w-8 text-zinc-600 mb-2" />
              <p className="text-xs text-zinc-400 max-w-xs">
                Enter source speech on the left to generate culturally natural Amharic speech dubbing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
