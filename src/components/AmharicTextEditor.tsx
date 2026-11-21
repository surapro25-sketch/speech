import React, { useState, useRef } from 'react';
import {
  FileText,
  Clock,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Type,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Play,
  Square,
  X,
  Edit3,
  Zap
} from 'lucide-react';
import { VoicePersona, EmotionType, SpeechSettings } from '../types';
import { AMHARIC_SAMPLE_TEXTS, AMHARIC_PUNCTUATION_MARKS, EMOTIONS } from '../data/voices';
import { VoiceMatrix } from './VoiceMatrix';
import { EmotionSelector } from './EmotionSelector';

interface AmharicTextEditorProps {
  text: string;
  onChangeText: (text: string) => void;
  selectedVoice: VoicePersona;
  onSelectVoice: (voice: VoicePersona) => void;
  previewPlayingVoiceId: string | null;
  onPreviewSample: (voice: VoicePersona) => void;
  selectedEmotion: EmotionType;
  onSelectEmotion: (emotion: EmotionType) => void;
  settings: SpeechSettings;
  onUpdateSettings: (settings: Partial<SpeechSettings>) => void;
  onResetSettings: () => void;
}

export const AmharicTextEditor: React.FC<AmharicTextEditorProps> = ({
  text,
  onChangeText,
  selectedVoice,
  onSelectVoice,
  previewPlayingVoiceId,
  onPreviewSample,
  selectedEmotion,
  onSelectEmotion,
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'none' | 'voice' | 'emotion' | 'pauses' | 'presets'>('none');

  const toggleMenu = (menu: 'voice' | 'emotion' | 'pauses' | 'presets') => {
    setActiveMenu((prev) => (prev === menu ? 'none' : menu));
  };

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.max(0, (charCount * 0.11) / (settings.speed || 1.0));
  const estimatedMinutes = (estimatedSeconds / 60).toFixed(1);
  const estimatedChunks = Math.max(1, Math.ceil(charCount / 280));
  const currentEmotionObj = EMOTIONS.find((e) => e.id === selectedEmotion) || EMOTIONS[0];
  const isVoicePlaying = previewPlayingVoiceId === selectedVoice.id;

  const insertPunctuation = (symbol: string) => {
    if (!textareaRef.current) {
      onChangeText(text + symbol);
      return;
    }
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + symbol + text.substring(end);
    onChangeText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + symbol.length, start + symbol.length);
    }, 10);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl border-2 border-[#00a6ff]/80 bg-[#040a24]/90 p-4 sm:p-6 backdrop-blur-xl shadow-[0_0_35px_rgba(0,166,255,0.3)] space-y-4 sm:space-y-5 transition-all">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-blue-900/50 pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.4)]">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-sm sm:text-base tracking-wide flex items-center gap-1.5 uppercase">
              <span className="text-white font-extrabold">UNLIMITED</span>
              <span className="text-[#ffb700] font-black drop-shadow-[0_0_10px_rgba(255,183,0,0.5)]">
                AMHARIC SCRIPT EDITOR
              </span>
            </h2>
            <div className="flex items-center gap-1 rounded-full border border-emerald-400/60 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]">
              <span>No Limits</span>
            </div>
          </div>
          <p className="text-xs italic font-medium tracking-wide text-[#00e5ff] mt-1.5 drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
            Unlimited characters • Up to 30 continuous minutes • Integrated Persona & Emotion menus
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => onChangeText('')}
            disabled={!text}
            className="flex items-center gap-1.5 rounded-xl border border-blue-900/60 bg-[#07133d]/70 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-950/20 disabled:opacity-40 transition-all cursor-pointer"
            title="Clear all text"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
          <button
            onClick={handleCopy}
            disabled={!text}
            className="flex items-center gap-1.5 rounded-xl border border-blue-900/60 bg-[#07133d]/70 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-950/20 disabled:opacity-40 transition-all cursor-pointer"
            title="Copy script to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Streamlined Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row lg:items-center lg:justify-between gap-2.5">
        <button
          onClick={() => toggleMenu('voice')}
          className={`flex items-center justify-between sm:justify-start gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all border cursor-pointer ${
            activeMenu === 'voice'
              ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] ring-1 ring-amber-300'
              : 'bg-[#081335]/90 hover:bg-[#0c1a45] text-white border-blue-500/40 hover:border-cyan-400 shadow-inner'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 shrink-0 overflow-hidden rounded-full border border-amber-400/80 ring-1 ring-amber-400/40">
              <img
                src={selectedVoice.avatarUrl}
                alt={selectedVoice.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">{selectedVoice.name}</span>
              <span className="font-ethiopic text-[11px] text-amber-300 font-semibold">({selectedVoice.amharicName})</span>
            </div>
          </div>
          {activeMenu === 'voice' ? (
            <ChevronUp className="h-3.5 w-3.5 shrink-0 ml-1" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 ml-1" />
          )}
        </button>

        <button
          onClick={() => toggleMenu('emotion')}
          className={`flex items-center justify-between sm:justify-start gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all border cursor-pointer ${
            activeMenu === 'emotion'
              ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] ring-1 ring-amber-300'
              : 'bg-[#081335]/90 hover:bg-[#0c1a45] text-white border-blue-500/40 hover:border-cyan-400 shadow-inner'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm leading-none">{currentEmotionObj.emojis[0]}</span>
            <span className="font-bold">{currentEmotionObj.name.split('/')[0]}</span>
            <span className="font-ethiopic text-[11px] text-cyan-300 font-semibold">({currentEmotionObj.amharicName})</span>
          </div>
          {activeMenu === 'emotion' ? (
            <ChevronUp className="h-3.5 w-3.5 shrink-0 ml-1" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 ml-1" />
          )}
        </button>

        <button
          onClick={() => toggleMenu('pauses')}
          className={`flex items-center justify-between sm:justify-start gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all border cursor-pointer ${
            activeMenu === 'pauses'
              ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : 'bg-[#081335]/90 hover:bg-[#0c1a45] text-white border-blue-500/40 hover:border-cyan-400 shadow-inner'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span>Ge&apos;ez Pauses</span>
            <Sparkles className="h-3 w-3 text-amber-400" />
          </div>
          {activeMenu === 'pauses' ? (
            <ChevronUp className="h-3.5 w-3.5 shrink-0 ml-1" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 ml-1" />
          )}
        </button>

        <button
          onClick={() => toggleMenu('presets')}
          className={`flex items-center justify-between sm:justify-start gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all border cursor-pointer ${
            activeMenu === 'presets'
              ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : 'bg-[#081335]/90 hover:bg-[#0c1a45] text-white border-blue-500/40 hover:border-cyan-400 shadow-inner'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-amber-400" />
            <span>Sample Presets</span>
          </div>
          {activeMenu === 'presets' ? (
            <ChevronUp className="h-3.5 w-3.5 shrink-0 ml-1" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 ml-1" />
          )}
        </button>

        <button
          onClick={() => onPreviewSample(selectedVoice)}
          className={`col-span-1 sm:col-span-2 lg:col-span-1 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition-all cursor-pointer shadow-lg ${
            isVoicePlaying
              ? 'bg-amber-400 text-zinc-950 border border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-pulse'
              : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-zinc-950 hover:brightness-110 shadow-[0_0_18px_rgba(245,158,11,0.5)] ring-1 ring-amber-300/60 active:scale-95'
          }`}
          title="Audition selected actor sample"
        >
          {isVoicePlaying ? (
            <Square className="h-3.5 w-3.5 fill-current" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" />
          )}
          <span>Preview Sample</span>
        </button>
      </div>

      {activeMenu === 'voice' && (
        <div className="rounded-2xl border-2 border-amber-500/60 bg-[#030820]/95 p-4 sm:p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <VoiceMatrix
            selectedVoiceId={selectedVoice.id}
            onSelectVoice={(v) => {
              onSelectVoice(v);
              setActiveMenu('none');
            }}
            onPreviewSample={onPreviewSample}
            previewPlayingVoiceId={previewPlayingVoiceId}
            onCloseMenu={() => setActiveMenu('none')}
            isMenu={true}
          />
        </div>
      )}

      {activeMenu === 'emotion' && (
        <div className="rounded-2xl border-2 border-amber-500/60 bg-[#030820]/95 p-4 sm:p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <EmotionSelector
            selectedEmotion={selectedEmotion}
            onSelectEmotion={onSelectEmotion}
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            onResetSettings={onResetSettings}
            onCloseMenu={() => setActiveMenu('none')}
            isMenu={true}
          />
        </div>
      )}

      {activeMenu === 'pauses' && (
        <div className="rounded-xl border border-blue-500/40 bg-[#030820] p-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-blue-900/60">
            <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5 text-amber-400" />
              <span>Insert Authentic Ge&apos;ez Fidel Punctuation Pauses</span>
            </span>
            <button
              onClick={() => setActiveMenu('none')}
              className="text-zinc-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {AMHARIC_PUNCTUATION_MARKS.map((mark) => (
              <button
                key={mark.symbol}
                onClick={() => insertPunctuation(mark.symbol)}
                title={`${mark.name} (${mark.pauseMs}ms prosodic pause)`}
                className="group flex items-center gap-2 rounded-xl bg-[#061136] border border-blue-900 hover:border-amber-400 hover:bg-amber-500/10 px-3 py-1.5 text-xs text-zinc-200 transition-all cursor-pointer"
              >
                <span className="font-bold text-lg font-ethiopic leading-none text-amber-400">
                  {mark.symbol}
                </span>
                <span className="font-medium text-zinc-200">{mark.name}</span>
                <span className="text-[10px] text-cyan-400 font-mono group-hover:text-amber-300">
                  +{mark.pauseMs}ms
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeMenu === 'presets' && (
        <div className="rounded-xl border border-blue-500/40 bg-[#030820] p-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-blue-900/60">
            <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-amber-400" />
              <span>Select Ready-to-Read Amharic Sample Text</span>
            </span>
            <button
              onClick={() => setActiveMenu('none')}
              className="text-zinc-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {AMHARIC_SAMPLE_TEXTS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => {
                  onChangeText(sample.text);
                  setActiveMenu('none');
                }}
                className="flex flex-col text-left rounded-xl border border-blue-900/80 bg-[#061136] p-2.5 hover:border-amber-400/80 hover:bg-[#0a1b55] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                  <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />
                  <span>{sample.title}</span>
                </div>
                <span className="font-ethiopic text-[11px] text-zinc-300 mt-1 line-clamp-2">
                  {sample.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Amharic Ge'ez Textarea Input Box */}
      <div className="relative rounded-2xl border-2 border-[#0099ff]/60 bg-[#020516]/95 p-3.5 sm:p-5 shadow-inner transition-all focus-within:border-cyan-400 focus-within:shadow-[0_0_20px_rgba(0,240,255,0.25)]">
        <div className="absolute top-4 left-4 pointer-events-none flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.4)]">
          <Edit3 className="h-4 w-4" />
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="ጽሑፍዎን እዚህ ያስገቡ (ለምሳሌ፦ 'ሰላም ለኢትዮጵያ!')..."
          rows={6}
          className="font-ethiopic w-full resize-y bg-transparent pl-11 pr-2 pt-1 text-base sm:text-lg leading-relaxed text-[#f0f9ff] placeholder-cyan-900/60 focus:outline-none selection:bg-cyan-500/30 selection:text-cyan-100"
        />
      </div>

      {/* Horizontal Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-900/60 bg-[#02071d]/90 px-4 py-2.5 text-xs text-zinc-300 shadow-inner">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-medium">
          <span className="flex items-center gap-1.5">
            <span>Words:</span>
            <strong className="text-white font-mono">{wordCount}</strong>
          </span>
          <span className="text-blue-800">|</span>
          <span className="flex items-center gap-1.5">
            <span>Characters:</span>
            <strong className="text-white font-mono">{charCount}</strong>
          </span>
          <span className="text-blue-800">|</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Chunks:</span>
            <strong className="text-amber-400 font-mono">{estimatedChunks}</strong>
          </span>
          <span className="hidden md:inline text-blue-800">|</span>
          <span className="hidden md:flex items-center gap-1.5">
            <span>Active:</span>
            <strong className="text-amber-300">{selectedVoice.name}</strong>
            <span className="text-cyan-300">({currentEmotionObj.name.split('/')[0]})</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-200">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>Duration:</span>
            <strong className="font-mono font-bold text-amber-300">
              {estimatedMinutes} min ({Math.ceil(estimatedSeconds)}s)
            </strong>
          </div>
          <span className="flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
            <Zap className="h-3 w-3 fill-emerald-300" />
            <span>100% Free</span>
          </span>
        </div>
      </div>
    </div>
  );
};
