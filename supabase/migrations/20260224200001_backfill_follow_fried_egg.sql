-- Backfill: every existing profile follows The Fried Egg
INSERT INTO follows (follower_id, following_id)
SELECT p.id, fe.id
FROM profiles p
CROSS JOIN (
  SELECT id FROM profiles WHERE LOWER(name) LIKE '%fried egg%' LIMIT 1
) fe
WHERE p.id != fe.id
  AND NOT EXISTS (
    SELECT 1 FROM follows f WHERE f.follower_id = p.id AND f.following_id = fe.id
  );
