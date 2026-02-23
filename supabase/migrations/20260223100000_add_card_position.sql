ALTER TABLE annotation_pins
  ADD COLUMN card_position_x numeric DEFAULT NULL,
  ADD COLUMN card_position_y numeric DEFAULT NULL;
