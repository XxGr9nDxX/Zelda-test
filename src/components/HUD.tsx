import React from 'react';
import { GameEngine } from '../game/engine';
import { Volume2, VolumeX, Pause, Sparkles, Compass } from 'lucide-react';
import { sound } from '../audio/soundManager';

interface HUDProps {
  engine: GameEngine;
  onPause: () => void;
  onOpenUpgrades: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  engine,
  onPause,
  onOpenUpgrades,
  isMuted,
  onToggleSound,
}) => {
  const { player, zone, activeBoss } = engine;
  const { hp, maxHp, stamina, maxStamina, mana, maxMana } = player.stats;

  // Render Heart Containers (Each full heart = 2 HP)
  const totalHearts = Math.ceil(maxHp / 2);
  const hearts = [];
  for (let i = 0; i < totalHearts; i++) {
    const heartVal = hp - i * 2;
    if (heartVal >= 2) {
      hearts.push('full');
    } else if (heartVal === 1) {
      hearts.push('half');
    } else {
      hearts.push('empty');
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none p-3 sm:p-5 flex flex-col justify-between z-10">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between gap-2 w-full">
        {/* Left: Player Vital Stats (Hearts, Stamina, Mana) */}
        <div className="pointer-events-auto flex flex-col gap-1.5 glass-panel p-2.5 sm:p-3 rounded-2xl border border-emerald-400/20 max-w-[210px] sm:max-w-xs shadow-xl">
          {/* Hearts Grid */}
          <div className="flex items-center gap-1 flex-wrap">
            {hearts.map((state, idx) => (
              <span
                key={idx}
                className="text-base sm:text-lg transition-transform duration-150 inline-block drop-shadow-[0_2px_4px_rgba(239,68,68,0.4)]"
              >
                {state === 'full' ? '❤️' : state === 'half' ? '💔' : '🖤'}
              </span>
            ))}
          </div>

          {/* Stamina & Mana Bars */}
          <div className="flex flex-col gap-1 w-full text-[10px] font-semibold text-emerald-200/80">
            {/* Stamina Bar */}
            <div className="w-full bg-stone-900/80 rounded-full h-2 overflow-hidden border border-emerald-500/20">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all duration-75 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, (stamina / maxStamina) * 100))}%` }}
              />
            </div>

            {/* Mana Bar */}
            <div className="w-full bg-stone-900/80 rounded-full h-2 overflow-hidden border border-amber-500/20">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-75 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, (mana / maxMana) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Boss Bar OR Zone Title & Quest Tracker */}
        <div className="flex flex-col items-center max-w-sm text-center">
          {activeBoss && activeBoss.hp > 0 ? (
            <div className="pointer-events-auto w-64 sm:w-80 glass-panel-gold p-2.5 rounded-2xl flex flex-col items-center gap-1 animate-pulse border border-red-500/40">
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-xs font-fantasy font-black tracking-wider text-amber-200">
                  CORRUPTED ELDER TREANT
                </span>
                <span className="text-[10px] font-mono font-bold text-red-400">
                  {Math.max(0, activeBoss.hp)} / {activeBoss.maxHp}
                </span>
              </div>
              <div className="w-full bg-stone-950/80 rounded-full h-2.5 overflow-hidden border border-red-500/30">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 transition-all duration-100 rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(100, (activeBoss.hp / activeBoss.maxHp) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="glass-panel px-3 py-1.5 rounded-2xl flex items-center gap-2 border border-emerald-400/20">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-fantasy font-bold text-emerald-100 tracking-wide">
                {zone.name}
              </span>
            </div>
          )}

          {/* Quest Tracker Pill */}
          {!activeBoss && (
            <div className="mt-1.5 glass-panel px-3 py-1 rounded-xl text-[10px] text-emerald-300/90 border border-emerald-500/15 max-w-xs truncate shadow">
              <span className="text-amber-300 font-bold mr-1">QUEST:</span>
              {zone.quest.title} (
              <span className="font-mono font-bold text-amber-200">
                {zone.quest.currentCount}/{zone.quest.targetCount}
              </span>
              )
            </div>
          )}
        </div>

        {/* Right: Currency & Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Gems counter */}
          <div className="glass-panel px-3 py-1.5 rounded-2xl flex items-center gap-1.5 border border-emerald-400/25">
            <span className="text-emerald-400 text-sm">💎</span>
            <span className="text-xs font-mono font-bold text-emerald-100">{player.gems}</span>
          </div>

          {/* Upgrades Campfire button */}
          <button
            onClick={onOpenUpgrades}
            className="glass-panel p-2 rounded-xl text-amber-300 hover:text-amber-100 active:scale-95 transition-transform border border-amber-400/25"
            title="Sanctuary Upgrades"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Audio toggle */}
          <button
            onClick={() => {
              sound.init();
              onToggleSound();
            }}
            className="glass-panel p-2 rounded-xl text-emerald-300 hover:text-emerald-100 active:scale-95 transition-transform border border-emerald-400/25"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Pause */}
          <button
            onClick={onPause}
            className="glass-panel p-2 rounded-xl text-slate-200 hover:text-white active:scale-95 transition-transform border border-emerald-400/25"
            title="Pause Menu"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Subtle Tips */}
      <div className="flex justify-between items-end w-full pb-1 text-[11px] text-stone-400/70 pointer-events-none">
        <div className="hidden lg:block bg-stone-950/60 backdrop-blur-sm px-3 py-1 rounded-lg border border-emerald-500/10">
          WASD/Arrows: Move · Space: Attack · Shift: Dash · E: Magic · Q: Heal · F: Interact
        </div>
      </div>
    </div>
  );
};
