export interface PublicUser {
  id: number;
  username: string;
  displayName: string;
  bestNoCoinMs: number;
  bestScore: number;
  bestDistance: number;
  totalCoins: number;
  totalRuns: number;
  selectedSkin: string;
  selectedMap: string;
  createdAt: string;
  updatedAt: string;
}

const TOKEN_KEY = 'rt_run_player_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage restriction
  }
}

async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Erro HTTP ${res.status}`);
  }
  return data as T;
}

export async function registerPlayer(body: {
  username: string;
  displayName: string;
  password: string;
  selectedSkin: string;
  selectedMap: string;
}): Promise<{ token: string; user: PublicUser }> {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function loginPlayer(body: {
  username: string;
  password: string;
}): Promise<{ token: string; user: PublicUser }> {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchMe(token: string): Promise<{ user: PublicUser }> {
  return apiFetch('/api/auth/me', {}, token);
}

export async function savePreferences(
  token: string,
  prefs: { selectedSkin?: string; selectedMap?: string }
): Promise<{ user: PublicUser }> {
  return apiFetch(
    '/api/auth/preferences',
    {
      method: 'PATCH',
      body: JSON.stringify(prefs),
    },
    token
  );
}

export async function submitRun(
  token: string | null,
  run: {
    score: number;
    distance: number;
    coins: number;
    noCoinMs: number;
    durationMs: number;
    skinId: string;
    mapId: string;
  }
): Promise<{
  saved: boolean;
  guest: boolean;
  user?: PublicUser;
  isNewNoCoinRecord?: boolean;
  isNewScoreRecord?: boolean;
}> {
  return apiFetch(
    '/api/runs',
    {
      method: 'POST',
      body: JSON.stringify(run),
    },
    token
  );
}

export async function fetchLeaderboard(): Promise<{ leaders: PublicUser[] }> {
  return apiFetch('/api/leaderboard');
}

export async function loginAdmin(password: string): Promise<{ adminToken: string }> {
  return apiFetch('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function fetchAdminUsers(
  adminToken: string
): Promise<{ users: PublicUser[] }> {
  return apiFetch('/api/admin/users', {}, adminToken);
}

export async function adminEditUser(
  adminToken: string,
  id: number,
  updates: {
    username?: string;
    displayName?: string;
    newPassword?: string;
    bestNoCoinMs?: number;
    bestScore?: number;
    bestDistance?: number;
    totalCoins?: number;
  }
): Promise<{ user: PublicUser }> {
  return apiFetch(
    `/api/admin/users/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    },
    adminToken
  );
}

export async function adminResetScores(
  adminToken: string,
  id: number
): Promise<{ user: PublicUser }> {
  return apiFetch(
    `/api/admin/users/${id}/reset-score`,
    { method: 'POST' },
    adminToken
  );
}

export async function adminDeleteProfile(
  adminToken: string,
  id: number
): Promise<{ deleted: boolean }> {
  return apiFetch(
    `/api/admin/users/${id}`,
    { method: 'DELETE' },
    adminToken
  );
}
