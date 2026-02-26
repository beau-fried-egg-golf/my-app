-- Add fe_content to the notifications type check constraint
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
    'fe_content'
  ));
