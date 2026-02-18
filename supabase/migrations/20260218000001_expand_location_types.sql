-- Expand location type options
ALTER TABLE experience_locations DROP CONSTRAINT IF EXISTS experience_locations_type_check;
ALTER TABLE experience_locations ADD CONSTRAINT experience_locations_type_check
  CHECK (type IN ('lodge', 'course', 'resort', 'private_club', 'public_course', 'destination'));
