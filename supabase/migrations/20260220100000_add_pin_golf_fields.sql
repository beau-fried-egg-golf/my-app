-- Add golf-specific fields to annotation_pins for interactive annotations
ALTER TABLE annotation_pins
  ADD COLUMN par text NOT NULL DEFAULT '',
  ADD COLUMN yardage text NOT NULL DEFAULT '',
  ADD COLUMN handicap text NOT NULL DEFAULT '';
