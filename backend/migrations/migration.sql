-- ============================================================
-- Life OS — Users table (for standalone auth)
-- This runs AFTER migration.sql via docker-entrypoint-initdb.d
-- ============================================================

CREATE TABLE IF NOT EXISTS lifeos_users (
  id            SERIAL      PRIMARY KEY,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  first_name    TEXT        NOT NULL DEFAULT 'User',
  last_name     TEXT        NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON lifeos_users(email);


-- =============================================================================
-- Life OS — Database Migration
-- PostgreSQL (Retool DB)
-- =============================================================================
-- Run this file once against a fresh PostgreSQL database.
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- provides gen_random_uuid()


-- ---------------------------------------------------------------------------
-- 1. goals
--    Hierarchical goals: long_term → monthly → weekly → daily
--    parent_id is self-referential (SET NULL on parent delete)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS goals (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      INTEGER       NOT NULL,
  title        TEXT          NOT NULL,
  description  TEXT          NOT NULL DEFAULT '',
  category     VARCHAR(50)   NOT NULL DEFAULT 'personal',
  progress     SMALLINT      NOT NULL DEFAULT 0,
  deadline     DATE,
  is_completed BOOLEAN       NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  parent_id    UUID          REFERENCES goals(id) ON DELETE SET NULL,
  period_type  VARCHAR(20)   NOT NULL DEFAULT 'long_term',
  deleted_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT goals_progress_range   CHECK (progress >= 0 AND progress <= 100),
  CONSTRAINT goals_period_type_check CHECK (
    period_type IN ('long_term', 'monthly', 'weekly', 'daily')
  )
);

-- Index: fetch active goals for a user (most common query)
CREATE INDEX IF NOT EXISTS idx_goals_user_active
  ON goals(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Index: navigate the parent-child tree
CREATE INDEX IF NOT EXISTS idx_goals_parent
  ON goals(parent_id)
  WHERE parent_id IS NOT NULL;


-- ---------------------------------------------------------------------------
-- 2. habits
--    Habit definitions per user.
--    current_streak / longest_streak are updated on every toggle.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS habits (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        INTEGER     NOT NULL,
  title          TEXT        NOT NULL,
  type           VARCHAR(20) NOT NULL DEFAULT 'positive',
  icon           VARCHAR(10) NOT NULL DEFAULT '🎯',
  category       VARCHAR(50) NOT NULL DEFAULT 'general',
  current_streak INTEGER     NOT NULL DEFAULT 0,
  longest_streak INTEGER     NOT NULL DEFAULT 0,
  is_archived    BOOLEAN     NOT NULL DEFAULT FALSE,
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT habits_type_check CHECK (type IN ('positive', 'negative'))
);

-- Index: fetch active, non-archived habits for a user
CREATE INDEX IF NOT EXISTS idx_habits_user_active
  ON habits(user_id, created_at ASC)
  WHERE deleted_at IS NULL;


-- ---------------------------------------------------------------------------
-- 3. habit_logs
--    One row per (habit, calendar day). UNIQUE ensures no duplicates.
--    ON CONFLICT used for idempotent toggling.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS habit_logs (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id     UUID    NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL,
  log_date     DATE    NOT NULL DEFAULT CURRENT_DATE,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (habit_id, log_date)
);

-- Index: daily habit dashboard (user + date)
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date
  ON habit_logs(user_id, log_date DESC);

-- Index: streak computation per habit
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date
  ON habit_logs(habit_id, log_date DESC);


-- ---------------------------------------------------------------------------
-- 4. journal_entries
--    Free-text daily journal with mood, energy, and tags.
--    Soft-deleted via deleted_at.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS journal_entries (
  id         UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    INTEGER  NOT NULL,
  entry_date DATE     NOT NULL DEFAULT CURRENT_DATE,
  title      TEXT     NOT NULL,
  content    TEXT     NOT NULL,
  mood       SMALLINT NOT NULL DEFAULT 5,
  energy     SMALLINT NOT NULL DEFAULT 5,
  tags       TEXT[]   NOT NULL DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT journal_mood_range   CHECK (mood   >= 1 AND mood   <= 10),
  CONSTRAINT journal_energy_range CHECK (energy >= 1 AND energy <= 10)
);

-- Index: paginated journal feed, newest first
CREATE INDEX IF NOT EXISTS idx_journal_user_active
  ON journal_entries(user_id, entry_date DESC)
  WHERE deleted_at IS NULL;


-- ---------------------------------------------------------------------------
-- 5. day_checkins
--    Morning AND evening check-ins share this table, separated by
--    checkin_type. UNIQUE(user_id, checkin_date, checkin_type) makes
--    ON CONFLICT upserts safe.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS day_checkins (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      INTEGER     NOT NULL,
  checkin_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  checkin_type VARCHAR(20) NOT NULL,

  -- Morning fields
  sleep_hours  SMALLINT,
  energy       SMALLINT,
  mood         SMALLINT,
  focus_text   TEXT,

  -- Evening fields
  rating       SMALLINT,
  wins         TEXT,
  failures     TEXT,
  reasons      TEXT,
  tags         TEXT[]      NOT NULL DEFAULT '{}',

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, checkin_date, checkin_type),

  CONSTRAINT checkins_type_check   CHECK (checkin_type IN ('morning', 'evening')),
  CONSTRAINT checkins_energy_range CHECK (energy IS NULL OR (energy >= 1 AND energy <= 10)),
  CONSTRAINT checkins_mood_range   CHECK (mood   IS NULL OR (mood   >= 1 AND mood   <= 5)),
  CONSTRAINT checkins_rating_range CHECK (rating IS NULL OR (rating >= 1 AND rating <= 10))
);

-- Index: biography calendar and today's checkin queries
CREATE INDEX IF NOT EXISTS idx_checkins_user_date
  ON day_checkins(user_id, checkin_date DESC);


-- =============================================================================
-- Migration complete.
-- Tables created: goals, habits, habit_logs, journal_entries, day_checkins
-- =============================================================================
