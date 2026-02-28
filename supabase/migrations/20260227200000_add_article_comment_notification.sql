-- Add article_comment to the notifications type check constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'upvote',
    'meetup_signup',
    'group_join',
    'meetup_reminder_7d',
    'meetup_reminder_1d',
    'post_reply',
    'writeup_reply',
    'waitlist_spot_available',
    'cancellation_approved',
    'cancellation_denied',
    'fe_content',
    'article_comment'
  ));

-- Add article_slug column to notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS article_slug text;

-- Add article_comment to activities type check (if constrained)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'activities' AND constraint_type = 'CHECK'
    AND constraint_name = 'activities_type_check'
  ) THEN
    ALTER TABLE activities DROP CONSTRAINT activities_type_check;
    ALTER TABLE activities ADD CONSTRAINT activities_type_check
      CHECK (type IN (
        'writeup', 'upvote', 'played', 'post',
        'group_created', 'meetup_created', 'meetup_signup',
        'post_reply', 'writeup_reply',
        'article_comment'
      ));
  END IF;
END $$;

-- Add push preference for article comments
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_article_comments_enabled boolean DEFAULT true;
