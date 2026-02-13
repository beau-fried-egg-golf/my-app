ALTER TABLE posts ADD COLUMN IF NOT EXISTS link_url text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS link_title text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS link_description text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS link_image text;
