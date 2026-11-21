import { useState } from 'react';
import { Header, TabType } from './components/Header';
import { TTSStudio } from './components/TTSStudio';
import { DAWTimeline } from './components/DAWTimeline';
import { VoiceCloningStudio } from './components/VoiceCloningStudio';
import { DubbingStudio } from './components/DubbingStudio';
import { SubtitleStudio } from './components/SubtitleStudio';
import { ExportModal } from './components/ExportModal';
import { EthiopianDecorations } from './components/EthiopianDecorations';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HistoryProvider } from './context/HistoryContext';
import { AuthModal } from './components/AuthModal';
import { AuthGate } from './components/AuthGate';
import { HistoryModal } from './components/HistoryModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import {
  TimelineTrack,
  TimelineClip,
  GeneratedSpeechResult,
  VoicePersona
} from './types';
import { VOICE_PERSONAS } from './data/voices';
import { Volume2, ShieldCheck, Zap } from 'lucide-react';

function StudioContent() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('tts');
  const [activeGeneratedSpeech, setActiveGeneratedSpeech] = useState<GeneratedSpeechResult | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [tracks, setTracks] = useState<TimelineTrack[]>([
    {
      id: 'track-voice',
      name: 'Amharic Voice Track',
      amharicName: 'የድምፅ መስመር',
      type: 'voice',
      volume: 1.0,
      pan: 0,
      muted: false,
      solo: false,
      clips: [],
    },
    {
      id: 'track-bgm',
      name: 'Background Music (BGM)',
      amharicName: 'የሙዚቃ መስመር',
      type: 'music',
      volume: 0.6,
      pan: 0,
      muted: false,
      solo: false,
      clips: [],
    },
    {
      id: 'track-sfx',
      name: 'Atmospheric SFX Track',
      amharicName: 'የድምፅ ውጤት',
      type: 'sfx',
      volume: 0.7,
      pan: 0,
      muted: false,
      solo: false,
      clips: [],
    },
    {
      id: 'track-aux',
      name: 'Aux / Dubbing Track',
      amharicName: 'የትርጉም መስመር',
      type: 'aux',
      volume: 1.0,
      pan: 0,
      muted: false,
      solo: false,
      clips: [],
    },
  ]);

  const handleSendToDAW = (clipData: Partial<TimelineClip>, trackType: 'voice' | 'aux' = 'voice') => {
    const targetTrackId = trackType === 'voice' ? 'track-voice' : 'track-aux';
    const targetTrack = tracks.find((t) => t.id === targetTrackId);
    let nextStartTime = 0;
    if (targetTrack && targetTrack.clips.length > 0) {
      const lastClip = targetTrack.clips[targetTrack.clips.length - 1];
      nextStartTime = lastClip.startTime + lastClip.duration + 0.5;
    }

    const newClip: TimelineClip = {
      id: `clip-${Date.now()}`,
      trackId: targetTrackId,
      title: clipData.title || 'Amharic Speech Master',
      startTime: nextStartTime,
      duration: clipData.duration || 3.0,
      audioBase64: clipData.audioBase64 || '',
      volume: 1.0,
      pan: 0,
      muted: false,
      color: clipData.color || '#f59e0b',
      waveformData: [0.3, 0.6, 0.9, 0.4, 0.7, 0.85, 0.3, 0.6, 0.75, 0.5],
    };

    setTracks((prev) =>
      prev.map((t) => (t.id === targetTrackId ? { ...t, clips: [...t.clips, newClip] } : t))
    );
    setCurrentTab('daw');
  };

  const handleAddClonedVoice = (newPersona: VoicePersona) => {
    VOICE_PERSONAS.unshift(newPersona);
    setCurrentTab('tts');
  };

  const hasAudioContent =
    activeGeneratedSpeech !== null || tracks.some((t) => t.clips.length > 0);

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200 overflow-x-hidden bg-[#020514]">
      <EthiopianDecorations />

      <div className="relative z-30">
        <Header
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          hasAudioContent={hasAudioContent}
        />
      </div>

      <main className="relative z-20 flex-1 mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-8">
        {!isAuthenticated ? (
          <AuthGate />
        ) : (
          <>
            {currentTab === 'tts' && (
              <TTSStudio
                onSendToDAW={handleSendToDAW}
                onOpenExportModal={() => setIsExportModalOpen(true)}
                activeGeneratedSpeech={activeGeneratedSpeech}
                setActiveGeneratedSpeech={setActiveGeneratedSpeech}
              />
            )}
            {currentTab === 'daw' && (
              <DAWTimeline
                tracks={tracks}
                setTracks={setTracks}
                onOpenExportModal={() => setIsExportModalOpen(true)}
              />
            )}
            {currentTab === 'clone' && (
              <VoiceCloningStudio onAddClonedVoice={handleAddClonedVoice} />
            )}
            {currentTab === 'dubbing' && (
              <DubbingStudio onSendToDAW={handleSendToDAW} />
            )}
            {currentTab === 'subtitles' && (
              <SubtitleStudio activeSpeech={activeGeneratedSpeech} />
            )}
          </>
        )}
      </main>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tracks={tracks}
        activeSpeech={activeGeneratedSpeech}
      />

      <AuthModal />

      <HistoryModal
        onSendToDAW={handleSendToDAW}
        onSwitchTab={setCurrentTab}
      />

      {/* Administrator Control Panel Modal (ONLY rendered for verified Admin role) */}
      {isAdmin && <AdminDashboardModal />}

      <footer className="relative z-20 border-t border-blue-900/50 bg-[#020516]/90 py-5 mt-10 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-amber-400" />
            <span className="font-bold text-white">Amharic AI Voice &amp; Speech Studio</span>
            <span className="text-zinc-600">•</span>
            <span className="font-ethiopic text-amber-300 font-semibold">የአማርኛ ስቱዲዮ</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              100% Free • Commercial Use Permitted
            </span>
            <span className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Zap className="h-4 w-4 fill-amber-400" />
              30-Min Continuous Master
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HistoryProvider>
        <StudioContent />
      </HistoryProvider>
    </AuthProvider>
  );
}
