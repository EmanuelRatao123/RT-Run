import React, { useState } from 'react';
import { Shield, LogOut, UserCheck, Trophy, Timer } from 'lucide-react';
import { loginPlayer, registerPlayer, PublicUser } from '../utils/api';
import { formatNoCoinTime } from '../game/rules';

interface AuthPanelProps {
  user: PublicUser | null;
  selectedSkin: string;
  selectedMap: string;
  onAuthSuccess: (token: string, user: PublicUser) => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
}

export function AuthPanel({
  user,
  selectedSkin,
  selectedMap,
  onAuthSuccess,
  onLogout,
  onOpenAdmin,
}: AuthPanelProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('Preencha usuário e senha.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await loginPlayer({ username: username.trim(), password });
        onAuthSuccess(res.token, res.user);
      } else {
        const res = await registerPlayer({
          username: username.trim(),
          displayName: displayName.trim() || username.trim(),
          password,
          selectedSkin,
          selectedMap,
        });
        onAuthSuccess(res.token, res.user);
      }
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <section
        aria-label="Perfil do Jogador"
        className="w-full max-w-[340px] rounded-2xl bg-[#0b101d]/92 border-2 border-amber-400/40 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.65)]"
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-white truncate">
                {user.displayName}
              </p>
              <p className="text-xs text-slate-400 truncate">@{user.username}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[11px] font-bold tracking-wider text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            ADMIN
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-xl bg-slate-900/90 border border-emerald-500/30 p-2.5">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              <Timer className="w-3 h-3" />
              Recorde No Coin
            </div>
            <p className="text-lg font-black text-white tabular-nums mt-0.5">
              {formatNoCoinTime(user.bestNoCoinMs)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-900/90 border border-sky-500/30 p-2.5">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-400">
              <Trophy className="w-3 h-3" />
              Melhor Score
            </div>
            <p className="text-lg font-black text-white tabular-nums mt-0.5">
              {user.bestScore.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair da Conta
        </button>
      </section>
    );
  }

  return (
    <section
      aria-label="Login e Cadastro"
      className="w-full max-w-[340px] rounded-2xl bg-[#0b101d]/92 border-2 border-slate-700/80 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.65)]"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`px-3 py-1 rounded-md text-xs font-extrabold cursor-pointer transition-colors ${
              mode === 'login'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`px-3 py-1 rounded-md text-xs font-extrabold cursor-pointer transition-colors ${
              mode === 'register'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Criar Conta
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenAdmin}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-[11px] font-extrabold tracking-wider text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Shield className="w-3.5 h-3.5" />
          ADMIN
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div>
          <label
            htmlFor="auth-username"
            className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1"
          >
            Usuário
          </label>
          <input
            id="auth-username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ex: corredor_rt"
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {mode === 'register' && (
          <div>
            <label
              htmlFor="auth-displayname"
              className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1"
            >
              Nome de Exibição
            </label>
            <input
              id="auth-displayname"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome no Top Global"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="auth-password"
            className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1"
          >
            Senha
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="text-xs font-semibold text-rose-400 bg-rose-950/60 border border-rose-500/40 rounded-lg px-2.5 py-1.5"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-sm font-black tracking-wide cursor-pointer transition-colors"
        >
          {loading
            ? 'Processando...'
            : mode === 'login'
              ? 'Entrar e Salvar Recordes'
              : 'Cadastrar Conta'}
        </button>

        <p className="text-[11px] text-slate-400 text-center leading-tight">
          Entre para registrar seu tempo no Top Global No Coin.
        </p>
      </form>
    </section>
  );
}
