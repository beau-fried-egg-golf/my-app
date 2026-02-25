-- Add email_verified column to profiles (existing users grandfathered as true)
ALTER TABLE profiles ADD COLUMN email_verified boolean NOT NULL DEFAULT true;

-- Create verification codes table
CREATE TABLE email_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_codes_user_id ON email_verification_codes(user_id);

ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;
