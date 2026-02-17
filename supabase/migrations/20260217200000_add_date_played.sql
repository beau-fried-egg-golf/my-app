-- Add nullable date_played column to courses_played
ALTER TABLE courses_played ADD COLUMN IF NOT EXISTS date_played date;

-- Backfill existing rows from created_at
UPDATE courses_played SET date_played = created_at::date WHERE date_played IS NULL;
