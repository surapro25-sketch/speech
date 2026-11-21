import React from 'react';
import { Smile, Sliders, Flame, Wind, Clock, RefreshCw, Check } from 'lucide-react';
import { EmotionType, EmotionProfile, SpeechSettings } from '../types';
import { EMOTIONS } from '../data/voices';

interface EmotionSelectorProps {
  selectedEmotion: EmotionType;
  onSelectEmotion: (emotion: EmotionType) => void;
  settings: SpeechSettings;
  onUpdateSettings: (settings: Partial<SpeechSettings>) => void;
  onResetSettings: () => void;
  onCloseMenu?: () => void;
  isMenu?: boolean;
}

export const EmotionSelector: React.FC<EmotionSelectorProps> = ({
  selectedEmotion,
  onSelectEmotion,
  settings,
  onUpdateSettings,
  onResetSettings,
  onCloseMenu,
  isMenu = false,
}) => {
  const currentEmotionObj = EMOTIONS.find((e) => e.id === selectedEmotion) || EMOTIONS[0];

  return (
    <div className={isMenu ? 'space-y-4' : 'rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-sm'}>
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Smile className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
            Deep Emotional Speech Engine Menu
          </h2>
          <span className="font-ethiopic text-xs text-amber-400">የስሜት ማስተካከያ</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onResetSettings}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/50 cursor-pointer"
            title="Reset to default voice settings"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reset Defaults</span>
          </button>
          {onCloseMenu && (
            <button
              onClick={onCloseMenu}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3.5 py-1 text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Apply & Close</span>
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-zinc-400 mb-3.5">
        Dynamically modify pitch contours, tempo, breathiness, and cadence to trigger visceral human emotional performance.
      </p>

      {/* Emotion Preset Chips */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 mb-4">
        {EMOTIONS.map((emotion: EmotionProfile) => {
          const isSelected = selectedEmotion === emotion.id;
          return (
            <button
              key={emotion.id}
              onClick={() => {
                onSelectEmotion(emotion.id);
                onUpdateSettings({
                  intensity: emotion.intensityDefault,
                  breathiness: emotion.breathinessDefault,
                });
              }}
              className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/50 shadow-sm'
                  : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-1.5 text-lg">
                <span>{emotion.emojis[0]}</span>
                <span className="text-xs font-semibold text-zinc-200 truncate">
                  {emotion.name.split('/')[0]}
                </span>
              </div>
              <span className="font-ethiopic text-[11px] text-zinc-400 mt-1 truncate w-full">
                {emotion.amharicName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Emotion Detail Banner */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-3 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex text-2xl gap-1">
            {currentEmotionObj.emojis.slice(0, 3).map((emoji, idx) => (
              <span key={idx}>{emoji}</span>
            ))}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                Active Mode: {currentEmotionObj.name}
              </h4>
              <span className="font-ethiopic text-xs text-amber-400">({currentEmotionObj.amharicName})</span>
            </div>
            <p className="text-xs text-zinc-300 mt-0.5">
              {currentEmotionObj.description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {currentEmotionObj.vocalEffects.map((fx) => (
            <span
              key={fx}
              className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-amber-300 border border-zinc-700"
            >
              {fx}
            </span>
          ))}
        </div>
      </div>

      {/* Fine-Tuning Sliders Matrix */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2 border-t border-zinc-800/80">
        {/* Pitch Slider */}
        <div className="space-y-1.5 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/50">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <Sliders className="h-3.5 w-3.5 text-amber-400" />
              Pitch Tuning
            </span>
            <span className="font-mono text-amber-400 font-semibold text-xs">
              {settings.pitch > 0 ? `+${settings.pitch}` : settings.pitch} st
            </span>
          </div>
          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={settings.pitch}
            onChange={(e) => onUpdateSettings({ pitch: parseInt(e.target.value) })}
            className="w-full cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>-12 st (Deep)</span>
            <span>0</span>
            <span>+12 st (High)</span>
          </div>
        </div>

        {/* Speed Controls (0.25x to 4.0x) */}
        <div className="space-y-1.5 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/50">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              Speech Rate
            </span>
            <span className="font-mono text-amber-400 font-semibold text-xs">
              {settings.speed.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="0.25"
            max="4.0"
            step="0.05"
            value={settings.speed}
            onChange={(e) => onUpdateSettings({ speed: parseFloat(e.target.value) })}
            className="w-full cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>0.25x</span>
            <span>1.0x (Normal)</span>
            <span>4.0x</span>
          </div>
        </div>

        {/* Intensity / Energy */}
        <div className="space-y-1.5 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/50">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              Vocal Energy
            </span>
            <span className="font-mono text-amber-400 font-semibold text-xs">
              {settings.intensity}%
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="200"
            step="5"
            value={settings.intensity}
            onChange={(e) => onUpdateSettings({ intensity: parseInt(e.target.value) })}
            className="w-full cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>20% (Subdued)</span>
            <span>100%</span>
            <span>200% (Explosive)</span>
          </div>
        </div>

        {/* Breathiness & Whisper */}
        <div className="space-y-1.5 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/50">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <Wind className="h-3.5 w-3.5 text-amber-400" />
              Breathiness
            </span>
            <span className="font-mono text-amber-400 font-semibold text-xs">
              {settings.breathiness}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={settings.breathiness}
            onChange={(e) => onUpdateSettings({ breathiness: parseInt(e.target.value) })}
            className="w-full cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>0% (Tight)</span>
            <span>50%</span>
            <span>100% (Whisper)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
