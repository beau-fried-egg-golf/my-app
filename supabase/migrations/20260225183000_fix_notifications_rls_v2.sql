-- Drop all existing notification policies
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON notifications;
DROP POLICY IF EXISTS "Enable read access for users" ON notifications;
DROP POLICY IF EXISTS "Enable update for users" ON notifications;

-- Recreate with public role (covers both anon and authenticated)
CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "notifications_select"
  ON notifications FOR SELECT
  USING (true);

CREATE POLICY "notifications_update"
  ON notifications FOR UPDATE
  USING (true)
  WITH CHECK (true);
