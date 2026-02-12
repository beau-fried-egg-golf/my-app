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
  photos: PostPhoto[];
  reaction_count: number;
  reply_count: number;
  author_name?: string;
}

export interface PostReply {
  id: string;
  post_id: string;
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
