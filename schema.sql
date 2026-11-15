-- RT Run — Neon PostgreSQL Schema
-- This schema is also initialized automatically on first API request.

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
);

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
);

CREATE INDEX IF NOT EXISTS idx_rt_users_no_coin ON rt_users (best_no_coin_ms DESC, best_score DESC);
