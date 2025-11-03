-- Visual reaction test results
CREATE TABLE IF NOT EXISTS visual (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user TEXT NOT NULL,
  time INTEGER NOT NULL,  -- Unix timestamp in milliseconds
  lightness REAL NOT NULL,
  chroma REAL NOT NULL,
  hue REAL NOT NULL,
  value REAL NOT NULL  -- Reaction time in milliseconds
);

-- Auditory reaction test results
CREATE TABLE IF NOT EXISTS auditory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user TEXT NOT NULL,
  time INTEGER NOT NULL,
  frequency REAL NOT NULL,
  value REAL NOT NULL  -- Reaction time in milliseconds
);

-- Indexes for efficient queries
CREATE INDEX idx_visual_user ON visual(user);
CREATE INDEX idx_auditory_user ON auditory(user);
