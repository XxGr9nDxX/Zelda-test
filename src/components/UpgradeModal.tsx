import React from 'react';
import { GameEngine } from '../game/engine';
import { X, Sparkles, Heart } from 'lucide-react';
import { sound } from '../audio/soundManager';

interface UpgradeModalProps {
  engine: GameEngine;
  onClose: () => void;
  onUpgradeBought: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  engine,
  onClose,
  onUpgradeBought,
}) => {
  const { player, upgrades } = engine;

  const handleBuy = (id: string) => {
    const success = engine.buyUpgrade(id);
    if (success) {
      onUpgradeBought();
    }
  };

  const handleRest = () => {
    sound.playHeartPickup();
    player.stats.hp = player.stats.maxHp;
    player.stats.mana = player.stats.maxMana;
    onUpgradeBought();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-panel-gold rounded-3xl p-6 sm:p-7 flex flex-col gap-5 border border-amber-500/30 text-stone-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🔥</span>
            <div>
              <h2 className="text-xl font-fantasy font-black tracking-wide text-amber-200">
                Ancient Campfire Shrine
              </h2>
              <p className="text-xs text-amber-300/70">
                Commune with the forest spirits to enhance your relics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currency & Rest Action */}
        <div className="flex items-center justify-between bg-stone-900/60 p-3.5 rounded-2xl border border-amber-500/20">
          <div className="flex items-center gap-2">
            <span className="text-lg">💎</span>
            <span className="text-sm font-mono font-bold text-emerald-300">
              {player.gems} Emeralds
            </span>
          </div>
          <button
            onClick={handleRest}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-stone-950 text-xs font-bold transition-transform active:scale-95 shadow-md border border-emerald-300"
          >
            <Heart className="w-3.5 h-3.5 fill-current text-red-950" />
            <span>Rest & Heal</span>
          </button>
        </div>

        {/* Artifacts List */}
        <div className="flex flex-col gap-3">
          {upgrades.map((item) => {
            const isMax = item.tier >= item.maxTier;
            const canAfford = player.gems >= item.cost;

            return (
              <div
                key={item.id}
                className="bg-stone-900/70 border border-stone-700/60 hover:border-amber-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl p-2 rounded-xl bg-stone-800/80 border border-stone-700">
                    {item.icon}
                  </span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h4 className="font-fantasy font-bold text-sm text-stone-100">
                        {item.name}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-800 text-amber-300 border border-amber-500/20">
                        Tier {item.tier}/{item.maxTier}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">{item.description}</p>
                  </div>
                </div>

                <button
                  disabled={isMax || !canAfford}
                  onClick={() => handleBuy(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-md active:scale-95 whitespace-nowrap ${
                    isMax
                      ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                      : canAfford
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 border border-yellow-200'
                      : 'bg-stone-800 text-stone-400 border border-stone-700 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isMax ? 'MAXED' : `${item.cost} 💎`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs uppercase tracking-wider transition-colors border border-stone-700"
          >
            Resume Journey
          </button>
        </div>
      </div>
    </div>
  );
};
