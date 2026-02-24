ALTER TABLE post_replies
  ADD COLUMN parent_id uuid REFERENCES post_replies(id) DEFAULT NULL;

ALTER TABLE writeup_replies
  ADD COLUMN parent_id text REFERENCES writeup_replies(id) DEFAULT NULL;
