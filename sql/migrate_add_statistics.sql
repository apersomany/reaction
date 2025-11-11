-- Migration: Add statistics table and indexes
-- Safe to run on existing database

-- Create statistics table if it doesn't exist
CREATE TABLE IF NOT EXISTS statistics (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  visual_percentiles TEXT NOT NULL,
  auditory_percentiles TEXT NOT NULL,
  visual_count INTEGER NOT NULL,
  auditory_count INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_visual_mean ON visual(mean);
CREATE INDEX IF NOT EXISTS idx_auditory_mean ON auditory(mean);
