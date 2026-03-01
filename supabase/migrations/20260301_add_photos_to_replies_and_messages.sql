-- Add photos JSONB column to reply and message tables
-- Format: [{ "url": "https://...", "caption": "" }]

ALTER TABLE post_replies ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]';
ALTER TABLE writeup_replies ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]';
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]';
ALTER TABLE meetup_messages ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]';
