ALTER TABLE post_replies
  ADD COLUMN is_edited boolean DEFAULT false,
  ADD COLUMN is_deleted boolean DEFAULT false;

ALTER TABLE writeup_replies
  ADD COLUMN is_edited boolean DEFAULT false,
  ADD COLUMN is_deleted boolean DEFAULT false;

-- RLS: allow users to update their own replies
CREATE POLICY "Users can update own post replies"
  ON post_replies FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can update own writeup replies"
  ON writeup_replies FOR UPDATE USING (user_id = auth.uid());
