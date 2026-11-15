import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNoCoinState,
  tickNoCoin,
  lockNoCoinOnCoinPickup,
  formatNoCoinTime,
  computeSpeedForDistance,
  computeWaveGap,
  computeMovingTrainSpawnZ,
  planNextWave,
  clampLane,
  laneToX,
  LANE_WIDTH,
  LaneIndex,
  evaluatePlayerObstacle,
  validateUsernameFormat,
} from './rules';

test('NoCoinTracker ticks while active and permanently locks on first coin', () => {
  let state = createNoCoinState();
  assert.equal(state.active, true);
  assert.equal(state.elapsedMs, 0);

  state = tickNoCoin(state, 1500);
  state = tickNoCoin(state, 2750);
  assert.equal(state.elapsedMs, 4250);
  assert.equal(formatNoCoinTime(state.elapsedMs), '00:04.2');

  const firstPickup = lockNoCoinOnCoinPickup(state);
  assert.equal(firstPickup.justLocked, true);
  assert.equal(firstPickup.next.active, false);
  assert.equal(firstPickup.next.lockedAtMs, 4250);

  // Further time ticks must NOT advance No Coin elapsedMs once locked
  const afterMoreTime = tickNoCoin(firstPickup.next, 5000);
  assert.equal(afterMoreTime.elapsedMs, 4250);

  // Second coin pickup must not report justLocked again
  const secondPickup = lockNoCoinOnCoinPickup(afterMoreTime);
  assert.equal(secondPickup.justLocked, false);
  assert.equal(secondPickup.next.elapsedMs, 4250);
});

test('formatNoCoinTime renders minutes, seconds, and tenths cleanly', () => {
  assert.equal(formatNoCoinTime(0), '00:00.0');
  assert.equal(formatNoCoinTime(9800), '00:09.8');
  assert.equal(formatNoCoinTime(74240), '01:14.2');
});

test('lane helpers and speed curve behave predictably', () => {
  assert.equal(clampLane(-3), -1);
  assert.equal(clampLane(0), 0);
  assert.equal(clampLane(5), 1);
  assert.equal(laneToX(-1), -LANE_WIDTH);
  assert.equal(laneToX(1), LANE_WIDTH);

  const v0 = computeSpeedForDistance(0);
  const vMid = computeSpeedForDistance(400);
  const vHigh = computeSpeedForDistance(10000);
  assert.ok(v0 >= 16 && v0 <= 18);
  assert.ok(vMid > v0);
  assert.equal(vHigh, 38);
});

test('evaluatePlayerObstacle allows jumping low barriers, sliding under high signs, and surfing train roofs', () => {
  const lowBarrier = {
    kind: 'low-barrier' as const,
    x: 0,
    z: 0,
    length: 0.45,
    width: 2.05,
    minY: 0,
    maxY: 0.92,
  };
  assert.equal(evaluatePlayerObstacle(0, 0, 0, false, lowBarrier).crashed, true);
  assert.equal(evaluatePlayerObstacle(0, 1.25, 0, false, lowBarrier).crashed, false);

  const highSign = {
    kind: 'high-sign' as const,
    x: 0,
    z: 0,
    length: 0.45,
    width: 2.15,
    minY: 1.24,
    maxY: 2.15,
  };
  assert.equal(evaluatePlayerObstacle(0, 0, 0, false, highSign).crashed, true);
  assert.equal(evaluatePlayerObstacle(0, 0, 0, true, highSign).crashed, false);
  assert.equal(evaluatePlayerObstacle(0, 2.25, 0, false, highSign).crashed, false);
  assert.equal(evaluatePlayerObstacle(0, 2.88, 0, false, highSign).crashed, false);

  const train = {
    kind: 'train' as const,
    x: 0,
    z: 0,
    length: 12.8,
    width: 2.38,
    minY: 0,
    maxY: 3.12,
  };
  assert.equal(evaluatePlayerObstacle(0, 0, 0, false, train).crashed, true);
  const onRoof = evaluatePlayerObstacle(0, 3.12, 0, false, train);
  assert.equal(onRoof.crashed, false);
  assert.equal(onRoof.floorSupportY, 3.12);
});

test('evaluatePlayerObstacle supports climbing a ramp-train smoothly onto the roof even at max-dt high speed', () => {
  const trainZ = -10;
  const rampTrain = {
    kind: 'ramp-train' as const,
    x: 0,
    z: trainZ,
    length: 12.8,
    width: 2.38,
    minY: 0,
    maxY: 3.12,
    rampStartZ: trainZ + 12.2,
    rampEndZ: trainZ + 5.6,
    roofY: 3.12,
  };

  // Simulate stepping forward at 38 m/s with dt = 0.05s (dz = 1.9m per frame)
  let playerY = 0;
  for (let offset = 12.5; offset >= -6.0; offset -= 1.9) {
    const obsAtFrame = {
      ...rampTrain,
      z: -offset,
      rampStartZ: -offset + 12.2,
      rampEndZ: -offset + 5.6,
    };
    const res = evaluatePlayerObstacle(0, playerY, 0, false, obsAtFrame);
    assert.equal(
      res.crashed,
      false,
      `Should not crash while climbing/surfing ramp-train at offset=${offset.toFixed(2)}, playerY=${playerY.toFixed(2)}`
    );
    if (res.floorSupportY !== null) {
      playerY = Math.max(playerY, res.floorSupportY);
    }
  }
  assert.ok(playerY >= 3.1, 'Player should have reached the train roof height');
});

test('planNextWave always preserves a reachable passable openLane and respects blocked lanes', () => {
  // Deterministic PRNG
  let seed = 1337;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  let prevOpenLane: LaneIndex | null = 0;
  for (let i = 0; i < 300; i++) {
    const blockedLane = (i % 4 === 0 ? ((i % 3) - 1) : null) as LaneIndex | null;
    const blockedLanes: Record<LaneIndex, boolean> = {
      [-1]: blockedLane === -1,
      [0]: blockedLane === 0,
      [1]: blockedLane === 1,
    };
    const distanceMeters = i * 25;
    const wave = planNextWave({
      distanceMeters,
      prevOpenLane,
      blockedLanes,
      rng,
    });

    assert.equal(blockedLanes[wave.openLane], false, 'openLane must never be a blocked lane');
    if (prevOpenLane !== null) {
      assert.ok(
        Math.abs(wave.openLane - prevOpenLane) <= 1,
        `openLane transition from ${prevOpenLane} to ${wave.openLane} must be reachable`
      );
    }

    const openItem = wave.items.find((it) => it.lane === wave.openLane)!;
    assert.ok(
      openItem.kind !== 'train' &&
        openItem.kind !== 'moving-train' &&
        openItem.kind !== 'ramp-train',
      `openLane item cannot be a train (got ${openItem.kind})`
    );

    const movingCount = wave.items.filter((it) => it.kind === 'moving-train').length;
    assert.ok(movingCount <= 1, 'At most one moving train per wave');
    if (blockedLane !== null) {
      assert.equal(movingCount, 0, 'No new moving train while another lane is blocked');
      const blockedItem = wave.items.find((it) => it.lane === blockedLane)!;
      assert.equal(blockedItem.kind, 'clear', 'Blocked lane must stay clear of extra obstacles');
    }

    prevOpenLane = wave.openLane;
  }
});

test('computeWaveGap and computeMovingTrainSpawnZ keep waves spaced and synchronized', () => {
  const speed = computeSpeedForDistance(5000); // 38 m/s max
  const minGap = computeWaveGap(speed, 0);
  // A ramp-train is ~18.6m total (-6.4 to +12.2); minGap must leave > 25m clear runway
  assert.ok(minGap - 18.6 >= 25, `Expected >=25m clear gap after ramp-train, got ${minGap - 18.6}`);

  const zBase = -145;
  const runnerSpeed = 25;
  const trainSpeedZ = 8;
  const zTrain = computeMovingTrainSpawnZ(zBase, runnerSpeed, trainSpeedZ);
  const arrivalTime = -zBase / runnerSpeed;
  const trainAtArrival = zTrain + (runnerSpeed + trainSpeedZ) * arrivalTime;
  assert.ok(Math.abs(trainAtArrival) < 0.001, `Moving train should arrive at z=0 with zBase, got ${trainAtArrival}`);
});

test('validateUsernameFormat enforces safe player usernames', () => {
  assert.equal(validateUsernameFormat('ab'), false);
  assert.equal(validateUsernameFormat('pedro_dash'), true);
  assert.equal(validateUsernameFormat('invalid user!'), false);
});

