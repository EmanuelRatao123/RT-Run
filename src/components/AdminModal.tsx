import React, { useState } from 'react';
import {
  Shield,
  X,
  Search,
  Edit3,
  RotateCcw,
  Trash2,
  Save,
  Lock,
} from 'lucide-react';
import {
  adminDeleteProfile,
  adminEditUser,
  adminResetScores,
  fetchAdminUsers,
  loginAdmin,
  PublicUser,
} from '../utils/api';
import { formatNoCoinTime } from '../game/rules';

interface AdminModalProps {
  onClose: () => void;
  onDataChanged: () => void;
}

export function AdminModal({ onClose, onDataChanged }: AdminModalProps) {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [users, setUsers] = useState<PublicUser[]>([]);
  const [search, setSearch] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<PublicUser | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editNoCoinSec, setEditNoCoinSec] = useState('0');
  const [editScore, setEditScore] = useState('0');

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const loadUsers = async (token: string) => {
    try {
      const res = await fetchAdminUsers(token);
      setUsers(res.users);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao carregar usuários.'
      );
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!password) {
      setAuthError('Digite a senha administrativa.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await loginAdmin(password);
      setAdminToken(res.adminToken);
      setPassword('');
      await loadUsers(res.adminToken);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Senha incorreta.');
    } finally {
      setAuthLoading(false);
    }
  };

  const startEdit = (u: PublicUser) => {
    setEditingUser(u);
    setEditUsername(u.username);
    setEditDisplayName(u.displayName);
    setEditNewPassword('');
    setEditNoCoinSec((u.bestNoCoinMs / 1000).toFixed(1));
    setEditScore(String(u.bestScore));
    setErrorMsg(null);
    setStatusMsg(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !editingUser) return;
    setErrorMsg(null);
    try {
      const noCoinMs = Math.max(0, Math.round(Number(editNoCoinSec) * 1000));
      const scoreVal = Math.max(0, Math.round(Number(editScore) || 0));
      const res = await adminEditUser(adminToken, editingUser.id, {
        username: editUsername.trim(),
        displayName: editDisplayName.trim(),
        newPassword: editNewPassword.trim() || undefined,
        bestNoCoinMs: noCoinMs,
        bestScore: scoreVal,
      });
      setUsers((prev) =>
        prev.map((item) => (item.id === res.user.id ? res.user : item))
      );
      setEditingUser(null);
      setStatusMsg(`Perfil "${res.user.username}" atualizado com sucesso.`);
      onDataChanged();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao salvar perfil.');
    }
  };

  const handleResetScore = async (u: PublicUser) => {
    if (!adminToken) return;
    setErrorMsg(null);
    try {
      const res = await adminResetScores(adminToken, u.id);
      setUsers((prev) =>
        prev.map((item) => (item.id === res.user.id ? res.user : item))
      );
      setStatusMsg(`Pontuações de "${u.username}" zeradas.`);
      onDataChanged();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao resetar pontuação.'
      );
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!adminToken) return;
    setErrorMsg(null);
    try {
      await adminDeleteProfile(adminToken, id);
      setUsers((prev) => prev.filter((item) => item.id !== id));
      setConfirmDeleteId(null);
      setStatusMsg('Perfil excluído permanentemente.');
      onDataChanged();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao excluir perfil.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.username.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q)
    );
  });

  if (!adminToken) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        role="dialog"
        aria-modal="true"
        aria-label="Acesso Administrativo"
      >
        <div className="w-full max-w-sm rounded-2xl bg-[#0b101d] border-2 border-amber-500/50 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center">
                <Lock className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">PAINEL ADMIN</h2>
                <p className="text-[11px] text-slate-400">
                  Acesso restrito ao administrador
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar Painel Admin"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-3">
            <div>
              <label
                htmlFor="admin-secret-input"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1"
              >
                Senha de Administrador
              </label>
              <input
                id="admin-secret-input"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha confidencial"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {authError && (
              <p
                role="alert"
                className="text-xs font-semibold text-rose-400 bg-rose-950/60 border border-rose-500/40 rounded-lg px-3 py-2"
              >
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-sm font-black cursor-pointer"
            >
              {authLoading ? 'Verificando...' : 'Desbloquear Painel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-label="Gerenciamento Administrativo de Usuários"
    >
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl bg-[#0b101d] border-2 border-amber-500/50 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-black text-white">
                PAINEL EXCLUSIVO ADMIN — RT RUN
              </h2>
              <p className="text-xs text-slate-400">
                Gerenciar perfis, editar dados, resetar pontuações ou excluir contas ({users.length} jogadores)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sair do Painel Admin"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por usuário ou nome..."
              aria-label="Buscar jogadores"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
          {statusMsg && (
            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-3 py-1.5 rounded-lg">
              {statusMsg}
            </span>
          )}
          {errorMsg && (
            <span className="text-xs font-bold text-rose-300 bg-rose-950/70 border border-rose-500/40 px-3 py-1.5 rounded-lg">
              {errorMsg}
            </span>
          )}
        </div>

        {editingUser && (
          <form
            onSubmit={handleSaveEdit}
            className="m-4 p-4 rounded-xl bg-slate-900 border-2 border-amber-400/50 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-amber-300">
                Editando Perfil #{editingUser.id} (@{editingUser.username})
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="admin-edit-username"
                  className="block text-[11px] font-bold text-slate-300 mb-1"
                >
                  Usuário
                </label>
                <input
                  id="admin-edit-username"
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="admin-edit-displayname"
                  className="block text-[11px] font-bold text-slate-300 mb-1"
                >
                  Nome de Exibição
                </label>
                <input
                  id="admin-edit-displayname"
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="admin-edit-password"
                  className="block text-[11px] font-bold text-slate-300 mb-1"
                >
                  Nova Senha (opcional)
                </label>
                <input
                  id="admin-edit-password"
                  type="password"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  placeholder="Manter atual"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="admin-edit-nocoin"
                  className="block text-[11px] font-bold text-slate-300 mb-1"
                >
                  Melhor No Coin (segundos)
                </label>
                <input
                  id="admin-edit-nocoin"
                  type="number"
                  step="0.1"
                  min="0"
                  value={editNoCoinSec}
                  onChange={(e) => setEditNoCoinSec(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white tabular-nums"
                />
              </div>
              <div>
                <label
                  htmlFor="admin-edit-score"
                  className="block text-[11px] font-bold text-slate-300 mb-1"
                >
                  Melhor Score
                </label>
                <input
                  id="admin-edit-score"
                  type="number"
                  min="0"
                  value={editScore}
                  onChange={(e) => setEditScore(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white tabular-nums"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar Alterações
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800"
            >
              <div className="min-w-0">
                <p className="text-sm font-black text-white truncate">
                  {u.displayName}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    (@{u.username})
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-0.5 tabular-nums">
                  <span className="text-emerald-300 font-bold">
                    No Coin: {formatNoCoinTime(u.bestNoCoinMs)}
                  </span>
                  <span>Score: {u.bestScore.toLocaleString('pt-BR')}</span>
                  <span>Distância: {u.bestDistance}m</span>
                  <span>Corridas: {u.totalRuns}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(u)}
                  aria-label={`Editar ${u.username}`}
                  className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-xs font-bold text-sky-200 flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() => handleResetScore(u)}
                  aria-label={`Resetar pontuação de ${u.username}`}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-xs font-bold text-amber-200 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Resetar
                </button>

                {confirmDeleteId === u.id ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(u.id)}
                    aria-label={`Confirmar exclusão de ${u.username}`}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-black text-white cursor-pointer"
                  >
                    Confirmar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(u.id)}
                    aria-label={`Excluir ${u.username}`}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-xs font-bold text-rose-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
