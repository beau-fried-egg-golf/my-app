-- Hole Annotations feature tables

create table hole_annotations (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  course_name text not null default '',
  hole_number integer not null default 1,
  aerial_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table annotation_pins (
  id uuid primary key default gen_random_uuid(),
  annotation_id uuid not null references hole_annotations(id) on delete cascade,
  position_x numeric not null default 50,
  position_y numeric not null default 50,
  sort_order integer not null default 0,
  headline text not null default '',
  body_text text not null default '',
  created_at timestamptz not null default now()
);

create table pin_photos (
  id uuid primary key default gen_random_uuid(),
  pin_id uuid not null references annotation_pins(id) on delete cascade,
  photo_url text not null,
  sort_order integer not null default 0,
  caption text not null default '',
  created_at timestamptz not null default now()
);

create index idx_annotation_pins_annotation_id on annotation_pins(annotation_id);
create index idx_pin_photos_pin_id on pin_photos(pin_id);
