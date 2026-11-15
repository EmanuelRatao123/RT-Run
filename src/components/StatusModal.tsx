import { Play, RotateCcw, Home, Trophy, Timer } from 'lucide-react';
import { RunSummary } from '../game/engine';
import { formatNoCoinTime } from '../game/rules';

interface StatusModalProps {
  mode: 'paused' | 'gameover';
  summary: RunSummary | null;
  isNewNoCoinRecord: boolean;
  isGuest: boolean;
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
  onOpenLeaderboard: () => void;
}

export function StatusModal({
  mode,
  summary,
  isNewNoCoinRecord,
  isGuest,
  onResume,
  onRestart,
  onTitle,
  onOpenLeaderboard,
}: StatusModalProps) {
  if (mode === 'paused') {
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/70"
        role="dialog"
        aria-modal="true"
        aria-label="Jogo Pausado"
      >
        <div className="w-full max-w-sm rounded-2xl bg-[#0b101d] border-2 border-slate-700 p-6 shadow-2xl text-center space-y-4">
          <h2 className="text-2xl font-black text-white tracking-tight">
            JOGO PAUSADO
          </h2>
          <p className="text-xs text-slate-400">
            Use A/D ou Setas para trocar de trilho, Espaço para pular e S para rolar.
          </p>
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={onResume}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Continuar Corrida
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar
            </button>
            <button
              type="button"
              onClick={onTitle}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Voltar ao Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-label="Fim de Corrida"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#0b101d] border-2 border-amber-500/60 p-6 shadow-2xl space-y-4">
        <div className="text-center">
          <h2 className="text-3xl font-black text-white tracking-tight">
            FIM DE CORRIDA!
          </h2>
          {isNewNoCoinRecord && (
            <span className="inline-block mt-1.5 px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-black tracking-wide">
              NOVO RECORDE NO COIN!
            </span>
          )}
          {isGuest && (
            <p className="text-xs text-amber-300 mt-1.5">
              Modo convidado: faça login no menu para salvar no Top Global.
            </p>
          )}
        </div>

        {summary && (
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-slate-900 border border-emerald-500/40 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-emerald-400">
                <Timer className="w-3 h-3" />
                No Coin
              </div>
              <p className="text-lg font-black text-white tabular-nums mt-1">
                {formatNoCoinTime(summary.noCoinMs)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-900 border border-amber-500/40 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-amber-400">
                <Trophy className="w-3 h-3" />
                Score
              </div>
              <p className="text-lg font-black text-white tabular-nums mt-1">
                {summary.score.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="rounded-xl bg-slate-900 border border-sky-500/40 p-3 text-center">
              <span className="block text-[10px] font-bold uppercase text-sky-400">
                Distância
              </span>
              <p className="text-lg font-black text-white tabular-nums mt-1">
                {summary.distance}m
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            data-start="true"
            onClick={onRestart}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Correr Novamente
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="py-2.5 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-400/50 text-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              Top No Coin
            </button>
            <button
              type="button"
              onClick={onTitle}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Menu Principal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
