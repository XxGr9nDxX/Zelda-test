import React, { useRef, useState, useEffect, useCallback } from 'react';
import { GameEngine } from '../game/engine';

interface VirtualControlsProps {
  engine: GameEngine | null;
  onAttack: () => void;
  onDash: () => void;
  onMagic: () => void;
  onHeal: () => void;
  onInteract: () => void;
  nearbyInteractable: string | null;
  herbsCount: number;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  engine,
  onAttack,
  onDash,
  onMagic,
  onHeal,
  onInteract,
  nearbyInteractable,
  herbsCount,
}) => {
  const joystickAreaRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [stickOrigin, setStickOrigin] = useState<{ x: number; y: number } | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const maxRadius = 45;

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(12);
      } catch {}
    }
  };

  // Joystick touch tracking
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = joystickAreaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const origin = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
    setStickOrigin(origin);
    setKnobPos({ x: 0, y: 0 });
    setJoystickActive(true);
    triggerHaptic();
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!joystickActive || !stickOrigin || !joystickAreaRef.current) return;
      e.preventDefault();

      const touch = Array.from(e.touches).find(
        (t) => t.clientX < window.innerWidth * 0.6
      );
      if (!touch) return;

      const rect = joystickAreaRef.current.getBoundingClientRect();
      const currentX = touch.clientX - rect.left;
      const currentY = touch.clientY - rect.top;

      let dx = currentX - stickOrigin.x;
      let dy = currentY - stickOrigin.y;
      const distance = Math.hypot(dx, dy);

      if (distance > maxRadius) {
        dx = (dx / distance) * maxRadius;
        dy = (dy / distance) * maxRadius;
      }

      setKnobPos({ x: dx, y: dy });

      if (engine) {
        engine.inputVector = {
          x: dx / maxRadius,
          y: dy / maxRadius,
        };
      }
    },
    [joystickActive, stickOrigin, engine]
  );

  const handleTouchEnd = useCallback(() => {
    setJoystickActive(false);
    setStickOrigin(null);
    setKnobPos({ x: 0, y: 0 });
    if (engine) {
      engine.inputVector = { x: 0, y: 0 };
    }
  }, [engine]);

  useEffect(() => {
    if (joystickActive) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchcancel', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [joystickActive, handleTouchMove, handleTouchEnd]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20">
      {/* Left side: Touchpad / Virtual Joystick Area */}
      <div
        ref={joystickAreaRef}
        onTouchStart={handleTouchStart}
        className="absolute left-0 bottom-0 w-1/2 h-72 pointer-events-auto flex items-end p-6"
      >
        {/* Fixed default joystick baseline or floating under thumb */}
        <div
          className={`w-28 h-28 rounded-full border border-emerald-400/25 bg-emerald-950/40 backdrop-blur-sm flex items-center justify-center transition-opacity duration-150 relative ${
            joystickActive ? 'opacity-90' : 'opacity-40'
          }`}
          style={
            stickOrigin
              ? {
                  position: 'absolute',
                  left: stickOrigin.x - 56,
                  top: stickOrigin.y - 56,
                }
              : undefined
          }
        >
          {/* Subtle directional cross markings */}
          <div className="absolute w-full h-[1px] bg-emerald-500/15" />
          <div className="absolute h-full w-[1px] bg-emerald-500/15" />

          {/* Thumb Knob with glow */}
          <div
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 border border-emerald-200/50 shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          >
            <div className="w-4 h-4 rounded-full bg-white/40" />
          </div>
        </div>

        <span className="absolute bottom-3 left-7 text-[10px] uppercase tracking-wider text-emerald-400/60 font-semibold md:hidden">
          Touch & Drag to Move
        </span>
      </div>

      {/* Right side: Action Buttons Cluster */}
      <div className="absolute right-3 sm:right-6 bottom-4 sm:bottom-6 pointer-events-auto flex flex-col items-end gap-3 z-30">
        {/* Interaction Button (conditionally pops up or pulsates when close to chest/shrine) */}
        {nearbyInteractable && (
          <button
            onClick={() => {
              triggerHaptic();
              onInteract();
            }}
            className="animate-bounce flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500/90 text-stone-950 border border-amber-300 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/40 active:scale-95 transition-transform"
          >
            <span>✨</span>
            <span>{nearbyInteractable}</span>
            <kbd className="hidden md:inline-block ml-1 bg-stone-900/40 text-[10px] px-1.5 py-0.5 rounded text-amber-200">
              [F]
            </kbd>
          </button>
        )}

        {/* Action Button Diamond / Grid */}
        <div className="relative w-48 h-48 select-none">
          {/* Heal / Potion button (Top) */}
          <button
            onClick={() => {
              triggerHaptic();
              onHeal();
            }}
            className="absolute top-0 left-16 w-13 h-13 rounded-full bg-stone-900/80 border border-lime-400/50 backdrop-blur-md flex flex-col items-center justify-center text-lime-300 shadow-md active:scale-90 transition-transform active:bg-lime-950"
            title="Drink Healing Herb (Q or H)"
          >
            <span className="text-lg">🍃</span>
            <span className="absolute -top-1 -right-1 bg-lime-600 text-stone-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-lime-200">
              {herbsCount}
            </span>
            <span className="hidden md:block text-[8px] text-lime-400/70 font-mono">Q</span>
          </button>

          {/* Dash / Roll button (Left) */}
          <button
            onClick={() => {
              triggerHaptic();
              onDash();
            }}
            className="absolute top-16 left-1 w-14 h-14 rounded-full bg-cyan-950/80 border border-cyan-400/60 backdrop-blur-md flex flex-col items-center justify-center text-cyan-200 shadow-lg shadow-cyan-900/40 active:scale-90 transition-transform active:bg-cyan-800"
            title="Dash Roll (Shift or K)"
          >
            <span className="text-xl">💨</span>
            <span className="text-[9px] font-bold text-cyan-300">DASH</span>
            <span className="hidden md:block text-[8px] text-cyan-400/70 font-mono">SHIFT</span>
          </button>

          {/* Magic Solar Burst button (Right) */}
          <button
            onClick={() => {
              triggerHaptic();
              onMagic();
            }}
            className="absolute top-16 right-0 w-14 h-14 rounded-full bg-amber-950/80 border border-amber-400/60 backdrop-blur-md flex flex-col items-center justify-center text-amber-200 shadow-lg shadow-amber-900/40 active:scale-90 transition-transform active:bg-amber-800"
            title="Solar Magic Burst (E or L)"
          >
            <span className="text-xl">🔮</span>
            <span className="text-[9px] font-bold text-amber-300">SOLAR</span>
            <span className="hidden md:block text-[8px] text-amber-400/70 font-mono">E</span>
          </button>

          {/* Primary Attack button (Bottom Center / Large) */}
          <button
            onClick={() => {
              triggerHaptic();
              onAttack();
            }}
            className="absolute bottom-0 right-8 w-18 h-18 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 border-2 border-yellow-200 text-stone-950 shadow-xl shadow-yellow-500/40 flex flex-col items-center justify-center active:scale-90 transition-transform font-black"
            title="Sword Attack (Space or J)"
          >
            <span className="text-2xl">⚔️</span>
            <span className="text-[10px] tracking-wider uppercase font-extrabold mt-[-2px]">
              STRIKE
            </span>
            <span className="hidden md:block text-[8px] text-stone-900/80 font-mono">SPACE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
