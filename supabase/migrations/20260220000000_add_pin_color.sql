-- Add pin_color column to hole_annotations for interactive pin styling
ALTER TABLE hole_annotations
  ADD COLUMN pin_color text NOT NULL DEFAULT 'black';
