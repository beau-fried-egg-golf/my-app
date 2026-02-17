-- Add optional link URL to annotation pins for "Find out more" links
alter table annotation_pins add column link_url text not null default '';
