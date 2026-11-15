import express, { Request, Response, NextFunction } from 'express';
import {
  hashPassword,
  verifyPassword,
  verifyAdminPassword,
  signToken,
  verifyToken,
  AuthTokenPayload,
} from './auth';
import {
  isNeonConfigured,
  findUserByUsername,
  findUserById,
  createUser,
  updateUserPreferences,
  recordRun,
  getTopNoCoinLeaderboard,
  listAllUsersAdmin,
  adminUpdateUser,
  adminResetUserScores,
  adminDeleteUser,
  toPublicUser,
} from './db';

interface AuthedRequest extends Request {
  auth?: AuthTokenPayload;
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

function requirePlayer(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = extractBearer(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== 'player' || typeof payload.sub !== 'number') {
    return res.status(401).json({ error: 'Sessão expirada ou inválida.' });
  }
  req.auth = payload;
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = extractBearer(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso administrativo negado.' });
  }
  req.auth = payload;
  next();
}

function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_.-]{3,24}$/.test(username.trim());
}

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      engine: isNeonConfigured() ? 'neon' : 'local',
    });
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, displayName, password, selectedSkin, selectedMap } = req.body ?? {};
      if (typeof username !== 'string' || !isValidUsername(username)) {
        return res.status(400).json({
          error: 'Usuário deve ter 3 a 24 caracteres (letras, números, _ . -).',
        });
      }
      if (typeof password !== 'string' || password.length < 4) {
        return res.status(400).json({
          error: 'A senha precisa ter pelo menos 4 caracteres.',
        });
      }
      const existing = await findUserByUsername(username);
      if (existing) {
        return res.status(409).json({
          error: 'Este nome de usuário já está em uso.',
        });
      }
      const user = await createUser({
        username,
        displayName: typeof displayName === 'string' && displayName.trim() ? displayName : username.trim(),
        passwordHash: hashPassword(password),
        selectedSkin: typeof selectedSkin === 'string' ? selectedSkin : 'rt-classic',
        selectedMap: typeof selectedMap === 'string' ? selectedMap : 'metro-central',
      });
      const token = signToken({
        sub: user.id,
        role: 'player',
        username: user.username,
      });
      res.status(201).json({ token, user: toPublicUser(user) });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Erro ao criar conta. Tente novamente.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body ?? {};
      if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Informe usuário e senha.' });
      }
      const user = await findUserByUsername(username);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
      }
      const token = signToken({
        sub: user.id,
        role: 'player',
        username: user.username,
      });
      res.json({ token, user: toPublicUser(user) });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Erro ao entrar. Tente novamente.' });
    }
  });

  app.get('/api/auth/me', requirePlayer, async (req: AuthedRequest, res) => {
    try {
      const user = await findUserById(req.auth!.sub as number);
      if (!user) {
        return res.status(404).json({ error: 'Conta não encontrada.' });
      }
      res.json({ user: toPublicUser(user) });
    } catch (err) {
      console.error('Me error:', err);
      res.status(500).json({ error: 'Erro ao carregar perfil.' });
    }
  });

  app.patch('/api/auth/preferences', requirePlayer, async (req: AuthedRequest, res) => {
    try {
      const { selectedSkin, selectedMap } = req.body ?? {};
      const updated = await updateUserPreferences(req.auth!.sub as number, {
        selectedSkin: typeof selectedSkin === 'string' ? selectedSkin : undefined,
        selectedMap: typeof selectedMap === 'string' ? selectedMap : undefined,
      });
      if (!updated) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      res.json({ user: toPublicUser(updated) });
    } catch (err) {
      console.error('Preferences error:', err);
      res.status(500).json({ error: 'Erro ao salvar preferências.' });
    }
  });

  app.post('/api/runs', async (req, res) => {
    try {
      const token = extractBearer(req);
      const payload = token ? verifyToken(token) : null;
      const { score, distance, coins, noCoinMs, durationMs, skinId, mapId } = req.body ?? {};

      const cleanScore = Math.max(0, Number(score) || 0);
      const cleanDist = Math.max(0, Number(distance) || 0);
      const cleanCoins = Math.max(0, Number(coins) || 0);
      const cleanNoCoin = Math.max(0, Number(noCoinMs) || 0);
      const cleanDur = Math.max(0, Number(durationMs) || 0);

      if (!payload || payload.role !== 'player' || typeof payload.sub !== 'number') {
        return res.json({ saved: false, guest: true });
      }

      const result = await recordRun({
        userId: payload.sub,
        score: cleanScore,
        distance: cleanDist,
        coins: cleanCoins,
        noCoinMs: cleanNoCoin,
        durationMs: cleanDur,
        skinId: typeof skinId === 'string' ? skinId : 'rt-classic',
        mapId: typeof mapId === 'string' ? mapId : 'metro-central',
      });

      if (!result) {
        return res.status(404).json({ error: 'Perfil não encontrado.' });
      }

      res.json({
        saved: true,
        guest: false,
        user: toPublicUser(result.user),
        isNewNoCoinRecord: result.isNewNoCoinRecord,
        isNewScoreRecord: result.isNewScoreRecord,
      });
    } catch (err) {
      console.error('Record run error:', err);
      res.status(500).json({ error: 'Erro ao salvar pontuação.' });
    }
  });

  app.get('/api/leaderboard', async (_req, res) => {
    try {
      const leaders = await getTopNoCoinLeaderboard(50);
      res.json({ leaders });
    } catch (err) {
      console.error('Leaderboard error:', err);
      res.status(500).json({ error: 'Erro ao carregar ranking global.' });
    }
  });

  // ---- Confidential ADMIN Endpoints ----

  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body ?? {};
    if (typeof password !== 'string' || !verifyAdminPassword(password)) {
      return res.status(401).json({ error: 'Senha administrativa incorreta.' });
    }
    const adminToken = signToken(
      { sub: 'admin', role: 'admin' },
      4 * 60 * 60 * 1000
    );
    res.json({ adminToken });
  });

  app.get('/api/admin/users', requireAdmin, async (_req, res) => {
    try {
      const users = await listAllUsersAdmin();
      res.json({ users });
    } catch (err) {
      console.error('Admin list users error:', err);
      res.status(500).json({ error: 'Erro ao listar jogadores.' });
    }
  });

  app.patch('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido.' });
      }
      const {
        username,
        displayName,
        newPassword,
        bestNoCoinMs,
        bestScore,
        bestDistance,
        totalCoins,
      } = req.body ?? {};

      if (typeof username === 'string') {
        if (!isValidUsername(username)) {
          return res.status(400).json({
            error: 'Usuário deve ter 3 a 24 caracteres válidos.',
          });
        }
        const collision = await findUserByUsername(username);
        if (collision && collision.id !== id) {
          return res.status(409).json({
            error: 'Já existe outro usuário com esse nome.',
          });
        }
      }

      let passwordHash: string | undefined;
      if (typeof newPassword === 'string' && newPassword.trim().length > 0) {
        if (newPassword.trim().length < 4) {
          return res.status(400).json({
            error: 'Nova senha deve ter pelo menos 4 caracteres.',
          });
        }
        passwordHash = hashPassword(newPassword.trim());
      }

      const updated = await adminUpdateUser(id, {
        username: typeof username === 'string' ? username : undefined,
        displayName: typeof displayName === 'string' ? displayName : undefined,
        passwordHash,
        bestNoCoinMs:
          bestNoCoinMs !== undefined ? Number(bestNoCoinMs) : undefined,
        bestScore: bestScore !== undefined ? Number(bestScore) : undefined,
        bestDistance:
          bestDistance !== undefined ? Number(bestDistance) : undefined,
        totalCoins: totalCoins !== undefined ? Number(totalCoins) : undefined,
      });

      if (!updated) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      res.json({ user: toPublicUser(updated) });
    } catch (err) {
      console.error('Admin update user error:', err);
      res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }
  });

  app.post('/api/admin/users/:id/reset-score', requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido.' });
      }
      const updated = await adminResetUserScores(id);
      if (!updated) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      res.json({ user: toPublicUser(updated) });
    } catch (err) {
      console.error('Admin reset score error:', err);
      res.status(500).json({ error: 'Erro ao resetar pontuação.' });
    }
  });

  app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido.' });
      }
      const deleted = await adminDeleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      res.json({ deleted: true });
    } catch (err) {
      console.error('Admin delete user error:', err);
      res.status(500).json({ error: 'Erro ao excluir perfil.' });
    }
  });

  return app;
}
