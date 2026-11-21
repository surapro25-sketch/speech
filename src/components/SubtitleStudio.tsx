import React, { useState } from 'react';
import {
  Subtitles,
  Download,
  Type,
  Check,
  Copy,
  Clock
} from 'lucide-react';
import { GeneratedSpeechResult, WordTiming } from '../types';

interface SubtitleStudioProps {
  activeSpeech: GeneratedSpeechResult | null;
}

export const SubtitleStudio: React.FC<SubtitleStudioProps> = ({ activeSpeech }) => {
  const [fontSize, setFontSize] = useState<number>(24);
  const [highlightColor, setHighlightColor] = useState('#f59e0b');
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const demoTimings: WordTiming[] = [
    { word: 'ሰላም', startTime: 0.0, endTime: 0.5 },
    { word: 'ጤና', startTime: 0.5, endTime: 0.8 },
    { word: 'ይስጥልኝ', startTime: 0.8, endTime: 1.4 },
    { word: 'እንኳን', startTime: 1.4, endTime: 1.9 },
    { word: 'ደህና', startTime: 1.9, endTime: 2.5 },
    { word: 'መጡ', startTime: 2.5, endTime: 3.0 },
  ];

  const timings = activeSpeech?.wordTimings && activeSpeech.wordTimings.length > 0
    ? activeSpeech.wordTimings
    : demoTimings;

  const currentWordIndex = timings.findIndex(
    (wt) => currentTime >= wt.startTime && currentTime <= wt.endTime
  );

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const generateSrt = () => {
    let srt = '';
    const phraseSize = 5;
    let cueIndex = 1;
    for (let i = 0; i < timings.length; i += phraseSize) {
      const group = timings.slice(i, i + phraseSize);
      const start = group[0].startTime;
      const end = group[group.length - 1].endTime;
      const phraseText = group.map((g) => g.word).join(' ');
      const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
        return `${hrs}:${mins}:${secs},${ms}`;
      };
      srt += `${cueIndex}\n${formatTime(start)} --> ${formatTime(end)}\n${phraseText}\n\n`;
      cueIndex++;
    }
    return srt;
  };

  const handleDownloadSrt = () => {
    const srtContent = generateSrt();
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `amharic-subtitles-${Date.now()}.srt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySrt = () => {
    navigator.clipboard.writeText(generateSrt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {activeSpeech && (
        <audio
          ref={audioRef}
          src={`data:audio/wav;base64,${activeSpeech.audioBase64}`}
          onTimeUpdate={handleTimeUpdate}
          className="hidden"
        />
      )}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Subtitles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Automatic Amharic Subtitle & Caption Generator</span>
              </h2>
              <p className="font-ethiopic text-xs text-zinc-400 mt-0.5">
                የአማርኛ ንዑስ ርዕስ ማመንጫ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySrt}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy SRT'}</span>
            </button>
            <button
              onClick={handleDownloadSrt}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-4 py-2 text-xs shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download .SRT</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Type className="h-4 w-4 text-cyan-400" />
            <span>Interactive Subtitle Display Preview</span>
          </h3>

          <div className="relative aspect-video w-full rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden flex flex-col justify-end p-6 shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/40 to-transparent pointer-events-none" />
            <div className="relative z-10 text-center">
              <div
                className="font-ethiopic font-bold leading-relaxed px-4 py-2 rounded-xl inline-block bg-black/70 backdrop-blur-sm border border-white/10 shadow-2xl transition-all"
                style={{ fontSize: `${fontSize}px` }}
              >
                {timings.map((wt, idx) => {
                  const isCurrent = idx === currentWordIndex;
                  return (
                    <span
                      key={idx}
                      className="inline-block mx-1 transition-all duration-150"
                      style={{
                        color: isCurrent ? highlightColor : '#ffffff',
                        transform: isCurrent ? 'scale(1.15) translateY(-2px)' : 'scale(1)',
                        textShadow: isCurrent ? `0 0 16px ${highlightColor}` : 'none',
                      }}
                    >
                      {wt.word}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Font Size: {fontSize}px</label>
              <input
                type="range"
                min="16"
                max="40"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Highlight Color:</label>
              <div className="flex gap-2">
                {['#f59e0b', '#10b981', '#06b6d4', '#ec4899', '#ffffff'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setHighlightColor(color)}
                    style={{ backgroundColor: color }}
                    className={`h-6 w-6 rounded-full border-2 transition-transform cursor-pointer ${
                      highlightColor === color ? 'border-white scale-110' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span>Timestamp Cue Alignment</span>
            </h3>
            <span className="text-xs text-zinc-500 font-mono">{timings.length} words mapped</span>
          </div>
          <div className="h-80 overflow-y-auto space-y-2 pr-1">
            {timings.map((wt, idx) => {
              const isCurrent = idx === currentWordIndex;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-zinc-800 bg-zinc-950/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-zinc-500 w-6">#{idx + 1}</span>
                    <span className="font-ethiopic font-bold text-sm text-zinc-200">{wt.word}</span>
                  </div>
                  <div className="font-mono text-xs text-zinc-400 flex items-center gap-2">
                    <span className="text-cyan-400">{wt.startTime.toFixed(2)}s</span>
                    <span>→</span>
                    <span className="text-cyan-400">{wt.endTime.toFixed(2)}s</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
