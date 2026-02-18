-- Cancellation requests for meetups within 7 days
CREATE TABLE cancellation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id uuid NOT NULL REFERENCES meetups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  member_id uuid NOT NULL,
  note text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE cancellation_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own" ON cancellation_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own" ON cancellation_requests FOR SELECT USING (auth.uid() = user_id);

-- Waitlist per meetup
CREATE TABLE meetup_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id uuid NOT NULL REFERENCES meetups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(meetup_id, user_id)
);
ALTER TABLE meetup_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can join" ON meetup_waitlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave" ON meetup_waitlist FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read" ON meetup_waitlist FOR SELECT USING (true);
