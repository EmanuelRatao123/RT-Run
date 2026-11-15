export type LaneIndex = -1 | 0 | 1;

export const LANE_WIDTH = 3.1;
export const PLAYER_HALF_WIDTH = 0.42;
export const PLAYER_STAND_HEIGHT = 1.75;
export const PLAYER_SLIDE_HEIGHT = 0.82;
export const GRAVITY = -36;
export const JUMP_VELOCITY = 14.4;
export const FAST_FALL_VELOCITY = -25;

export interface NoCoinState {
  active: boolean;
  elapsedMs: number;
  lockedAtMs: number | null;
}

export function createNoCoinState(): NoCoinState {
  return {
    active: true,
    elapsedMs: 0,
    lockedAtMs: null,
  };
}

export function tickNoCoin(state: NoCoinState, dtMs: number): NoCoinState {
  if (!state.active || dtMs <= 0) return state;
  const nextElapsed = state.elapsedMs + dtMs;
  return {
    ...state,
    elapsedMs: nextElapsed,
  };
}

export function lockNoCoinOnCoinPickup(state: NoCoinState): {
  next: NoCoinState;
  justLocked: boolean;
} {
  if (!state.active) {
    return { next: state, justLocked: false };
  }
  return {
    next: {
      active: false,
      elapsedMs: state.elapsedMs,
      lockedAtMs: state.elapsedMs,
    },
    justLocked: true,
  };
}

export function formatNoCoinTime(ms: number): string {
  const safeMs = Math.max(0, Math.round(ms));
  const totalTenths = Math.floor(safeMs / 100);
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}.${tenths}`;
}

export function laneToX(lane: LaneIndex): number {
  return lane * LANE_WIDTH;
}

export function clampLane(lane: number): LaneIndex {
  if (lane <= -1) return -1;
  if (lane >= 1) return 1;
  return 0;
}

export function computeSpeedForDistance(distanceMeters: number): number {
  const d = Math.max(0, distanceMeters);
  // Smooth ramp: 17 m/s start, accelerating fairly up to 38 m/s
  return Math.min(38, 17 + Math.sqrt(d) * 0.45);
}

export function computeWaveGap(speed: number, rngVal = 0.5): number {
  const clampedRng = Math.max(0, Math.min(1, rngVal));
  // Guarantees generous reaction room even after an 18.4m ramp-train at top speed
  return 28 + speed * 0.45 + clampedRng * 7;
}

export function computeMovingTrainSpawnZ(
  zBase: number,
  runnerSpeed: number,
  trainSpeedZ: number
): number {
  // Spawn moving train further back so it arrives at z=0 synchronized with zBase
  const safeRunner = Math.max(10, runnerSpeed);
  const distToPlayer = Math.max(0, -zBase);
  const arrivalTime = distToPlayer / safeRunner;
  return zBase - trainSpeedZ * arrivalTime;
}

export type LaneSpawnKind =
  | 'clear'
  | 'coins'
  | 'low-barrier'
  | 'high-sign'
  | 'train'
  | 'moving-train'
  | 'ramp-train';

export interface PlannedLaneItem {
  lane: LaneIndex;
  kind: LaneSpawnKind;
  withCoins: boolean;
}

export function planNextWave(params: {
  distanceMeters: number;
  prevOpenLane: LaneIndex | null;
  blockedLanes: Record<LaneIndex, boolean>;
  rng: () => number;
}): { openLane: LaneIndex; items: PlannedLaneItem[] } {
  const { distanceMeters, prevOpenLane, blockedLanes, rng } = params;
  const lanes: LaneIndex[] = [-1, 0, 1];
  const difficulty = Math.min(1, Math.max(0, distanceMeters) / 1200);

  // Pick openLane that is not reserved by an approaching moving train and is reachable
  let candidates = lanes.filter((l) => !blockedLanes[l]);
  if (prevOpenLane !== null) {
    const reachable = candidates.filter((l) => Math.abs(l - prevOpenLane) <= 1);
    if (reachable.length > 0) candidates = reachable;
  }
  if (candidates.length === 0) candidates = lanes;

  const openLane = candidates[Math.floor(rng() * candidates.length) % candidates.length];
  const anyLaneBlocked = lanes.some((l) => blockedLanes[l]);
  let movingTrainSpawned = anyLaneBlocked;

  const items: PlannedLaneItem[] = lanes.map((lane) => {
    if (blockedLanes[lane] && lane !== openLane) {
      return { lane, kind: 'clear', withCoins: false };
    }

    if (lane === openLane) {
      const roll = rng();
      if (roll < 0.28) {
        return { lane, kind: 'clear', withCoins: false };
      }
      if (roll < 0.58) {
        return { lane, kind: 'coins', withCoins: true };
      }
      if (roll < 0.79) {
        return { lane, kind: 'low-barrier', withCoins: rng() < 0.55 };
      }
      return { lane, kind: 'high-sign', withCoins: rng() < 0.45 };
    }

    const roll = rng();
    if (roll < 0.36 + difficulty * 0.2) {
      const sub = rng();
      if (sub < 0.36) {
        return { lane, kind: 'ramp-train', withCoins: rng() < 0.7 };
      }
      if (!movingTrainSpawned && distanceMeters > 60 && sub < 0.65) {
        movingTrainSpawned = true;
        return { lane, kind: 'moving-train', withCoins: false };
      }
      return { lane, kind: 'train', withCoins: rng() < 0.45 };
    }
    if (roll < 0.64) {
      return { lane, kind: 'low-barrier', withCoins: rng() < 0.4 };
    }
    if (roll < 0.86) {
      return { lane, kind: 'high-sign', withCoins: rng() < 0.3 };
    }
    return { lane, kind: rng() < 0.5 ? 'clear' : 'coins', withCoins: false };
  });

  return { openLane, items };
}

export interface AabbBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export function boxesIntersect(a: AabbBox, b: AabbBox): boolean {
  return (
    a.minX < b.maxX &&
    a.maxX > b.minX &&
    a.minY < b.maxY &&
    a.maxY > b.minY &&
    a.minZ < b.maxZ &&
    a.maxZ > b.minZ
  );
}

export type ObstacleKind = 'low-barrier' | 'high-sign' | 'train' | 'ramp-train';

export interface ObstacleColliderSpec {
  kind: ObstacleKind;
  x: number;
  z: number;
  length: number;
  width: number;
  minY: number;
  maxY: number;
  rampStartZ?: number;
  rampEndZ?: number;
  roofY?: number;
}

export function evaluatePlayerObstacle(
  playerX: number,
  playerY: number,
  playerZ: number,
  isSliding: boolean,
  obs: ObstacleColliderSpec
): { crashed: boolean; floorSupportY: number | null } {
  const playerHeight = isSliding ? PLAYER_SLIDE_HEIGHT : PLAYER_STAND_HEIGHT;
  const pBox: AabbBox = {
    minX: playerX - PLAYER_HALF_WIDTH,
    maxX: playerX + PLAYER_HALF_WIDTH,
    minY: playerY + 0.06,
    maxY: playerY + playerHeight,
    minZ: playerZ - 0.32,
    maxZ: playerZ + 0.32,
  };

  const halfW = obs.width * 0.5;
  const halfL = obs.length * 0.5;

  // Check if player is on a ramp leading to roof
  if (
    obs.kind === 'ramp-train' &&
    obs.rampStartZ !== undefined &&
    obs.rampEndZ !== undefined &&
    obs.roofY !== undefined
  ) {
    if (Math.abs(playerX - obs.x) < halfW + 0.25) {
      // Ramp runs from rampStartZ (closer to player, higher Z) to rampEndZ (overlaps roof, lower Z)
      if (playerZ <= obs.rampStartZ && playerZ >= obs.rampEndZ) {
        const slopeTopZ = obs.z + halfL - 0.1;
        const t =
          (obs.rampStartZ - playerZ) /
          Math.max(0.01, obs.rampStartZ - slopeTopZ);
        const rampSurfaceY = Math.max(0, Math.min(1, t)) * obs.roofY;
        if (playerY >= rampSurfaceY - 1.45) {
          return { crashed: false, floorSupportY: rampSurfaceY };
        }
      }
    }
  }

  const oBox: AabbBox = {
    minX: obs.x - halfW,
    maxX: obs.x + halfW,
    minY: obs.minY,
    maxY: obs.maxY,
    minZ: obs.z - halfL,
    maxZ: obs.z + halfL,
  };

  // Can stand on top of trains / ramp-trains if feet are near or above roof
  if (obs.kind === 'train' || obs.kind === 'ramp-train') {
    const inHoriz =
      pBox.minX < oBox.maxX &&
      pBox.maxX > oBox.minX &&
      pBox.minZ < oBox.maxZ &&
      pBox.maxZ > oBox.minZ;
    const stepUpMargin = obs.kind === 'ramp-train' ? 0.95 : 0.65;
    if (inHoriz && playerY >= obs.maxY - stepUpMargin) {
      return { crashed: false, floorSupportY: obs.maxY };
    }
  }

  const hit = boxesIntersect(pBox, oBox);
  return { crashed: hit, floorSupportY: null };
}

export function validateUsernameFormat(username: string): boolean {
  return /^[a-zA-Z0-9_.-]{3,24}$/.test(username.trim());
}
