export interface Profile {
  id: string;
  name: string;
  image: string | null;
  location: string;
  handicap: number | null;
  home_course: string;
  favorite_ball: string;
  member_since: string;
  suspended?: boolean;
  dms_disabled?: boolean;
}

export interface Course {
  id: string;
  name: string;
  short_name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_private: boolean;
  holes: number;
  par: number;
  year_established: number;
  description: string;
  latitude: number;
  longitude: number;
  fe_hero_image: string | null;
  fe_profile_url: string | null;
  fe_profile_author: string | null;
  fe_egg_rating: number | null;
  fe_bang_for_buck: boolean;
  fe_profile_date: string | null;
}

export interface Photo {
  id: string;
  writeup_id: string;
  user_id: string;
  url: string;
  caption: string;
  created_at: string;
  hidden: boolean;
}

export interface Writeup {
  id: string;
  user_id: string;
  course_id: string;
  title: string;
  content: string;
  created_at: string;
  hidden: boolean;
  photos?: Photo[];
  upvote_count?: number;
}

export interface PostPhoto {
  id: string;
  post_id: string;
  user_id: string;
  url: string;
  caption: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  hidden: boolean;
  photos: PostPhoto[];
  reaction_count: number;
  reply_count: number;
  author_name?: string;
  link_url?: string | null;
  link_title?: string | null;
  link_description?: string | null;
  link_image?: string | null;
}

export interface PostReply {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

export interface WriteupReply {
  id: string;
  writeup_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  user1_name?: string;
  user2_name?: string;
  message_count: number;
  last_message?: string;
  last_message_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

export interface Meetup {
  id: string;
  name: string;
  description: string;
  host_id: string;
  course_id: string | null;
  location_name: string;
  meetup_date: string;
  cost: string;
  total_slots: number;
  host_takes_slot: boolean;
  image: string | null;
  is_fe_coordinated: boolean;
  stripe_payment_url: string | null;
  created_at: string;
  updated_at: string;
  host_name?: string;
  member_count?: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  invited_by: string | null;
  created_at: string;
}

export interface MeetupMember {
  id: string;
  meetup_id: string;
  user_id: string;
  joined_at: string;
  payment_status: string;
  stripe_payment_intent_id?: string;
  member_name?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  home_course_id: string | null;
  location_name: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  member_count?: number;
}

export interface Activity {
  id: string;
  type: 'writeup' | 'upvote' | 'played' | 'post';
  user_id: string;
  writeup_id: string | null;
  post_id?: string | null;
  course_id: string | null;
  target_user_id: string | null;
  created_at: string;
}

export interface ContentFlag {
  id: string;
  user_id: string;
  content_type: 'post' | 'writeup' | 'course';
  content_id: string;
  created_at: string;
  flag_count?: number;
  content_preview?: string;
  author_name?: string;
  reason?: string;
  course_name?: string;
}
