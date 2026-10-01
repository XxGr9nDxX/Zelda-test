import React, { useEffect } from 'react';
import { GameEngine } from '../game/engine';
import { RotateCcw, Trophy, Skull, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  engine: GameEngine;
  isVictory: boolean;
  onRestart: (zoneId: number, mode: 'story' | 'endless') => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  engine,
  isVictory,
  onRestart,
}) => {
  useEffect(() => {
    if (isVictory) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#34d399', '#fbbf24', '#38bdf8', '#f43f5e'],
        });
      } catch {}
    }
  }, [isVictory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md">
      <div
        className={`relative w-full max-w-md rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center gap-5 border shadow-2xl ${
          isVictory
            ? 'glass-panel-gold border-amber-400/40 text-stone-100'
            : 'glass-panel border-red-500/30 text-stone-100'
        }`}
      >
        {/* Icon & Title */}
        <div
          className={`w-18 h-18 rounded-full flex items-center justify-center border shadow-lg ${
            isVictory
              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
              : 'bg-red-500/20 border-red-500 text-red-400'
          }`}
        >
          {isVictory ? <Trophy className="w-9 h-9" /> : <Skull className="w-9 h-9" />}
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-fantasy font-black tracking-wide">
            {isVictory ? 'THE GROVE IS SAVED!' : 'HERO FALLEN IN BATTLE'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-300/80 mt-1 max-w-xs">
            {isVictory
              ? 'You purged the ancient corruption and defeated the Corrupted Elder Treant!'
              : 'The shadows overwhelmed your resolve. Rise again, brave wanderer.'}
          </p>
        </div>

        {/* Stats card */}
        <div className="w-full bg-stone-900/70 p-4 rounded-2xl border border-stone-700/60 flex justify-around text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block">SCORE</span>
            <span className="text-lg font-mono font-bold text-amber-300">{engine.score}</span>
          </div>
          <div className="w-[1px] bg-stone-700/60" />
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block">EMERALDS</span>
            <span className="text-lg font-mono font-bold text-emerald-300">
              {engine.player.gems} 💎
            </span>
          </div>
          <div className="w-[1px] bg-stone-700/60" />
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block">ZONE</span>
            <span className="text-lg font-mono font-bold text-cyan-300">
              {engine.mode === 'endless' ? `Wave ${engine.wave}` : `Zone ${engine.zone.id}`}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
          <button
            onClick={() => onRestart(isVictory ? 1 : engine.zone.id, 'story')}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-transform active:scale-95 border border-emerald-300"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isVictory ? 'Play Story Again' : 'Try Again'}</span>
          </button>

          <button
            onClick={() => onRestart(4, 'endless')}
            className="flex-1 py-3 px-4 rounded-2xl bg-purple-950/80 hover:bg-purple-900/80 text-purple-200 border border-purple-500/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Endless Trials</span>
          </button>
        </div>
      </div>
    </div>
  );
};
