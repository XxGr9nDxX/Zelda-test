import React from 'react';
import { Play, Sparkles, Shield, Compass, Swords } from 'lucide-react';
import { sound } from '../audio/soundManager';

interface TitleScreenProps {
  onStartGame: (mode: 'story' | 'endless') => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame }) => {
  const handleStart = (mode: 'story' | 'endless') => {
    sound.init();
    sound.playChestOpen();
    onStartGame(mode);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-stone-950/90 overflow-y-auto">
      {/* Background radiant glow */}
      <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center gap-6 border border-emerald-500/30 text-stone-100 shadow-2xl">
        {/* Emblem & Branding */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 border border-emerald-300 shadow-xl shadow-emerald-500/30 flex items-center justify-center text-3xl">
            🌿
          </div>

          <h1 className="text-3xl sm:text-4xl font-fantasy font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 mt-2">
            SYLVA
          </h1>
          <p className="text-xs uppercase tracking-widest font-bold text-emerald-400/90 font-mono -mt-1">
            Echoes of the Wild
          </p>
          <p className="text-xs text-stone-300/80 max-w-xs mt-1">
            A lush mobile top-down action adventure. Awaken the ancient sunstones, cut through the wild, and restore the Sacred Grove.
          </p>
        </div>

        {/* Start Game Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => handleStart('story')}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-stone-950 font-fantasy font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition-transform active:scale-95 border border-emerald-200"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Embark on Adventure</span>
          </button>

          <button
            onClick={() => handleStart('endless')}
            className="w-full py-3 px-6 rounded-2xl bg-stone-900/80 hover:bg-stone-800 text-purple-200 border border-purple-500/30 font-fantasy font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Endless Grove Trials</span>
          </button>
        </div>

        {/* Controls Quick Guide */}
        <div className="w-full bg-stone-900/60 p-3.5 rounded-2xl border border-emerald-500/15 text-left text-xs text-stone-300 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-[11px] uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>How to Play</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-400">
            <div className="bg-stone-950/40 p-2 rounded-xl border border-stone-800">
              <span className="font-bold text-stone-200 block mb-0.5">📱 Mobile Touch</span>
              <p>• Left side: Touch & drag joystick</p>
              <p>• Right buttons: Strike, Dash, Solar Burst & Heal</p>
            </div>

            <div className="bg-stone-950/40 p-2 rounded-xl border border-stone-800">
              <span className="font-bold text-stone-200 block mb-0.5">💻 Keyboard</span>
              <p>• Move: WASD / Arrows</p>
              <p>• Attack: Space · Dash: Shift</p>
              <p>• Magic: E · Heal: Q · Interact: F</p>
            </div>
          </div>
        </div>

        <span className="text-[10px] text-stone-500">
          Crafted with smooth vector 2D art, dynamic lighting & synthesized Web Audio
        </span>
      </div>
    </div>
  );
};
