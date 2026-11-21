import React, { useState } from 'react';
import { Play, Square, User, Sparkles, Search, X, Check } from 'lucide-react';
import { VoicePersona, VoiceAgeGroup, VoiceGender } from '../types';
import { VOICE_PERSONAS } from '../data/voices';

interface VoiceMatrixProps {
  selectedVoiceId: string;
  onSelectVoice: (voice: VoicePersona) => void;
  onPreviewSample: (voice: VoicePersona) => void;
  previewPlayingVoiceId: string | null;
  onCloseMenu?: () => void;
  isMenu?: boolean;
}

export const VoiceMatrix: React.FC<VoiceMatrixProps> = ({
  selectedVoiceId,
  onSelectVoice,
  onPreviewSample,
  previewPlayingVoiceId,
  onCloseMenu,
  isMenu = false,
}) => {
  const [selectedAge, setSelectedAge] = useState<VoiceAgeGroup | 'all'>('all');
  const [selectedGender, setSelectedGender] = useState<VoiceGender | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVoices = VOICE_PERSONAS.filter((voice) => {
    if (selectedAge !== 'all' && voice.ageGroup !== selectedAge) return false;
    if (selectedGender !== 'all' && voice.gender !== selectedGender) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = voice.name.toLowerCase().includes(q) || voice.amharicName.includes(q);
      const matchesDesc = voice.description.toLowerCase().includes(q) || voice.amharicDescription.includes(q);
      const matchesTags = voice.tags.some(t => t.toLowerCase().includes(q)) || voice.toneQualities.some(t => t.toLowerCase().includes(q));
      if (!matchesName && !matchesDesc && !matchesTags) return false;
    }
    return true;
  });

  return (
    <div className={isMenu ? 'space-y-4' : 'rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-sm'}>
      {/* Header and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
              Voice Persona Matrix Menu
            </h2>
            <span className="font-ethiopic text-xs text-amber-400">የድምፅ ምርጫዎች</span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Select authentic native Amharic voice personas across age demographics & vocal textures ({filteredVoices.length} voices).
          </p>
        </div>
        {onCloseMenu && (
          <button
            onClick={onCloseMenu}
            className="self-end sm:self-auto flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Apply & Close Menu</span>
          </button>
        )}
      </div>

      {/* Search and Demographic Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-zinc-950/80 p-2 rounded-xl border border-zinc-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actors (Abebe, Almaz, Aster, Gashe...)"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {(['all', 'adult', 'young_adult', 'elderly', 'child'] as const).map((age) => (
            <button
              key={age}
              onClick={() => setSelectedAge(age)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                selectedAge === age
                  ? 'bg-amber-500 text-zinc-950 font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {age === 'all' && 'All Ages'}
              {age === 'adult' && 'Adult'}
              {age === 'young_adult' && 'Youth'}
              {age === 'elderly' && 'Elder'}
              {age === 'child' && 'Child'}
            </button>
          ))}
          <div className="h-3 w-px bg-zinc-800 mx-1 hidden sm:block" />
          {(['all', 'male', 'female'] as const).map((gender) => (
            <button
              key={gender}
              onClick={() => setSelectedGender(gender)}
              className={`rounded-lg px-2 py-1 text-xs font-medium transition-all ${
                selectedGender === gender
                  ? 'bg-emerald-500 text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {gender === 'all' && 'Both'}
              {gender === 'male' && 'Male'}
              {gender === 'female' && 'Female'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Personas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {filteredVoices.map((voice) => {
          const isSelected = selectedVoiceId === voice.id;
          const isPlaying = previewPlayingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice)}
              className={`group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/40 shadow-md shadow-amber-500/10'
                  : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 hover:bg-zinc-900/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-zinc-700/80 group-hover:border-amber-500/60 transition-colors">
                      <img
                        src={voice.avatarUrl}
                        alt={voice.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white text-sm">
                          {voice.name}
                        </span>
                        <span className="font-ethiopic text-amber-400 font-bold text-sm">
                          {voice.amharicName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                        <span className="capitalize">{voice.ageGroup.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{voice.age} yrs</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewSample(voice);
                    }}
                    title="Play voice preview"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all ${
                      isPlaying
                        ? 'border-amber-400 bg-amber-500 text-zinc-950 shadow-sm animate-pulse'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-amber-500 hover:text-amber-400'
                    }`}
                  >
                    {isPlaying ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
                  </button>
                </div>

                <p className="mt-2.5 text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                  {voice.description}
                </p>
                <p className="mt-1 font-ethiopic text-xs text-zinc-400 line-clamp-1">
                  {voice.amharicDescription}
                </p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {voice.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-300 font-medium border border-zinc-700/50"
                    >
                      {tag}
                    </span>
                  ))}
                  {voice.toneQualities.slice(0, 1).map((tone) => (
                    <span
                      key={tone}
                      className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300 font-medium border border-amber-500/20"
                    >
                      {tone}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">
                  Base: <strong className="text-zinc-400 font-mono">{voice.baseVoice}</strong>
                </span>
                {isSelected ? (
                  <span className="flex items-center gap-1 font-semibold text-amber-400">
                    <Sparkles className="h-3 w-3" />
                    Active Persona
                  </span>
                ) : (
                  <span className="text-zinc-500 group-hover:text-zinc-400 transition-colors">
                    Click to select
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
