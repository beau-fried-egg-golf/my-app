-- Allow mobile app users (authenticated via JWT) to insert reservation_items
-- and reservation_tee_times for their own reservations.

CREATE POLICY "Users can insert own reservation items" ON reservation_items
  FOR INSERT WITH CHECK (
    reservation_id IN (SELECT id FROM reservations WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own reservation tee times" ON reservation_tee_times
  FOR INSERT WITH CHECK (
    reservation_id IN (SELECT id FROM reservations WHERE user_id = auth.uid())
  );

-- Allow all authenticated users to read reservation_tee_times for availability counting.
-- The existing policy only lets users read their own rows, but checkTeeTimeAvailability
-- needs to count ALL bookings per slot to show correct availability.
CREATE POLICY "Authenticated users can read all reservation tee times" ON reservation_tee_times
  FOR SELECT USING (auth.uid() IS NOT NULL);
