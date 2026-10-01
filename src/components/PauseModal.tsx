import React from 'react';
import { GameEngine } from '../game/engine';
import { X, Play, RotateCcw, Volume2, Music, Shield, Compass } from 'lucide-react';
import { sound } from '../audio/soundManager';

interface PauseModalProps {
  engine: GameEngine;
  onResume: () => void;
  onRestart: (zoneId: number, mode: 'story' | 'endless') => void;
  isMuted: boolean;
  onToggleSound: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  engine,
  onResume,
  onRestart,
  isMuted,
  onToggleSound,
}) => {
  const [musicOn, setMusicOn] = React.useState(sound.musicEnabled);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    sound.setMusicEnabled(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 sm:p-7 flex flex-col gap-5 border border-emerald-500/30 text-stone-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏸️</span>
            <h2 className="text-xl font-fantasy font-black tracking-wide text-emerald-200">
              Game Paused
            </h2>
          </div>
          <button
            onClick={onResume}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Controls */}
        <div className="flex flex-col gap-3 bg-stone-900/60 p-4 rounded-2xl border border-emerald-500/15">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300/80">
            Audio Settings
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-stone-300">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Sound Effects</span>
            </div>
            <button
              onClick={onToggleSound}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                !isMuted ? 'bg-emerald-600 text-stone-950' : 'bg-stone-800 text-stone-400'
              }`}
            >
              {!isMuted ? 'ENABLED' : 'MUTED'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-stone-300">
              <Music className="w-4 h-4 text-emerald-400" />
              <span>Ambient Zen Music</span>
            </div>
            <button
              onClick={toggleMusic}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                musicOn ? 'bg-emerald-600 text-stone-950' : 'bg-stone-800 text-stone-400'
              }`}
            >
              {musicOn ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Level / Mode Select */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300/80 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>Select Zone / Game Mode</span>
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onRestart(1, 'story')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-colors ${
                engine.zone.id === 1 && engine.mode === 'story'
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                  : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-emerald-500/40'
              }`}
            >
              <span className="font-bold">1. Whispering Canopy</span>
              <span className="text-[10px] text-stone-400">Discover 3 Shrines</span>
            </button>

            <button
              onClick={() => onRestart(2, 'story')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-colors ${
                engine.zone.id === 2 && engine.mode === 'story'
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                  : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-emerald-500/40'
              }`}
            >
              <span className="font-bold">2. Sunken Ruins</span>
              <span className="text-[10px] text-stone-400">Purge 10 Stalkers</span>
            </button>

            <button
              onClick={() => onRestart(3, 'story')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-colors ${
                engine.zone.id === 3 && engine.mode === 'story'
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                  : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-emerald-500/40'
              }`}
            >
              <span className="font-bold">3. Boss: Elder Treant</span>
              <span className="text-[10px] text-amber-300">Guardian Showdown</span>
            </button>

            <button
              onClick={() => onRestart(4, 'endless')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-colors ${
                engine.mode === 'endless'
                  ? 'bg-purple-950/80 border-purple-400 text-purple-200'
                  : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-purple-500/40'
              }`}
            >
              <span className="font-bold">Endless Arena</span>
              <span className="text-[10px] text-purple-400">Survival Wave Trials</span>
            </button>
          </div>
        </div>

        {/* Controls Reference */}
        <div className="bg-stone-900/60 p-3 rounded-2xl border border-stone-800 text-xs text-stone-400 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-stone-200 mb-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Combat Tips</span>
          </div>
          <p>• Dashing makes you invulnerable for a split second to dodge boss slams.</p>
          <p>• Cutting tall grass with your sword drops emeralds and healing hearts.</p>
          <p>• Solar magic penetrates multiple targets at range.</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-2">
          <button
            onClick={() => onRestart(engine.zone.id, engine.mode)}
            className="flex-1 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-stone-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Level</span>
          </button>

          <button
            onClick={onResume}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 border border-emerald-300"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume</span>
          </button>
        </div>
      </div>
    </div>
  );
};
