-- Add content column to activities for storing reply text
ALTER TABLE activities ADD COLUMN IF NOT EXISTS content text;
