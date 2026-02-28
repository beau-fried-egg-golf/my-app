-- ============================================================
-- Comment System Tables
-- ============================================================

-- Collections: controls which Webflow CMS collections have comments enabled
CREATE TABLE IF NOT EXISTS comment_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_slug text UNIQUE NOT NULL,
  collection_name text NOT NULL,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_slug text NOT NULL,
  collection_slug text NOT NULL,
  member_id text NOT NULL,
  member_name text NOT NULL,
  member_avatar_url text,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  body_html text NOT NULL DEFAULT '',
  body_json jsonb,
  body_text text NOT NULL DEFAULT '',
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  is_suspended boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT comments_body_text_length CHECK (char_length(body_text) <= 5000)
);

-- Comment images
CREATE TABLE IF NOT EXISTS comment_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  url text NOT NULL,
  position integer DEFAULT 0 CHECK (position >= 0 AND position <= 4),
  width integer,
  height integer,
  created_at timestamptz DEFAULT now()
);

-- Comment reactions
CREATE TABLE IF NOT EXISTS comment_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  member_id text NOT NULL,
  member_name text NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (comment_id, member_id, emoji)
);

-- Comment edit history
CREATE TABLE IF NOT EXISTS comment_edit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  body_html text NOT NULL,
  body_text text NOT NULL,
  edited_at timestamptz DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_comments_article_slug_created
  ON comments (article_slug, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_member_id
  ON comments (member_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id
  ON comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_collection_slug
  ON comments (collection_slug);
CREATE INDEX IF NOT EXISTS idx_comment_images_comment_id
  ON comment_images (comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id
  ON comment_reactions (comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_edit_history_comment_id
  ON comment_edit_history (comment_id);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE comment_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_edit_history ENABLE ROW LEVEL SECURITY;

-- Public read on all tables
CREATE POLICY "Public read comment_collections"
  ON comment_collections FOR SELECT USING (true);
CREATE POLICY "Public read comments"
  ON comments FOR SELECT USING (true);
CREATE POLICY "Public read comment_images"
  ON comment_images FOR SELECT USING (true);
CREATE POLICY "Public read comment_reactions"
  ON comment_reactions FOR SELECT USING (true);
CREATE POLICY "Public read comment_edit_history"
  ON comment_edit_history FOR SELECT USING (true);

-- Service role handles all writes (edge functions use service role key)
-- No INSERT/UPDATE/DELETE policies needed for anon — edge functions bypass RLS

-- ============================================================
-- Storage Bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('comment-images', 'comment-images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Public read for comment-images bucket
CREATE POLICY "Public read comment images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'comment-images');

-- Service role upload (edge functions handle auth)
CREATE POLICY "Service upload comment images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'comment-images');
