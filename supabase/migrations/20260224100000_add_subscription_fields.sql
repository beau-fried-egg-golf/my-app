-- Add subscription/membership fields to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS memberstack_id TEXT;

-- Index for webhook lookups by Stripe customer ID
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Backfill: all existing users are paid members
UPDATE profiles SET subscription_tier = 'standard' WHERE subscription_tier = 'free';
