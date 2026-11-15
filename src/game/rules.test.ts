import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNoCoinState,
  tickNoCoin,
  lockNoCoinOnCoinPickup,
  formatNoCoinTime,
  computeSpeedForDistance,
  clampLane,
  laneToX,
  LANE_WIDTH,
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
  assert.equal(vHigh, 40);
});

test('evaluatePlayerObstacle allows jumping low barriers, sliding under high signs, and surfing train roofs', () => {
  const lowBarrier = {
    kind: 'low-barrier' as const,
    x: 0,
    z: 0,
    length: 0.7,
    width: 2.2,
    minY: 0,
    maxY: 1.05,
  };
  assert.equal(evaluatePlayerObstacle(0, 0, 0, false, lowBarrier).crashed, true);
  assert.equal(evaluatePlayerObstacle(0, 1.25, 0, false, lowBarrier).crashed, false);

  const highSign = {
    kind: 'high-sign' as const,
    x: 0,
    z: 0,
    length: 0.6,
    width: 2.4,
    minY: 1.15,
    maxY: 2.7,
  };
  assert.equal(evaluatePlayerObstacle(0, 0, 0, false, highSign).crashed, true);
  assert.equal(evaluatePlayerObstacle(0, 0, 0, true, highSign).crashed, false);

  const train = {
    kind: 'train' as const,
    x: 0,
    z: 0,
    length: 12,
    width: 2.45,
    minY: 0,
    maxY: 3.1,
  };
  assert.equal(evaluatePlayerObstacle(0, 0, 0, false, train).crashed, true);
  const onRoof = evaluatePlayerObstacle(0, 3.1, 0, false, train);
  assert.equal(onRoof.crashed, false);
  assert.equal(onRoof.floorSupportY, 3.1);
});

test('validateUsernameFormat enforces safe player usernames', () => {
  assert.equal(validateUsernameFormat('ab'), false);
  assert.equal(validateUsernameFormat('pedro_dash'), true);
  assert.equal(validateUsernameFormat('invalid user!'), false);
});
