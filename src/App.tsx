import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { HUD } from './components/HUD';
import { VirtualControls } from './components/VirtualControls';
import { PauseModal } from './components/PauseModal';
import { UpgradeModal } from './components/UpgradeModal';
import { GameOverModal } from './components/GameOverModal';
import { TitleScreen } from './components/TitleScreen';
import { sound } from './audio/soundManager';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [, setTick] = useState(0);

  // UI state
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.isMuted);

  const forceUpdate = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  // Initialize Canvas & Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high-DPI resizing
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for mobile battery & performance
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = true;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create engine
    const game = new GameEngine(canvas);
    game.onStateChange = forceUpdate;
    game.onOpenShop = () => {
      setIsShopOpen(true);
      forceUpdate();
    };

    setEngine(game);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      game.stop();
    };
  }, [forceUpdate]);

  // Start game from title screen
  const handleStartGame = (mode: 'story' | 'endless') => {
    if (!engine) return;
    setGameStarted(true);
    engine.resetGame(1, mode);
    engine.start();
    forceUpdate();
  };

  const handlePause = () => {
    if (!engine) return;
    engine.isPaused = true;
    setIsPaused(true);
  };

  const handleResume = () => {
    if (!engine) return;
    engine.isPaused = false;
    setIsPaused(false);
  };

  const handleRestart = (zoneId: number, mode: 'story' | 'endless') => {
    if (!engine) return;
    setIsPaused(false);
    setIsShopOpen(false);
    engine.resetGame(zoneId, mode);
    engine.isPaused = false;
    forceUpdate();
  };

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-stone-950 font-sans touch-none overscroll-none">
      {/* 2D Vector HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full cursor-crosshair touch-none"
      />

      {/* Title / Start Screen */}
      {!gameStarted && <TitleScreen onStartGame={handleStartGame} />}

      {/* Gameplay HUD */}
      {gameStarted && engine && (
        <>
          <HUD
            engine={engine}
            onPause={handlePause}
            onOpenUpgrades={() => setIsShopOpen(true)}
            isMuted={isMuted}
            onToggleSound={handleToggleSound}
          />

          {/* Virtual Mobile Joystick & Action Buttons */}
          <VirtualControls
            engine={engine}
            onAttack={() => engine.triggerAttack()}
            onDash={() => engine.triggerDash()}
            onMagic={() => engine.triggerMagic()}
            onHeal={() => engine.triggerHeal()}
            onInteract={() => engine.triggerInteract()}
            nearbyInteractable={engine.nearbyInteractable}
            herbsCount={engine.player.herbs}
          />
        </>
      )}

      {/* Upgrades Campfire Shrine Modal */}
      {isShopOpen && engine && (
        <UpgradeModal
          engine={engine}
          onClose={() => setIsShopOpen(false)}
          onUpgradeBought={forceUpdate}
        />
      )}

      {/* Pause & Settings Modal */}
      {isPaused && engine && (
        <PauseModal
          engine={engine}
          onResume={handleResume}
          onRestart={handleRestart}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* Game Over or Victory Screen */}
      {gameStarted && engine && (engine.isGameOver || engine.isVictory) && (
        <GameOverModal
          engine={engine}
          isVictory={engine.isVictory}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
