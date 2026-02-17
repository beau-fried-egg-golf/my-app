alter table annotation_pins add column scroll_direction text not null default 'bottom';
alter table hole_annotations drop column scroll_direction;
