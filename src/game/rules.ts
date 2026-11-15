export type LaneIndex = -1 | 0 | 1;

export const LANE_WIDTH = 3.1;
export const PLAYER_HALF_WIDTH = 0.42;
export const PLAYER_STAND_HEIGHT = 1.75;
export const PLAYER_SLIDE_HEIGHT = 0.82;
export const GRAVITY = -36;
export const JUMP_VELOCITY = 13.8;
export const FAST_FALL_VELOCITY = -24;

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
  // Smooth ramp: 17 m/s start, accelerating fairly up to 40 m/s
  return Math.min(40, 17 + Math.sqrt(d) * 0.48);
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
    minY: playerY + 0.05,
    maxY: playerY + playerHeight,
    minZ: playerZ - 0.35,
    maxZ: playerZ + 0.35,
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
    if (Math.abs(playerX - obs.x) < halfW + 0.2) {
      // Ramp runs from rampStartZ (closer to player, higher Z) to rampEndZ (train front, lower Z)
      if (playerZ <= obs.rampStartZ && playerZ >= obs.rampEndZ) {
        const t =
          (obs.rampStartZ - playerZ) /
          Math.max(0.01, obs.rampStartZ - obs.rampEndZ);
        const rampSurfaceY = Math.max(0, Math.min(1, t)) * obs.roofY;
        if (playerY >= rampSurfaceY - 0.75) {
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
    if (inHoriz && playerY >= obs.maxY - 0.55) {
      return { crashed: false, floorSupportY: obs.maxY };
    }
  }

  const hit = boxesIntersect(pBox, oBox);
  return { crashed: hit, floorSupportY: null };
}

export function validateUsernameFormat(username: string): boolean {
  return /^[a-zA-Z0-9_.-]{3,24}$/.test(username.trim());
}
