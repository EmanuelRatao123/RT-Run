import { useEffect, useState } from 'react';
import { Trophy, Timer, X, RefreshCw } from 'lucide-react';
import { fetchLeaderboard, PublicUser } from '../utils/api';
import { formatNoCoinTime } from '../game/rules';
import { getSkinById } from '../game/catalog';

interface LeaderboardModalProps {
  currentUserId?: number;
  onClose: () => void;
}

export function LeaderboardModal({
  currentUserId,
  onClose,
}: LeaderboardModalProps) {
  const [leaders, setLeaders] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLeaderboard();
      setLeaders(res.leaders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar ranking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-label="Top Global No Coin"
    >
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0b101d] border-2 border-emerald-500/40 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center">
              <Timer className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                TOP GLOBAL — NO COIN
              </h2>
              <p className="text-xs text-slate-400">
                Maior tempo correndo sem encostar em nenhuma moeda
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              aria-label="Atualizar Ranking"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar Top Global"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {loading && (
            <p className="text-center text-sm text-slate-400 py-8">
              Carregando ranking global...
            </p>
          )}
          {error && (
            <p className="text-center text-sm text-rose-400 py-6">{error}</p>
          )}
          {!loading && !error && leaders.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-8">
              Nenhum recorde registrado ainda. Seja o primeiro!
            </p>
          )}

          {!loading && !error && leaders.length > 0 && (
            <div className="space-y-2">
              {leaders.map((player, idx) => {
                const skin = getSkinById(player.selectedSkin);
                const isSelf = player.id === currentUserId;
                const rank = idx + 1;
                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${
                      isSelf
                        ? 'bg-emerald-500/15 border-emerald-400/70'
                        : 'bg-slate-900/90 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black tabular-nums shrink-0 ${
                          rank === 1
                            ? 'bg-amber-400 text-slate-950'
                            : rank === 2
                              ? 'bg-slate-300 text-slate-950'
                              : rank === 3
                                ? 'bg-orange-500 text-white'
                                : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        #{rank}
                      </span>
                      <span
                        className="w-3.5 h-3.5 rounded-full border shrink-0"
                        style={{
                          backgroundColor: skin.swatchHex,
                          borderColor: skin.accentHex,
                        }}
                        title={skin.name}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white truncate">
                          {player.displayName}{' '}
                          {isSelf && (
                            <span className="text-[10px] text-emerald-300 font-bold">
                              (VOCÊ)
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          @{player.username} · {skin.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center justify-end gap-1">
                          <Trophy className="w-3 h-3 text-sky-400" />
                          Score
                        </p>
                        <p className="text-xs font-bold text-slate-200 tabular-nums">
                          {player.bestScore.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
                          No Coin
                        </p>
                        <p className="text-base font-black text-emerald-300 tabular-nums">
                          {formatNoCoinTime(player.bestNoCoinMs)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
