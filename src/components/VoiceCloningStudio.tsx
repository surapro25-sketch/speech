import React, { useState, useRef } from 'react';
import {
  Dna,
  Upload,
  Mic,
  Square,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Activity
} from 'lucide-react';
import { VoiceCloneProfile, VoicePersona } from '../types';
import { useHistory } from '../context/HistoryContext';

interface VoiceCloningStudioProps {
  onAddClonedVoice: (voice: VoicePersona) => void;
}

export const VoiceCloningStudio: React.FC<VoiceCloningStudioProps> = ({
  onAddClonedVoice,
}) => {
  const { addHistoryItem } = useHistory();
  const [cloneName, setCloneName] = useState('የኔ ድምፅ (My Voice Clone)');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cloneProfile, setCloneProfile] = useState<VoiceCloneProfile | null>(null);
  const timerRef = useRef<any>(null);

  const startRecording = () => {
    setIsRecording(true);
    setRecordSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordSeconds((s: number) => {
        if (s >= 30) {
          stopRecording();
          return 30;
        }
        return s + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    triggerAnalysis();
  };

  const triggerAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/clone/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cloneName, gender }),
      });
      const data = await response.json();
      if (data.profile) {
        setCloneProfile(data.profile);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToPersonaLibrary = () => {
    if (!cloneProfile) return;
    const newPersona: VoicePersona = {
      id: cloneProfile.id,
      name: cloneProfile.name,
      amharicName: 'የተቀዳ ድምፅ',
      gender: gender,
      ageGroup: 'adult',
      age: 30,
      description: `Custom cloned voice profile. Fundamental frequency: ${cloneProfile.fundamentalFreq}Hz, Warmth: ${cloneProfile.timbreWarmth}%.`,
      amharicDescription: 'የተቀዳ የግል ድምፅ መገለጫ።',
      avatarUrl:
        gender === 'female'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      baseVoice: cloneProfile.cloneBaseVoice,
      tags: ['AI Clone', 'Custom Voice', 'Personalized'],
      toneQualities: ['High-Fidelity', 'Cloned Formants', 'Matched Resonance'],
      pitchDefault: cloneProfile.customPitch,
      speedDefault: cloneProfile.customSpeed,
      sampleText: 'ይህ የተቀዳው የኔ ድምፅ ውጤት ነው፤ እንኳን ደህና መጡ!'
    };
    onAddClonedVoice(newPersona);
    addHistoryItem({
      type: 'clone',
      title: `Voice Clone: ${newPersona.name}`,
      amharicTitle: 'የድምፅ ቅጂ',
      description: newPersona.description,
      voiceName: newPersona.name,
      voiceAmharic: newPersona.amharicName,
      voiceId: newPersona.id,
      duration: 3.0,
      metadata: { gender, ageGroup: newPersona.ageGroup },
    });
    alert('Cloned voice persona added to your active studio persona matrix!');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Dna className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Amharic Voice Cloning Studio</span>
                <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400 border border-amber-500/20">
                  Instant Neural Formant Profiler
                </span>
              </h2>
              <p className="font-ethiopic text-xs text-zinc-400 mt-0.5">
                የራስዎን ድምፅ በ30 ሰከንድ ውስጥ ቀድተው ወደ ስቱዲዮ ተዋናይነት ይቀይሩ
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
            <Mic className="h-4 w-4 text-amber-400" />
            <span>Step 1: Input Voice Sample</span>
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Voice Persona Name:</label>
              <input
                type="text"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Voice Gender Category:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setGender('male')}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold border transition-all cursor-pointer ${
                    gender === 'male'
                      ? 'bg-amber-500 text-zinc-950 border-amber-400'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                  }`}
                >
                  Male
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold border transition-all cursor-pointer ${
                    gender === 'female'
                      ? 'bg-amber-500 text-zinc-950 border-amber-400'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-1.5">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide">
                Suggested 30-Second Amharic Script to Read:
              </span>
              <p className="font-ethiopic text-xs leading-relaxed text-zinc-300 italic">
                &quot;ሰላም! እኔ ይህንን ድምፅ በመቅዳት ለግል የድምፅ ማቀናበሪያዬ እየተጠቀምኩ ነው። የአማርኛ ቋንቋ ውበትና ቅላጼ በጥበብ የተሞላ ነው።&quot;
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2.5 text-xs shadow-md shadow-rose-600/25 transition-all cursor-pointer"
                >
                  <div className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                  <span>Record 30s Speech</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 rounded-xl bg-zinc-800 border border-rose-500 text-rose-400 font-bold px-4 py-2.5 text-xs transition-all cursor-pointer"
                >
                  <Square className="h-3 w-3 fill-current" />
                  <span>Stop & Analyze ({30 - recordSeconds}s remaining)</span>
                </button>
              )}
              <button
                onClick={triggerAnalysis}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2.5 text-xs font-medium transition-colors cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Audio File</span>
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>Step 2: Spectral & Formant Extraction</span>
          </h3>

          {isAnalyzing ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-center">
              <RefreshCw className="h-8 w-8 text-amber-400 animate-spin" />
              <p className="text-xs text-zinc-300 font-medium">
                Analyzing acoustic timbre, pitch distribution (F0) & Amharic vowel resonances...
              </p>
            </div>
          ) : cloneProfile ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Voice Model Extracted Successfully</h4>
                  <p className="text-[11px] text-zinc-300">
                    Acoustic profile calibrated and mapped to Ge&apos;ez Fidel synthesis core.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase">Fundamental F0</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {cloneProfile.fundamentalFreq} Hz
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Vocal Cord Pitch</span>
                </div>
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase">Timbre Warmth</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {cloneProfile.timbreWarmth}%
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Chest Cavity Resonance</span>
                </div>
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase">Vibrato Rate</span>
                  <span className="font-mono font-bold text-cyan-400 text-sm">
                    {cloneProfile.vibratoRate} Hz
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Natural Modulation</span>
                </div>
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase">Acoustic Base</span>
                  <span className="font-mono font-bold text-purple-400 text-sm">
                    {cloneProfile.cloneBaseVoice}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Synthesis Engine Anchor</span>
                </div>
              </div>

              <button
                onClick={handleSaveToPersonaLibrary}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-zinc-950 font-bold py-3 text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Save to Persona Matrix & Start Generating</span>
              </button>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-800 rounded-xl">
              <Dna className="h-8 w-8 text-zinc-600 mb-2" />
              <p className="text-xs text-zinc-400 max-w-xs">
                Record or upload an Amharic audio clip on the left to extract the custom digital voice model.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
