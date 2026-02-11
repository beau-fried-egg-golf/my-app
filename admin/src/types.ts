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

export interface Activity {
  id: string;
  type: 'writeup' | 'upvote';
  user_id: string;
  writeup_id: string | null;
  course_id: string | null;
  target_user_id: string | null;
  created_at: string;
}
