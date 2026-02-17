-- Add annotation_type column: 'scroll' (single hole) or 'interactive' (full course)
alter table hole_annotations add column annotation_type text not null default 'scroll';
