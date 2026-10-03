export const SCHEMA_VERSION = 1

export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS lifeos_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT 'User',
  last_name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY NOT NULL,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'personal',
  progress INTEGER NOT NULL DEFAULT 0,
  deadline TEXT,
  is_completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  parent_id TEXT,
  node_type TEXT NOT NULL DEFAULT 'goal',
  task_type TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_goals_user_active
  ON goals(user_id, created_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_goals_parent
  ON goals(parent_id)
  WHERE parent_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY NOT NULL,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'positive',
  icon TEXT NOT NULL DEFAULT '🎯',
  category TEXT NOT NULL DEFAULT 'general',
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_habits_user_active
  ON habits(user_id, created_at)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS habit_logs (
  id TEXT PRIMARY KEY NOT NULL,
  habit_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  log_date TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (habit_id, log_date),
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date
  ON habit_logs(user_id, log_date);

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date
  ON habit_logs(habit_id, log_date);

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY NOT NULL,
  user_id INTEGER NOT NULL,
  entry_date TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood INTEGER NOT NULL DEFAULT 5,
  energy INTEGER NOT NULL DEFAULT 5,
  tags_json TEXT NOT NULL DEFAULT '[]',
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_journal_user_active
  ON journal_entries(user_id, entry_date)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS day_checkins (
  id TEXT PRIMARY KEY NOT NULL,
  user_id INTEGER NOT NULL,
  checkin_date TEXT NOT NULL,
  checkin_type TEXT NOT NULL,
  sleep_hours INTEGER,
  energy INTEGER,
  mood INTEGER,
  focus_text TEXT,
  rating INTEGER,
  wins TEXT,
  failures TEXT,
  reasons TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, checkin_date, checkin_type)
);

CREATE INDEX IF NOT EXISTS idx_checkins_user_date
  ON day_checkins(user_id, checkin_date);

CREATE TABLE IF NOT EXISTS user_onboarding_preferences (
  user_id INTEGER PRIMARY KEY NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  profile_first_name TEXT,
  profile_birth_date TEXT,
  profile_timezone TEXT,
  profile_language TEXT,
  motivations_json TEXT NOT NULL DEFAULT '[]',
  life_areas_json TEXT NOT NULL DEFAULT '[]',
  communication_style TEXT,
  criticism_level INTEGER,
  wake_time TEXT,
  sleep_time TEXT,
  yearly_goals_json TEXT NOT NULL DEFAULT '[]',
  build_habits_json TEXT NOT NULL DEFAULT '[]',
  quit_habits_json TEXT NOT NULL DEFAULT '[]',
  completed_at TEXT,
  first_day_flow_completed INTEGER NOT NULL DEFAULT 0,
  first_day_flow_completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES lifeos_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS routines (
  id TEXT PRIMARY KEY NOT NULL,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  recurrence TEXT NOT NULL DEFAULT 'daily',
  weekdays_json TEXT NOT NULL DEFAULT '[]',
  time_slot TEXT NOT NULL DEFAULT 'anytime',
  time_of_day TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_routines_user_active
  ON routines(user_id, created_at)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id INTEGER NOT NULL,
  kind TEXT NOT NULL DEFAULT 'psychologist',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, kind),
  FOREIGN KEY (user_id) REFERENCES lifeos_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES lifeos_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session
  ON ai_chat_messages(session_id, created_at);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`

export const parseJsonArray = <T>(value: string | null | undefined): T[] => {
  if (!value) return []
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed as T[] : []
  } catch {
    return []
  }
}

export const toJsonArray = (value: unknown[]): string => JSON.stringify(value)
