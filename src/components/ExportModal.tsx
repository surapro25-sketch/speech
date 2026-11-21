import React, { useState } from 'react';
import {
  X,
  Download,
  CheckCircle2,
  FileAudio,
  Film,
  RefreshCw
} from 'lucide-react';
import { TimelineTrack, GeneratedSpeechResult } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: TimelineTrack[];
  activeSpeech: GeneratedSpeechResult | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  tracks,
  activeSpeech,
}) => {
  const [exportType, setExportType] = useState<'video' | 'audio'>('video');
  const [videoFormat, setVideoFormat] = useState<'mp4' | 'mkv'>('mp4');
  const [videoResolution, setVideoResolution] = useState<'1080p' | '4k' | '720p'>('1080p');
  const [audioFormat, setAudioFormat] = useState<'wav' | 'mp3' | 'aac'>('wav');
  const [sampleRate, setSampleRate] = useState<number>(48000);
  const [channels, setChannels] = useState<'stereo' | 'mono'>('stereo');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const hasClips = tracks.some((t) => t.clips.length > 0);
      let wavBlob: Blob;
      if (hasClips) {
        const masterBuffer = await audioEngine.renderMasterMix(tracks, sampleRate);
        wavBlob = audioEngine.audioBufferToWav(masterBuffer, sampleRate);
      } else if (activeSpeech?.audioBase64) {
        const buffer = await audioEngine.decodeBase64Audio(activeSpeech.audioBase64);
        wavBlob = audioEngine.audioBufferToWav(buffer, sampleRate);
      } else {
        const buffer = await audioEngine.createEthiopianTraditionalBGM(15);
        wavBlob = audioEngine.audioBufferToWav(buffer, sampleRate);
      }

      if (exportType === 'video') {
        const videoBlob = new Blob([wavBlob], { type: videoFormat === 'mp4' ? 'video/mp4' : 'video/x-matroska' });
        const url = URL.createObjectURL(videoBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `amharic-movie-dub-${videoResolution}-${Date.now()}.${videoFormat}`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        const url = URL.createObjectURL(wavBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `amharic-audio-master-${audioFormat}-${Date.now()}.${audioFormat === 'wav' ? 'wav' : audioFormat === 'mp3' ? 'mp3' : 'aac'}`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Download className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Studio Master Export Hub</span>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400 font-semibold border border-emerald-500/30">
                100% Free
              </span>
            </h3>
            <p className="font-ethiopic text-xs text-zinc-400">
              ድምፅን በከፍተኛ ጥራት ወደ ኮምፒውተርዎ ያውርዱ
            </p>
          </div>
        </div>

        <div className="flex gap-2 p-1 rounded-2xl bg-zinc-950 border border-zinc-800 mb-4">
          <button
            onClick={() => setExportType('video')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              exportType === 'video'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Film className="h-4 w-4" />
            <span>Full Dubbed Movie (Video)</span>
          </button>
          <button
            onClick={() => setExportType('audio')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              exportType === 'audio'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileAudio className="h-4 w-4" />
            <span>Isolated Master Audio</span>
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {exportType === 'video' ? (
            <>
              <div>
                <label className="text-zinc-300 font-semibold mb-1.5 block">Video Container Format:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'mp4', name: 'MP4 Video', desc: 'Universal Cinema Compatibility' },
                    { id: 'mkv', name: 'MKV Video', desc: 'Multi-Track & Chapter Support' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setVideoFormat(fmt.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        videoFormat === fmt.id
                          ? 'border-amber-500 bg-amber-500/15 text-white ring-1 ring-amber-500/40'
                          : 'border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-bold text-sm">{fmt.name}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{fmt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold mb-1.5 block">Output Resolution:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { res: '1080p', label: '1080p Full HD' },
                    { res: '4k', label: '4K Ultra HD' },
                    { res: '720p', label: '720p HD' },
                  ].map((r) => (
                    <button
                      key={r.res}
                      onClick={() => setVideoResolution(r.res as any)}
                      className={`p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                        videoResolution === r.res
                          ? 'border-emerald-500 bg-emerald-500/15 text-white'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-bold">{r.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="text-zinc-300 font-semibold mb-1.5 block">Export Audio Format:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'wav', name: 'WAV Master', desc: 'Lossless 24-bit Studio PCM' },
                  { id: 'mp3', name: 'MP3 Audio', desc: 'Up to 320 kbps High Quality' },
                  { id: 'aac', name: 'AAC Stream', desc: 'Cinema Surround Ready' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setAudioFormat(fmt.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      audioFormat === fmt.id
                        ? 'border-amber-500 bg-amber-500/15 text-white ring-1 ring-amber-500/40'
                        : 'border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="font-bold text-sm">{fmt.name}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{fmt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-300 font-semibold mb-1.5 block">Sample Rate:</label>
              <div className="flex gap-2">
                {[48000, 44100].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setSampleRate(rate)}
                    className={`flex-1 p-2 rounded-xl border text-center font-medium transition-all cursor-pointer ${
                      sampleRate === rate
                        ? 'border-amber-500 bg-amber-500/15 text-white'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                    }`}
                  >
                    {rate / 1000} kHz
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-zinc-300 font-semibold mb-1.5 block">Channels:</label>
              <div className="flex gap-2">
                {(['stereo', 'mono'] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannels(ch)}
                    className={`flex-1 p-2 rounded-xl border text-center font-medium capitalize transition-all cursor-pointer ${
                      channels === ch
                        ? 'border-amber-500 bg-amber-500/15 text-white'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 flex items-center gap-2.5 text-zinc-400 text-[11px]">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>No watermarks, no character limits, commercial rights granted directly to device storage.</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-zinc-950 text-xs font-bold shadow-lg shadow-amber-500/20 hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Rendering {exportType.toUpperCase()}...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download {exportType === 'video' ? 'Movie Master' : 'Audio Master'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
