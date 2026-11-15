import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  verifyAdminPassword,
} from './auth.js';

test('hashPassword and verifyPassword use salted scrypt securely', () => {
  const hash1 = hashPassword('minhaSenha123');
  const hash2 = hashPassword('minhaSenha123');
  assert.notEqual(hash1, hash2); // unique salt
  assert.equal(verifyPassword('minhaSenha123', hash1), true);
  assert.equal(verifyPassword('errada', hash1), false);
});

test('signToken and verifyToken validate HMAC signature and expiration', () => {
  const token = signToken({ sub: 42, role: 'player', username: 'corredor' }, 60_000);
  const decoded = verifyToken(token);
  assert.ok(decoded);
  assert.equal(decoded.sub, 42);
  assert.equal(decoded.role, 'player');
  assert.equal(verifyToken(`${token}tampered`), null);
});

test('verifyAdminPassword rejects invalid inputs and supports ADMIN_SECRET override', () => {
  assert.equal(verifyAdminPassword('wrong-pass'), false);
  assert.equal(verifyAdminPassword(''), false);
});
