ALTER TABLE posts ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false;
ALTER TABLE writeups ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false;
ALTER TABLE meetups ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false;
