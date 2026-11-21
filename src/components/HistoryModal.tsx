import React, { useState, useRef } from 'react';
import {
  X,
  History,
  Play,
  Square,
  Download,
  Trash2,
  Search,
  Sliders,
  Send,
  Sparkles,
  Clock,
  Volume2,
  Dna,
  Languages,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { useHistory } from '../context/HistoryContext';
import { useAuth } from '../context/AuthContext';
import { UserActionHistoryItem, HistoryActionType, TimelineClip } from '../types';

interface HistoryModalProps {
  onSendToDAW?: (clip: Partial<TimelineClip>, trackType?: 'voice' | 'aux') => void;
  onSwitchTab?: (tab: 'tts' | 'daw' | 'clone' | 'dubbing') => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ onSendToDAW, onSwitchTab }) => {
  const { isHistoryModalOpen, setIsHistoryModalOpen, historyItems, deleteHistoryItem, clearAllHistory, loadScriptToEditor } = useHistory();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'all' | HistoryActionType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!isHistoryModalOpen) return null;

  const filteredItems = historyItems.filter((item) => {
    const matchesFilter = activeFilter === 'all' || item.type === activeFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.fullText && item.fullText.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.voiceName && item.voiceName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const totalGenerations = historyItems.length;
  const totalAudioDuration = historyItems.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const ttsCount = historyItems.filter((h) => h.type === 'tts').length;

  const handlePlayToggle = (item: UserActionHistoryItem) => {
    if (!item.audioBase64) return;
    if (playingItemId === item.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingItemId(null);
      setPlaybackProgress(0);
    } else {
      if (audioRef.current) {
        audioRef.current.src = item.audioBase64.startsWith('data:')
          ? item.audioBase64
          : `data:audio/wav;base64,${item.audioBase64}`;
        audioRef.current.currentTime = 0;
        audioRef.current.play().then(() => {
          setPlayingItemId(item.id);
        }).catch((e) => console.error('Audio playback error', e));
      }
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      setPlaybackProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleAudioEnded = () => {
    setPlayingItemId(null);
    setPlaybackProgress(0);
  };

  const handleDownloadWav = (item: UserActionHistoryItem) => {
    if (!item.audioBase64) return;
    const link = document.createElement('a');
    link.href = item.audioBase64.startsWith('data:')
      ? item.audioBase64
      : `data:audio/wav;base64,${item.audioBase64}`;
    link.download = `amharic-history-${item.type}-${Date.now()}.wav`;
    link.click();
  };

  const handleSendItemToDAW = (item: UserActionHistoryItem) => {
    if (!item.audioBase64 || !onSendToDAW) return;
    onSendToDAW(
      {
        title: `${item.voiceName || 'Amharic'} - ${item.title} (${(item.duration || 3).toFixed(1)}s)`,
        audioBase64: item.audioBase64,
        duration: item.duration || 3.0,
        color: item.type === 'tts' ? '#f59e0b' : item.type === 'dubbing' ? '#38bdf8' : '#a855f7',
      },
      item.type === 'dubbing' ? 'aux' : 'voice'
    );
    setIsHistoryModalOpen(false);
  };

  const handleLoadScript = (item: UserActionHistoryItem) => {
    const textToLoad = item.fullText || item.description;
    if (textToLoad) {
      loadScriptToEditor(textToLoad, item.voiceId);
      if (onSwitchTab) onSwitchTab('tts');
      setIsHistoryModalOpen(false);
    }
  };

  const handleCopyText = (item: UserActionHistoryItem) => {
    const textToCopy = item.fullText || item.description;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getTypeBadge = (type: HistoryActionType) => {
    switch (type) {
      case 'tts':
        return (
          <span className="flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 px-2.5 py-0.5 text-[10px] font-bold">
            <Volume2 className="h-3 w-3" />
            <span>Speech (TTS)</span>
          </span>
        );
      case 'clone':
        return (
          <span className="flex items-center gap-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 px-2.5 py-0.5 text-[10px] font-bold">
            <Dna className="h-3 w-3" />
            <span>Voice Clone</span>
          </span>
        );
      case 'dubbing':
        return (
          <span className="flex items-center gap-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 px-2.5 py-0.5 text-[10px] font-bold">
            <Languages className="h-3 w-3" />
            <span>Dubbing</span>
          </span>
        );
      case 'daw':
        return (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
            <Sliders className="h-3 w-3" />
            <span>DAW Master</span>
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-blue-500/20 text-cyan-300 px-2 py-0.5 text-[10px] font-bold">
            Action
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <audio
        ref={audioRef}
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={handleAudioEnded}
        className="hidden"
      />
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-3xl border-2 border-cyan-500/40 bg-[#030822] shadow-[0_0_60px_rgba(0,180,255,0.25)] text-zinc-100 overflow-hidden">
        <div className="flex items-center justify-between border-b border-blue-900/60 p-4 sm:p-6 bg-[#040c2e]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 font-bold shadow-lg shadow-amber-500/30">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Account Action History</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/40">
                  {historyItems.length} actions
                </span>
              </h2>
              <p className="text-xs text-cyan-300/80 font-ethiopic font-medium">
                የተከናወኑ ተግባራት ታሪክ ({user?.name || user?.username})
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsHistoryModalOpen(false)}
            className="rounded-xl p-2 text-zinc-400 hover:text-white hover:bg-blue-900/50 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 p-4 bg-[#05113b]/60 border-b border-blue-900/50 text-xs">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#061445] border border-blue-900/60">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-400">Total Generations</p>
              <p className="font-extrabold text-sm text-white font-mono">{totalGenerations}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#061445] border border-blue-900/60">
            <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-400">Total Audio Time</p>
              <p className="font-extrabold text-sm text-cyan-300 font-mono">
                {totalAudioDuration > 60
                  ? `${(totalAudioDuration / 60).toFixed(1)} mins`
                  : `${totalAudioDuration.toFixed(1)} secs`}
              </p>
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-start gap-2.5 p-2.5 rounded-xl bg-[#061445] border border-blue-900/60">
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-400">TTS Speech Count</p>
              <p className="font-extrabold text-sm text-emerald-300 font-mono">{ttsCount}</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-blue-900/50 flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#040e33]/40">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-cyan-400" />
            <input
              type="text"
              placeholder="Search scripts, voices, actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-blue-900/80 bg-[#061239] pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'tts', label: 'TTS' },
                { id: 'clone', label: 'Clones' },
                { id: 'dubbing', label: 'Dub' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === filter.id
                    ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/30'
                    : 'bg-[#061239] border border-blue-900/60 text-zinc-300 hover:text-white hover:border-cyan-400/50'
                }`}
              >
                {filter.label}
              </button>
            ))}
            {historyItems.length > 0 && (
              <div className="ml-auto">
                {!confirmClear ? (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="p-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Clear All History"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Clear</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={async () => {
                        await clearAllHistory();
                        setConfirmClear(false);
                      }}
                      className="px-2 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px] cursor-pointer"
                    >
                      Confirm Clear
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 divide-y divide-blue-900/30">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-950/80 border border-blue-800/50 text-cyan-400">
                <History className="h-7 w-7 opacity-80" />
              </div>
              <h3 className="text-base font-bold text-white">No Past Actions Found</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto font-ethiopic">
                ምንም የተከናወኑ ተግባራት አልተገኙም።
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isPlayingThis = playingItemId === item.id;
              const hasAudio = !!item.audioBase64;
              return (
                <div
                  key={item.id}
                  className="pt-3.5 first:pt-0 group rounded-2xl border border-blue-900/60 bg-[#050f33]/90 hover:border-cyan-400/50 transition-all p-3.5 sm:p-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2">
                    <div className="flex items-center flex-wrap gap-2">
                      {getTypeBadge(item.type)}
                      <h4 className="text-xs sm:text-sm font-extrabold text-white">
                        {item.title}
                      </h4>
                      {item.voiceName && (
                        <span className="rounded-lg bg-blue-950 px-2 py-0.5 text-[10px] text-cyan-300 font-semibold border border-blue-800/60">
                          {item.voiceName} {item.emotion ? `(${item.emotion})` : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3 text-cyan-400" />
                        {formatDate(item.createdAt)}
                      </span>
                      {item.duration && (
                        <span className="font-mono text-amber-300 font-bold">
                          {item.duration.toFixed(1)}s
                        </span>
                      )}
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        className="opacity-60 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        title="Delete from history"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="my-2.5 rounded-xl bg-[#030a24] p-3 border border-blue-900/50">
                    <p className="text-xs sm:text-sm text-zinc-200 font-ethiopic leading-relaxed line-clamp-3">
                      {item.fullText || item.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
                    {hasAudio ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePlayToggle(item)}
                          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold text-xs transition-all cursor-pointer ${
                            isPlayingThis
                              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                              : 'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 hover:brightness-110 shadow-md shadow-amber-500/20'
                          }`}
                        >
                          {isPlayingThis ? (
                            <>
                              <Square className="h-3.5 w-3.5 fill-current" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 fill-current" />
                              <span>Play Audio</span>
                            </>
                          )}
                        </button>
                        {isPlayingThis && (
                          <div className="flex items-center gap-2 bg-[#02071d] px-3 py-1.5 rounded-xl border border-blue-900/60">
                            <div className="w-24 sm:w-36 h-1.5 bg-blue-950 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-400 to-cyan-400 transition-all duration-100"
                                style={{ width: `${playbackProgress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-cyan-300">Playing</span>
                          </div>
                        )}
                        <button
                          onClick={() => handleDownloadWav(item)}
                          className="flex items-center gap-1 rounded-xl border border-blue-900/80 bg-[#061445] hover:bg-blue-900/50 text-zinc-300 hover:text-white px-2.5 py-1.5 text-xs transition-all cursor-pointer"
                          title="Download Audio WAV"
                        >
                          <Download className="h-3.5 w-3.5 text-amber-400" />
                          <span className="hidden sm:inline">WAV</span>
                        </button>
                        {onSendToDAW && (
                          <button
                            onClick={() => handleSendItemToDAW(item)}
                            className="flex items-center gap-1 rounded-xl border border-blue-900/80 bg-[#061445] hover:bg-blue-900/50 text-cyan-300 px-2.5 py-1.5 text-xs transition-all cursor-pointer"
                            title="Add to multi-track timeline"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Send to DAW</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-zinc-500 italic">No audio clip attached</span>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => handleCopyText(item)}
                        className="rounded-lg bg-blue-950/60 hover:bg-blue-900/60 px-2.5 py-1 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedId === item.id ? 'Copied!' : 'Copy Text'}
                      </button>
                      <button
                        onClick={() => handleLoadScript(item)}
                        className="flex items-center gap-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 px-2.5 py-1 text-[11px] font-bold text-cyan-300 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Use in Editor</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-blue-900/60 p-3 sm:p-4 bg-[#040c2e] flex items-center justify-between text-xs text-zinc-400">
          <span className="font-ethiopic text-amber-300/80">
            የተቀመጡ ድምፆችና ተግባራት
          </span>
          <button
            onClick={() => setIsHistoryModalOpen(false)}
            className="rounded-xl px-4 py-2 bg-gradient-to-r from-blue-700 to-cyan-600 hover:brightness-110 text-white font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
