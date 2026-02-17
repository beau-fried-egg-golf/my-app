-- Allow meetup hosts to add other members (not just self-join)
-- Drop existing insert policy and replace with one that also allows hosts
DROP POLICY IF EXISTS "Members can join meetups" ON meetup_members;
DROP POLICY IF EXISTS "Users can join meetups" ON meetup_members;
DROP POLICY IF EXISTS "insert_meetup_members" ON meetup_members;

-- Allow insert if: user is joining themselves OR user is the host of the meetup
CREATE POLICY "Users can join meetups or hosts can add members"
  ON meetup_members
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM meetups
      WHERE meetups.id = meetup_id
      AND meetups.host_id = auth.uid()
    )
  );
