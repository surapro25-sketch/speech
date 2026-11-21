import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  Scissors,
  Trash2,
  Upload,
  Sliders,
  Music,
  Mic,
  Waves,
  Wand2,
  RotateCcw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { TimelineTrack, TimelineClip, AudioFilterSettings } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface DAWTimelineProps {
  tracks: TimelineTrack[];
  setTracks: React.Dispatch<React.SetStateAction<TimelineTrack[]>>;
  onOpenExportModal: () => void;
}

export const DAWTimeline: React.FC<DAWTimelineProps> = ({
  tracks,
  setTracks,
  onOpenExportModal,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadTime, setPlayheadTime] = useState(0); // in seconds
  const [timelineZoom, setTimelineZoom] = useState(60); // pixels per second
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'timeline' | 'fx'>('timeline');
  const [fxSettings, setFxSettings] = useState<AudioFilterSettings>({
    preset: 'clean',
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,
    reverbWet: 0.15,
    roomSize: 0.5,
    noiseReduction: 0.2,
    compression: 0.4,
  });

  const masterVolume = 1.0;
  const playbackRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeUploadTrackIdRef = useRef<string | null>(null);

  let maxDuration = 30;
  tracks.forEach((t) => {
    t.clips.forEach((c) => {
      if (c.startTime + c.duration > maxDuration) {
        maxDuration = c.startTime + c.duration + 5;
      }
    });
  });

  useEffect(() => {
    if (!isPlaying) {
      if (playbackRef.current) cancelAnimationFrame(playbackRef.current);
      stopAllAudioNodes();
      return;
    }

    const ctx = audioEngine.getContext();
    startTimeRef.current = ctx.currentTime - playheadTime;
    startScheduledPlayback(playheadTime);

    const tick = () => {
      const current = ctx.currentTime - startTimeRef.current;
      if (current >= maxDuration) {
        setIsPlaying(false);
        setPlayheadTime(0);
        return;
      }
      setPlayheadTime(current);
      playbackRef.current = requestAnimationFrame(tick);
    };

    playbackRef.current = requestAnimationFrame(tick);
    return () => {
      if (playbackRef.current) cancelAnimationFrame(playbackRef.current);
      stopAllAudioNodes();
    };
  }, [isPlaying]);

  const startScheduledPlayback = async (offsetTime: number) => {
    stopAllAudioNodes();
    const ctx = audioEngine.getContext();
    const sources: AudioBufferSourceNode[] = [];
    const hasSolo = tracks.some((t) => t.solo);

    for (const track of tracks) {
      if (track.muted || (hasSolo && !track.solo)) continue;
      const trackGain = ctx.createGain();
      trackGain.gain.value = track.volume * masterVolume;

      audioEngine.applyEffectChain(
        ctx,
        trackGain,
        ctx.destination,
        fxSettings.preset,
        fxSettings.eqLow,
        fxSettings.eqMid,
        fxSettings.eqHigh,
        fxSettings.reverbWet
      );

      for (const clip of track.clips) {
        let buffer = clip.audioBuffer;
        if (!buffer && clip.audioBase64) {
          try {
            buffer = await audioEngine.decodeBase64Audio(clip.audioBase64);
            clip.audioBuffer = buffer;
          } catch {
            continue;
          }
        }
        if (!buffer) continue;
        const clipStart = clip.startTime;
        const clipEnd = clip.startTime + clip.duration;

        if (offsetTime < clipEnd) {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          const clipGain = ctx.createGain();
          clipGain.gain.value = clip.volume;
          source.connect(clipGain);
          clipGain.connect(trackGain);

          if (offsetTime >= clipStart) {
            const bufferOffset = offsetTime - clipStart;
            source.start(0, bufferOffset);
          } else {
            const when = ctx.currentTime + (clipStart - offsetTime);
            source.start(when, 0);
          }
          sources.push(source);
        }
      }
    }
    activeSourcesRef.current = sources;
  };

  const stopAllAudioNodes = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    });
    activeSourcesRef.current = [];
  };

  const togglePlay = () => {
    audioEngine.getContext();
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setPlayheadTime(0);
  };

  const handleAddEthiopianBGM = async () => {
    try {
      const buffer = await audioEngine.createEthiopianTraditionalBGM(25);
      const wavBlob = audioEngine.audioBufferToWav(buffer);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        const peaks = audioEngine.extractWaveformData(buffer);
        const newClip: TimelineClip = {
          id: `clip-bgm-${Date.now()}`,
          trackId: 'track-bgm',
          title: 'Ethiopian Krar & Kebero Loop',
          startTime: 0,
          duration: buffer.duration,
          audioBase64: base64,
          audioBuffer: buffer,
          volume: 0.65,
          pan: 0,
          muted: false,
          color: '#10b981',
          waveformData: peaks,
        };
        setTracks((prev) =>
          prev.map((t) => (t.id === 'track-bgm' ? { ...t, clips: [...t.clips, newClip] } : t))
        );
      };
      reader.readAsDataURL(wavBlob);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSFX = async (type: 'cafe' | 'chimes' | 'applause' | 'rain') => {
    try {
      const buffer = await audioEngine.createProceduralSFX(type, 12);
      const wavBlob = audioEngine.audioBufferToWav(buffer);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        const peaks = audioEngine.extractWaveformData(buffer);
        const newClip: TimelineClip = {
          id: `clip-sfx-${Date.now()}`,
          trackId: 'track-sfx',
          title: `SFX: ${type.toUpperCase()}`,
          startTime: playheadTime,
          duration: buffer.duration,
          audioBase64: base64,
          audioBuffer: buffer,
          volume: 0.7,
          pan: 0,
          muted: false,
          color: '#06b6d4',
          waveformData: peaks,
        };
        setTracks((prev) =>
          prev.map((t) => (t.id === 'track-sfx' ? { ...t, clips: [...t.clips, newClip] } : t))
        );
      };
      reader.readAsDataURL(wavBlob);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileImport = (trackId: string) => {
    activeUploadTrackIdRef.current = trackId;
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadTrackIdRef.current) return;
    try {
      const arrayBuf = await file.arrayBuffer();
      const ctx = audioEngine.getContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuf);
      const peaks = audioEngine.extractWaveformData(audioBuffer);
      const wavBlob = audioEngine.audioBufferToWav(audioBuffer);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        const newClip: TimelineClip = {
          id: `clip-imported-${Date.now()}`,
          trackId: activeUploadTrackIdRef.current!,
          title: file.name,
          startTime: playheadTime,
          duration: audioBuffer.duration,
          audioBase64: base64,
          audioBuffer: audioBuffer,
          volume: 1.0,
          pan: 0,
          muted: false,
          color: '#a855f7',
          waveformData: peaks,
        };
        setTracks((prev) =>
          prev.map((t) =>
            t.id === activeUploadTrackIdRef.current ? { ...t, clips: [...t.clips, newClip] } : t
          )
        );
      };
      reader.readAsDataURL(wavBlob);
    } catch (err) {
      console.error('File import error:', err);
    }
    e.target.value = '';
  };

  const handleSplitClip = () => {
    if (!selectedClipId) return;
    setTracks((prev) =>
      prev.map((track) => {
        const clipIdx = track.clips.findIndex((c) => c.id === selectedClipId);
        if (clipIdx === -1) return track;
        const clip = track.clips[clipIdx];
        const splitPoint = playheadTime - clip.startTime;
        if (splitPoint <= 0.2 || splitPoint >= clip.duration - 0.2) {
          return track;
        }
        const firstDuration = splitPoint;
        const secondDuration = clip.duration - splitPoint;
        const clip1: TimelineClip = { ...clip, duration: firstDuration };
        const clip2: TimelineClip = {
          ...clip,
          id: `clip-split-${Date.now()}`,
          startTime: playheadTime,
          duration: secondDuration,
        };
        const newClips = [...track.clips];
        newClips.splice(clipIdx, 1, clip1, clip2);
        return { ...track, clips: newClips };
      })
    );
  };

  const handleDeleteClip = () => {
    if (!selectedClipId) return;
    setTracks((prev) =>
      prev.map((track) => ({
        ...track,
        clips: track.clips.filter((c) => c.id !== selectedClipId),
      }))
    );
    setSelectedClipId(null);
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={onFileInputChange}
        className="hidden"
      />

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3.5 sm:p-4 backdrop-blur-md flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={togglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            {isPlaying ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </button>
          <button
            onClick={handleStop}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <div className="bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 font-mono text-sm">
            <span className="text-amber-400 font-bold">
              {Math.floor(playheadTime / 60).toString().padStart(2, '0')}:
              {Math.floor(playheadTime % 60).toString().padStart(2, '0')}.
              {Math.floor((playheadTime % 1) * 100).toString().padStart(2, '0')}
            </span>
            <span className="text-zinc-600 text-xs ml-1">/ {Math.ceil(maxDuration)}s</span>
          </div>

          <div className="h-5 w-px bg-zinc-800 mx-1 hidden sm:block" />

          <button
            onClick={handleSplitClip}
            disabled={!selectedClipId}
            title="Split Clip at Playhead"
            className="flex items-center gap-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 px-3 py-2 text-xs font-medium transition-colors cursor-pointer"
          >
            <Scissors className="h-3.5 w-3.5 text-amber-400" />
            <span>Split Clip</span>
          </button>
          <button
            onClick={handleDeleteClip}
            disabled={!selectedClipId}
            title="Delete Selected Clip"
            className="flex items-center gap-1.5 rounded-xl bg-zinc-800 hover:bg-rose-900/40 hover:text-rose-300 disabled:opacity-40 text-zinc-300 px-3 py-2 text-xs font-medium transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setTimelineZoom((z) => Math.max(25, z - 15))}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] text-zinc-400 font-mono px-1">{timelineZoom}px/s</span>
            <button
              onClick={() => setTimelineZoom((z) => Math.min(150, z + 15))}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-amber-500 text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('fx')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'fx'
                  ? 'bg-amber-500 text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              FX & Filters
            </button>
          </div>

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3.5 py-2 text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <span>Master Mix</span>
          </button>
        </div>
      </div>

      {activeTab === 'fx' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Vocal & Master Effect Processing Rack
              </h3>
            </div>
            <span className="text-xs text-zinc-400">Web Audio Studio Nodes (44.1 kHz)</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-2 block">
              Voice Changer Filter Preset:
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
              {[
                { id: 'clean', label: 'Studio Clean' },
                { id: 'radio', label: 'Vintage Radio' },
                { id: 'megaphone', label: 'Megaphone' },
                { id: 'telephone', label: 'Phone' },
                { id: 'church', label: 'Reverb Hall' },
                { id: 'mechanical', label: 'Robot' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setFxSettings((f) => ({ ...f, preset: preset.id as any }))}
                  className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                    fxSettings.preset === preset.id
                      ? 'border-amber-500 bg-amber-500/15 text-white font-semibold'
                      : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-xs font-semibold">{preset.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-3">
            <div className="space-y-1.5 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">Bass (Low 320Hz)</span>
                <span className="text-amber-400 font-mono">{fxSettings.eqLow} dB</span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                value={fxSettings.eqLow}
                onChange={(e) => setFxSettings((f) => ({ ...f, eqLow: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">Body (Mid 1.8kHz)</span>
                <span className="text-amber-400 font-mono">{fxSettings.eqMid} dB</span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                value={fxSettings.eqMid}
                onChange={(e) => setFxSettings((f) => ({ ...f, eqMid: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">Air (High 4.5kHz)</span>
                <span className="text-amber-400 font-mono">{fxSettings.eqHigh} dB</span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                value={fxSettings.eqHigh}
                onChange={(e) => setFxSettings((f) => ({ ...f, eqHigh: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">Reverb Wet Mix</span>
                <span className="text-amber-400 font-mono">{Math.round(fxSettings.reverbWet * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={fxSettings.reverbWet}
                onChange={(e) => setFxSettings((f) => ({ ...f, reverbWet: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
          <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 bg-zinc-900/60 p-2.5 px-4 text-xs">
            <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
              <span>Multi-Track Workspace</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAddEthiopianBGM}
                className="flex items-center gap-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-emerald-400 transition-colors cursor-pointer"
              >
                <Music className="h-3.5 w-3.5" />
                <span>+ Ethiopian BGM Loop</span>
              </button>
              <div className="flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800">
                <span className="text-[11px] text-zinc-400">Add SFX:</span>
                {(['cafe', 'chimes', 'applause', 'rain'] as const).map((sfx) => (
                  <button
                    key={sfx}
                    onClick={() => handleAddSFX(sfx)}
                    className="px-1.5 py-0.5 text-[10px] text-zinc-300 hover:text-amber-300 capitalize hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                  >
                    {sfx}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-zinc-850">
            {tracks.map((track) => (
              <div key={track.id} className="flex min-h-[96px] bg-zinc-950/80 hover:bg-zinc-900/40 transition-colors">
                <div className="w-56 shrink-0 border-r border-zinc-800 p-2.5 flex flex-col justify-between bg-zinc-900/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {track.type === 'voice' && <Mic className="h-3.5 w-3.5 text-amber-400" />}
                        {track.type === 'music' && <Music className="h-3.5 w-3.5 text-emerald-400" />}
                        {track.type === 'sfx' && <Waves className="h-3.5 w-3.5 text-cyan-400" />}
                        {track.type === 'aux' && <Sliders className="h-3.5 w-3.5 text-purple-400" />}
                        <span className="text-xs font-bold text-zinc-200">{track.name}</span>
                      </div>
                      <span className="font-ethiopic text-[10px] text-zinc-400">{track.amharicName}</span>
                    </div>
                    <button
                      onClick={() => handleFileImport(track.id)}
                      title="Import audio file to this track"
                      className="p-1 rounded text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="range"
                        min="0"
                        max="1.5"
                        step="0.05"
                        value={track.volume}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setTracks((prev) =>
                            prev.map((t) => (t.id === track.id ? { ...t, volume: val } : t))
                          );
                        }}
                        className="w-full h-1.5 accent-amber-500"
                      />
                      <span className="text-[10px] font-mono text-zinc-400 w-8 text-right">
                        {Math.round(track.volume * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setTracks((prev) =>
                              prev.map((t) => (t.id === track.id ? { ...t, muted: !t.muted } : t))
                            );
                          }}
                          className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                            track.muted
                              ? 'bg-rose-500 text-white'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          M
                        </button>
                        <button
                          onClick={() => {
                            setTracks((prev) =>
                              prev.map((t) => (t.id === track.id ? { ...t, solo: !t.solo } : t))
                            );
                          }}
                          className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                            track.solo
                              ? 'bg-amber-500 text-zinc-950'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          S
                        </button>
                      </div>
                      <span className="text-zinc-500 text-[10px]">
                        {track.clips.length} clip{track.clips.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="relative flex-1 overflow-x-auto min-h-[96px] bg-zinc-950 p-1"
                  style={{ minWidth: `${Math.ceil(maxDuration) * timelineZoom}px` }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const newTime = Math.max(0, clickX / timelineZoom);
                    setPlayheadTime(newTime);
                  }}
                >
                  {Array.from({ length: Math.ceil(maxDuration / 5) }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-l border-zinc-900 pointer-events-none text-[9px] font-mono text-zinc-700 pl-1"
                      style={{ left: `${i * 5 * timelineZoom}px` }}
                    >
                      {i * 5}s
                    </div>
                  ))}

                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20 pointer-events-none shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                    style={{ left: `${playheadTime * timelineZoom}px` }}
                  >
                    <div className="h-3 w-3 -ml-[5px] bg-amber-400 rotate-45" />
                  </div>

                  {track.clips.map((clip) => {
                    const isSelected = selectedClipId === clip.id;
                    const left = clip.startTime * timelineZoom;
                    const width = Math.max(30, clip.duration * timelineZoom);
                    return (
                      <div
                        key={clip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClipId(clip.id);
                        }}
                        style={{
                          left: `${left}px`,
                          width: `${width}px`,
                          borderColor: isSelected ? '#f59e0b' : clip.color,
                        }}
                        className={`absolute top-2 bottom-2 rounded-lg border-2 p-1.5 flex flex-col justify-between cursor-pointer select-none transition-all shadow-sm ${
                          isSelected
                            ? 'bg-amber-500/25 ring-2 ring-amber-400/50 z-10'
                            : 'bg-zinc-900/90 hover:brightness-110'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] truncate">
                          <span className="font-semibold text-white truncate drop-shadow">
                            {clip.title}
                          </span>
                          <span className="font-mono text-[9px] text-zinc-300 ml-1">
                            {clip.duration.toFixed(1)}s
                          </span>
                        </div>
                        <div className="h-6 flex items-end gap-0.5 overflow-hidden opacity-85">
                          {(clip.waveformData || [0.4, 0.7, 0.9, 0.3, 0.5, 0.8, 0.2, 0.6]).map(
                            (peak, idx) => (
                              <div
                                key={idx}
                                className="w-1 rounded-t"
                                style={{
                                  height: `${Math.max(15, peak * 100)}%`,
                                  backgroundColor: clip.color,
                                }}
                              />
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
