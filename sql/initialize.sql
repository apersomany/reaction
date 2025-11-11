DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS visual;
DROP TABLE IF EXISTS auditory;
DROP TABLE IF EXISTS statistics;

CREATE TABLE user (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  age INTEGER NOT NULL,
  sex TEXT NOT NULL,
  phone_no TEXT
);

CREATE TABLE visual (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user TEXT NOT NULL,
  time INTEGER NOT NULL,
  mean INTEGER NOT NULL,
  data TEXT NOT NULL,
  FOREIGN KEY (user) REFERENCES user(id)
);

CREATE TABLE auditory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user TEXT NOT NULL,
  time INTEGER NOT NULL,
  mean INTEGER NOT NULL,
  data TEXT NOT NULL,
  FOREIGN KEY (user) REFERENCES user(id)
);

CREATE TABLE statistics (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  visual_percentiles TEXT NOT NULL,
  auditory_percentiles TEXT NOT NULL,
  visual_count INTEGER NOT NULL,
  auditory_count INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_visual_user ON visual(user);
CREATE INDEX idx_auditory_user ON auditory(user);
CREATE INDEX idx_visual_mean ON visual(mean);
CREATE INDEX idx_auditory_mean ON auditory(mean);
