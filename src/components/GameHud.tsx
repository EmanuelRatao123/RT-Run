import React from 'react';
import {
  Maximize2,
  Minimize2,
  Pause,
  Volume2,
  VolumeX,
  Timer,
  Lock,
} from 'lucide-react';

interface GameHudProps {
  scoreRef: React.RefObject<HTMLSpanElement | null>;
  distanceRef: React.RefObject<HTMLSpanElement | null>;
  coinsRef: React.RefObject<HTMLSpanElement | null>;
  noCoinTimerRef: React.RefObject<HTMLSpanElement | null>;
  noCoinActive: boolean;
  lockBannerMs: number | null;
  muted: boolean;
  isFullscreen: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onToggleFullscreen: () => void;
  onSwipeAction: (action: 'left' | 'right' | 'jump' | 'slide') => void;
}

export function GameHud({
  scoreRef,
  distanceRef,
  coinsRef,
  noCoinTimerRef,
  noCoinActive,
  lockBannerMs,
  muted,
  isFullscreen,
  onToggleMute,
  onPause,
  onToggleFullscreen,
  onSwipeAction,
}: GameHudProps) {
  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* Top Perimeter Row */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left: Score & Distance Cluster */}
        <div className="rounded-xl bg-[#090d1a]/88 border-2 border-slate-700/80 px-3.5 py-2 shadow-lg">
          <div className="flex items-baseline gap-3">
            <div>
              <span className="block text-[10px] font-black uppercase tracking-widest text-amber-400">
                Score
              </span>
              <span
                ref={scoreRef}
                className="text-2xl font-black text-white tabular-nums leading-none"
              >
                0
              </span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <span className="block text-[10px] font-black uppercase tracking-widest text-sky-400">
                Distância
              </span>
              <span
                ref={distanceRef}
                className="text-lg font-extrabold text-slate-100 tabular-nums leading-none"
              >
                0m
              </span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <span className="block text-[10px] font-black uppercase tracking-widest text-yellow-400">
                Moedas
              </span>
              <span
                ref={coinsRef}
                className="text-lg font-extrabold text-yellow-300 tabular-nums leading-none"
              >
                0
              </span>
            </div>
          </div>
        </div>

        {/* Top-Center: Signature NO COIN Chronometer */}
        <div className="flex flex-col items-center">
          <div
            className={`rounded-xl border-2 px-4 py-2 shadow-lg flex items-center gap-2.5 ${
              noCoinActive
                ? 'bg-[#071a14]/92 border-emerald-400/80'
                : 'bg-[#22120a]/92 border-amber-500/80'
            }`}
          >
            {noCoinActive ? (
              <Timer className="w-5 h-5 text-emerald-300 shrink-0" />
            ) : (
              <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <span
                className={`block text-[10px] font-black uppercase tracking-widest leading-none ${
                  noCoinActive ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {noCoinActive ? 'No Coin Ativo' : 'No Coin Travado'}
              </span>
              <span
                ref={noCoinTimerRef}
                data-testid="nocoin-timer"
                className="text-2xl font-black text-white tabular-nums leading-tight"
              >
                00:00.0
              </span>
            </div>
          </div>

          {lockBannerMs !== null && (
            <div className="mt-2 px-3 py-1 rounded-lg bg-amber-500 text-slate-950 text-xs font-black tracking-wide shadow-lg">
              MOEDA PEGA! NO COIN PAROU — CONTINUE CORRENDO!
            </div>
          )}
        </div>

        {/* Top-Right: Utility Controls (Fullscreen, Mute, Pause) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleFullscreen();
            }}
            aria-label={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
            title="Tela Cheia (F)"
            className="w-10 h-10 rounded-xl bg-[#090d1a]/90 hover:bg-slate-800 border-2 border-slate-700 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label={muted ? 'Ativar Som' : 'Silenciar Som'}
            title="Som (M)"
            className="w-10 h-10 rounded-xl bg-[#090d1a]/90 hover:bg-slate-800 border-2 border-slate-700 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-300" />
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            aria-label="Pausar Jogo"
            title="Pausar (P / Esc)"
            className="w-10 h-10 rounded-xl bg-[#090d1a]/90 hover:bg-slate-800 border-2 border-slate-700 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Touch Controls for Mobile / Tablet */}
      <div className="sm:hidden flex items-end justify-between gap-2 pointer-events-auto pb-1">
        <div className="flex gap-2">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => onSwipeAction('left')}
            aria-label="Mover para esquerda"
            className="w-14 h-14 rounded-2xl bg-[#090d1a]/85 border-2 border-slate-600 text-white font-black text-lg active:bg-slate-700"
          >
            ←
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => onSwipeAction('right')}
            aria-label="Mover para direita"
            className="w-14 h-14 rounded-2xl bg-[#090d1a]/85 border-2 border-slate-600 text-white font-black text-lg active:bg-slate-700"
          >
            →
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => onSwipeAction('slide')}
            aria-label="Deslizar"
            className="px-4 h-14 rounded-2xl bg-[#090d1a]/85 border-2 border-sky-500/60 text-sky-300 font-black text-xs uppercase active:bg-slate-700"
          >
            Rolar
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => onSwipeAction('jump')}
            aria-label="Pular"
            className="px-4 h-14 rounded-2xl bg-amber-500 border-2 border-amber-300 text-slate-950 font-black text-xs uppercase active:bg-amber-400"
          >
            Pular
          </button>
        </div>
      </div>
    </div>
  );
}
