import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';
import { hashPassword } from './auth';

export interface UserRecord {
  id: number;
  username: string;
  displayName: string;
  passwordHash: string;
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

export type PublicUser = Omit<UserRecord, 'passwordHash'>;

export interface RunInput {
  userId: number;
  score: number;
  distance: number;
  coins: number;
  noCoinMs: number;
  durationMs: number;
  skinId: string;
  mapId: string;
}

export function toPublicUser(user: UserRecord): PublicUser {
  const { passwordHash: _ignored, ...pub } = user;
  return pub;
}

function getConnectionString(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
}

export function isNeonConfigured(): boolean {
  return Boolean(getConnectionString());
}

const SEED_PLAYERS = [
  {
    username: 'pedro_dash',
    displayName: 'Pedro Dash',
    bestNoCoinMs: 74200,
    bestScore: 18450,
    bestDistance: 1620,
    totalCoins: 142,
    totalRuns: 19,
    selectedSkin: 'neon-cyber',
    selectedMap: 'tokyo-neon',
  },
  {
    username: 'luna_sky',
    displayName: 'Luna Sky',
    bestNoCoinMs: 58900,
    bestScore: 14920,
    bestDistance: 1310,
    totalCoins: 98,
    totalRuns: 14,
    selectedSkin: 'astronauta',
    selectedMap: 'espaco-orbital',
  },
  {
    username: 'mestre_nocoin',
    displayName: 'Mestre NoCoin',
    bestNoCoinMs: 46100,
    bestScore: 11200,
    bestDistance: 980,
    totalCoins: 12,
    totalRuns: 11,
    selectedSkin: 'shadow-ninja',
    selectedMap: 'metro-central',
  },
  {
    username: 'kuro_ninja',
    displayName: 'Kuro Ninja',
    bestNoCoinMs: 32500,
    bestScore: 9840,
    bestDistance: 860,
    totalCoins: 215,
    totalRuns: 16,
    selectedSkin: 'samurai-mecha',
    selectedMap: 'vulcao-magma',
  },
  {
    username: 'veloce_rt',
    displayName: 'Veloce RT',
    bestNoCoinMs: 19800,
    bestScore: 7650,
    bestDistance: 670,
    totalCoins: 174,
    totalRuns: 9,
    selectedSkin: 'golden-rat',
    selectedMap: 'deserto-canion',
  },
];

// ---- Neon PostgreSQL Adapter ----

let schemaPromise: Promise<void> | null = null;

function getSql() {
  const url = getConnectionString();
  if (!url) throw new Error('DATABASE_URL not configured');
  return neon(url);
}

async function ensureNeonSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS rt_users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          display_name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          best_no_coin_ms INTEGER NOT NULL DEFAULT 0,
          best_score INTEGER NOT NULL DEFAULT 0,
          best_distance INTEGER NOT NULL DEFAULT 0,
          total_coins INTEGER NOT NULL DEFAULT 0,
          total_runs INTEGER NOT NULL DEFAULT 0,
          selected_skin TEXT NOT NULL DEFAULT 'rt-classic',
          selected_map TEXT NOT NULL DEFAULT 'metro-central',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS rt_runs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES rt_users(id) ON DELETE CASCADE,
          score INTEGER NOT NULL DEFAULT 0,
          distance INTEGER NOT NULL DEFAULT 0,
          coins INTEGER NOT NULL DEFAULT 0,
          no_coin_ms INTEGER NOT NULL DEFAULT 0,
          duration_ms INTEGER NOT NULL DEFAULT 0,
          skin_id TEXT NOT NULL,
          map_id TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_rt_users_no_coin ON rt_users (best_no_coin_ms DESC, best_score DESC)
      `;
      const countRows = await sql`SELECT COUNT(*)::int AS count FROM rt_users`;
      const count = Number(countRows[0]?.count ?? 0);
      if (count === 0) {
        const defaultPass = hashPassword('rtrun-seed-account');
        for (const p of SEED_PLAYERS) {
          await sql`
            INSERT INTO rt_users (
              username, display_name, password_hash,
              best_no_coin_ms, best_score, best_distance,
              total_coins, total_runs, selected_skin, selected_map
            ) VALUES (
              ${p.username}, ${p.displayName}, ${defaultPass},
              ${p.bestNoCoinMs}, ${p.bestScore}, ${p.bestDistance},
              ${p.totalCoins}, ${p.totalRuns}, ${p.selectedSkin}, ${p.selectedMap}
            )
            ON CONFLICT (username) DO NOTHING
          `;
        }
      }
    })().catch((err) => {
      schemaPromise = null;
      throw err;
    });
  }
  return schemaPromise;
}

function mapNeonRow(row: Record<string, unknown>): UserRecord {
  return {
    id: Number(row.id),
    username: String(row.username),
    displayName: String(row.display_name),
    passwordHash: String(row.password_hash),
    bestNoCoinMs: Number(row.best_no_coin_ms ?? 0),
    bestScore: Number(row.best_score ?? 0),
    bestDistance: Number(row.best_distance ?? 0),
    totalCoins: Number(row.total_coins ?? 0),
    totalRuns: Number(row.total_runs ?? 0),
    selectedSkin: String(row.selected_skin ?? 'rt-classic'),
    selectedMap: String(row.selected_map ?? 'metro-central'),
    createdAt: new Date(String(row.created_at ?? Date.now())).toISOString(),
    updatedAt: new Date(String(row.updated_at ?? Date.now())).toISOString(),
  };
}

// ---- Local JSON Fallback Adapter (for preview when DATABASE_URL is absent) ----

interface LocalDbFile {
  nextUserId: number;
  nextRunId: number;
  users: UserRecord[];
  runs: Array<RunInput & { id: number; createdAt: string }>;
}

function getLocalDbPath(): string {
  if (process.env.VERCEL) {
    return '/tmp/rt-run-db.json';
  }
  return path.join(process.cwd(), '.data', 'rt-run-db.json');
}

function readLocalDb(): LocalDbFile {
  const filePath = getLocalDbPath();
  if (!fs.existsSync(filePath)) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const now = new Date().toISOString();
    const defaultPass = hashPassword('rtrun-seed-account');
    const seededUsers: UserRecord[] = SEED_PLAYERS.map((p, idx) => ({
      id: idx + 1,
      username: p.username,
      displayName: p.displayName,
      passwordHash: defaultPass,
      bestNoCoinMs: p.bestNoCoinMs,
      bestScore: p.bestScore,
      bestDistance: p.bestDistance,
      totalCoins: p.totalCoins,
      totalRuns: p.totalRuns,
      selectedSkin: p.selectedSkin,
      selectedMap: p.selectedMap,
      createdAt: now,
      updatedAt: now,
    }));
    const initial: LocalDbFile = {
      nextUserId: seededUsers.length + 1,
      nextRunId: 1,
      users: seededUsers,
      runs: [],
    };
    fs.writeFileSync(filePath, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as LocalDbFile;
}

function writeLocalDb(data: LocalDbFile): void {
  const filePath = getLocalDbPath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ---- Unified Repository Functions ----

export async function findUserByUsername(username: string): Promise<UserRecord | null> {
  const normalized = username.trim().toLowerCase();
  if (isNeonConfigured()) {
    await ensureNeonSchema();
    const sql = getSql();
    const rows = await sql`
      SELECT * FROM rt_users WHERE LOWER(username) = ${normalized} LIMIT 1
    `;
    return rows[0] ? mapNeonRow(rows[0] as Record<string, unknown>) : null;
  }
  const db = readLocalDb();
  return db.users.find((u) => u.username.toLowerCase() === normalized) ?? null;
}

export async function findUserById(id: number): Promise<UserRecord | null> {
  if (isNeonConfigured()) {
    await ensureNeonSchema();
    const sql = getSql();
    const rows = await sql`SELECT * FROM rt_users WHERE id = ${id} LIMIT 1`;
    return rows[0] ? mapNeonRow(rows[0] as Record<string, unknown>) : null;
  }
  const db = readLocalDb();
  return db.users.find((u) => u.id === id) ?? null;
}

export async function createUser(params: {
  username: string;
  displayName: string;
  passwordHash: string;
  selectedSkin?: string;
  selectedMap?: string;
}): Promise<UserRecord> {
  const username = params.username.trim().toLowerCase();
  const displayName = params.displayName.trim() || params.username.trim();
  const selectedSkin = params.selectedSkin || 'rt-classic';
  const selectedMap = params.selectedMap || 'metro-central';

  if (isNeonConfigured()) {
    await ensureNeonSchema();
    const sql = getSql();
    const rows = await sql`
      INSERT INTO rt_users (
        username, display_name, password_hash, selected_skin, selected_map
      ) VALUES (
        ${username}, ${displayName}, ${params.passwordHash}, ${selectedSkin}, ${selectedMap}
      )
      RETURNING *
    `;
    return mapNeonRow(rows[0] as Record<string, unknown>);
  }

  const db = readLocalDb();
  const now = new Date().toISOString();
  const created: UserRecord = {
    id: db.nextUserId++,
    username,
    displayName,
    passwordHash: params.passwordHash,
    bestNoCoinMs: 0,
    bestScore: 0,
    bestDistance: 0,
    totalCoins: 0,
    totalRuns: 0,
    selectedSkin,
    selectedMap,
    createdAt: now,
    updatedAt: now,
  };
  db.users.push(created);
  writeLocalDb(db);
  return created;
}

export async function updateUserPreferences(
  userId: number,
  prefs: { selectedSkin?: string; selectedMap?: string }
): Promise<UserRecord | null> {
  if (isNeonConfigured()) {
    await ensureNeonSchema();
    const sql = getSql();
    const current = await findUserById(userId);
    if (!current) return null;
    const rows = await sql`
      UPDATE rt_users
      SET
        selected_skin = ${prefs.selectedSkin ?? current.selectedSkin},
        selected_map = ${prefs.selectedMap ?? current.selectedMap},
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING *
    `;
    return rows[0] ? mapNeonRow(rows[0] as Record<string, unknown>) : null;
  }

  const db = readLocalDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;
  if (prefs.selectedSkin) user.selectedSkin = prefs.selectedSkin;
  if (prefs.selectedMap) user.selectedMap = prefs.selectedMap;
  user.updatedAt = new Date().toISOString();
  writeLocalDb(db);
  return user;
}

export async function recordRun(input: RunInput): Promise<{
  user: UserRecord;
  isNewNoCoinRecord: boolean;
  isNewScoreRecord: boolean;
} | null> {
  const existing = await findUserById(input.userId);
  if (!existing) return null;

  const isNewNoCoinRecord = input.noCoinMs > existing.bestNoCoinMs;
  const isNewScoreRecord = input.score > existing.bestScore;
  const nextNoCoinMs = Math.max(existing.bestNoCoinMs, Math.round(input.noCoinMs));
  const nextScore = Math.max(existing.bestScore, Math.round(input.score));
  const nextDistance = Math.max(existing.bestDistance, Math.round(input.distance));

  if (isNeonConfigured()) {
    await ensureNeonSchema();
    const sql = getSql();
    await sql`
      INSERT INTO rt_runs (
        user_id, score, distance, coins, no_coin_ms, duration_ms, skin_id, map_id
      ) VALUES (
        ${input.userId}, ${Math.round(input.score)}, ${Math.round(input.distance)},
        ${Math.round(input.coins)}, ${Math.round(input.noCoinMs)}, ${Math.round(input.durationMs)},
        ${input.skinId}, ${input.mapId}
      )
    `;
    const rows = await sql`
      UPDATE rt_users
      SET
        best_no_coin_ms = ${nextNoCoinMs},
        best_score = ${nextScore},
        best_distance = ${nextDistance},
        total_coins = total_coins + ${Math.round(input.coins)},
        total_runs = total_runs + 1,
        selected_skin = ${input.skinId},
        selected_map = ${input.mapId},
        updated_at = NOW()
      WHERE id = ${input.userId}
      RETURNING *
    `;
    return {
      user: mapNeonRow(rows[0] as Record<string, unknown>),
      isNewNoCoinRecord,
      isNewScoreRecord,
    };
  }

  const db = readLocalDb();
  const user = db.users.find((u) => u.id === input.userId);
  if (!user) return null;
  db.runs.push({
    ...input,
    id: db.nextRunId++,
    createdAt: new Date().toISOString(),
  });
  user.bestNoCoinMs = nextNoCoinMs;
  user.bestScore = nextScore;
  user.bestDistance = nextDistance;
  user.totalCoins += Math.round(input.coins);
  user.totalRuns += 1;
  user.selectedSkin = input.skinId;
  user.selectedMap = input.mapId;
  user.updatedAt = new Date().toISOString();
  writeLocalDb(db);
  return { user, isNewNoCoinRecord, isNewScoreRecord };
}

export async function getTopNoCoinLeaderboard(limit = 50): Promise<PublicUser[]> {
  if (isNeonConfigured()) {
    await ensureNeonSchema();
    const sql = getSql();
    const rows = await sql`
      SELECT * FROM rt_users
      ORDER BY best_no_coin_ms DESC, best_score DESC, id ASC
      LIMIT ${limit}
    `;
    return rows.map((r) => toPublicUser(mapNeonRow(r as Record<string, unknown>)));
  }

  const db = readLocalDb();
  return [...db.users]
    .sort((a, b) => {
      if (b.bestNoCoinMs !== a.bestNoCoinMs) return b.bestNoCoinMs - a.bestNoCoinMs;
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      return a.id - b.id;
    })
    .slice(0, limit)
    .map(toPublicUser);
}

export async function listAllUsersAdmin(): Promise<PublicUser[]> {
  if (isNeonConfigured()) {
    await ensureNeonSchema();
    const sql = getSql();
    const rows = await sql`
      SELECT * FROM rt_users ORDER BY best_no_coin_ms DESC, id ASC
    `;
    return rows.map((r) => toPublicUser(mapNeonRow(r as Record<string, unknown>)));
  }
  const db = readLocalDb();
  return [...db.users]
    .sort((a, b) => b.bestNoCoinMs - a.bestNoCoinMs || a.id - b.id)
    .map(toPublicUser);
}

export async function adminUpdateUser(
  id: number,
  updates: {
    username?: string;
    displayName?: string;
    passwordHash?: string;
    bestNoCoinMs?: number;
    bestScore?: number;
    bestDistance?: number;
    totalCoins?: number;
  }
): Promise<UserRecord | null> {
  const current = await findUserById(id);
  if (!current) return null;

  const nextUsername = updates.username
    ? updates.username.trim().toLowerCase()
    : current.username;
  const nextDisplay = updates.displayName
    ? updates.displayName.trim()
    : current.displayName;
  const nextPasswordHash = updates.passwordHash ?? current.passwordHash;
  const nextNoCoin =
    typeof updates.bestNoCoinMs === 'number'
      ? Math.max(0, Math.round(updates.bestNoCoinMs))
      : current.bestNoCoinMs;
  const nextScore =
    typeof updates.bestScore === 'number'
      ? Math.max(0, Math.round(updates.bestScore))
      : current.bestScore;
  const nextDist =
    typeof updates.bestDistance === 'number'
      ? Math.max(0, Math.round(updates.bestDistance))
      : current.bestDistance;
  const nextCoins =
    typeof updates.totalCoins === 'number'
      ? Math.max(0, Math.round(updates.totalCoins))
      : current.totalCoins;

  if (isNeonConfigured()) {
    await ensureNeonSchema();
    const sql = getSql();
    const rows = await sql`
      UPDATE rt_users
      SET
        username = ${nextUsername},
        display_name = ${nextDisplay},
        password_hash = ${nextPasswordHash},
        best_no_coin_ms = ${nextNoCoin},
        best_score = ${nextScore},
        best_distance = ${nextDist},
        total_coins = ${nextCoins},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] ? mapNeonRow(rows[0] as Record<string, unknown>) : null;
  }

  const db = readLocalDb();
  const user = db.users.find((u) => u.id === id);
  if (!user) return null;
  user.username = nextUsername;
  user.displayName = nextDisplay;
  user.passwordHash = nextPasswordHash;
  user.bestNoCoinMs = nextNoCoin;
  user.bestScore = nextScore;
  user.bestDistance = nextDist;
  user.totalCoins = nextCoins;
  user.updatedAt = new Date().toISOString();
  writeLocalDb(db);
  return user;
}

export async function adminResetUserScores(id: number): Promise<UserRecord | null> {
  if (isNeonConfigured()) {
    await ensureNeonSchema();
    const sql = getSql();
    await sql`DELETE FROM rt_runs WHERE user_id = ${id}`;
    const rows = await sql`
      UPDATE rt_users
      SET
        best_no_coin_ms = 0,
        best_score = 0,
        best_distance = 0,
        total_coins = 0,
        total_runs = 0,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] ? mapNeonRow(rows[0] as Record<string, unknown>) : null;
  }

  const db = readLocalDb();
  const user = db.users.find((u) => u.id === id);
  if (!user) return null;
  db.runs = db.runs.filter((r) => r.userId !== id);
  user.bestNoCoinMs = 0;
  user.bestScore = 0;
  user.bestDistance = 0;
  user.totalCoins = 0;
  user.totalRuns = 0;
  user.updatedAt = new Date().toISOString();
  writeLocalDb(db);
  return user;
}

export async function adminDeleteUser(id: number): Promise<boolean> {
  if (isNeonConfigured()) {
    await ensureNeonSchema();
    const sql = getSql();
    const rows = await sql`DELETE FROM rt_users WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }

  const db = readLocalDb();
  const prevLen = db.users.length;
  db.users = db.users.filter((u) => u.id !== id);
  db.runs = db.runs.filter((r) => r.userId !== id);
  writeLocalDb(db);
  return db.users.length < prevLen;
}
