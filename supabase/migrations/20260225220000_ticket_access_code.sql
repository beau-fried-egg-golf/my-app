-- Add access code (password) support to ticket types
-- Allows gating ticket types behind a code for member-only or early access tickets

ALTER TABLE ticket_types
  ADD COLUMN access_code text DEFAULT NULL;
