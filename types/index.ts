export interface Profile {
  id: string; // uuid from auth.users
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

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  user1_last_read_at?: string | null;
  user2_last_read_at?: string | null;
  other_user_name?: string;
  other_user_image?: string | null;
  last_message?: string;
  last_message_at?: string;
  unread?: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface UserBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

// Camel-case alias used in UI components
export interface User {
  id: string;
  name: string;
  image: string | null;
  location: string;
  handicap: number | null;
  homeCourse: string;
  favoriteBall: string;
  memberSince: string;
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
  fe_egg_rating: number | null;  // 0-3, null = unrated
  fe_bang_for_buck: boolean;
  fe_profile_date: string | null;
}

// Camel-case alias used in some UI components
export function courseToUI(c: Course) {
  return {
    id: c.id,
    name: c.name,
    shortName: c.short_name,
    address: c.address,
    city: c.city,
    isPrivate: c.is_private,
    holes: c.holes,
    par: c.par,
    yearEstablished: c.year_established,
    description: c.description,
    latitude: c.latitude,
    longitude: c.longitude,
    feHeroImage: c.fe_hero_image,
    feProfileUrl: c.fe_profile_url,
    feProfileAuthor: c.fe_profile_author,
    feEggRating: c.fe_egg_rating,
    feBangForBuck: c.fe_bang_for_buck,
    feProfileDate: c.fe_profile_date,
  };
}

export type UICourse = ReturnType<typeof courseToUI>;

export interface Photo {
  id: string;
  writeup_id: string;
  user_id: string;
  url: string;
  caption: string;
  created_at: string;
  hidden: boolean;
  upvote_count?: number;
  user_has_upvoted?: boolean;
}

export interface Writeup {
  id: string;
  user_id: string;
  course_id: string;
  title: string;
  content: string;
  created_at: string;
  hidden: boolean;
  photos: Photo[];
  upvote_count?: number;
  user_has_upvoted?: boolean;
  author_name?: string;
}

export interface CoursePlayed {
  id: string;
  user_id: string;
  course_id: string;
  created_at: string;
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
  reactions: Record<string, number>;
  user_reactions: string[];
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

export interface Activity {
  id: string;
  type: 'writeup' | 'upvote' | 'played' | 'post';
  user_id: string;
  writeup_id: string | null;
  post_id?: string | null;
  course_id: string | null;
  target_user_id: string | null;
  created_at: string;
  // Joined fields for display
  user_name?: string;
  writeup_title?: string;
  course_name?: string;
  target_user_name?: string;
  post_content?: string;
}

export function profileToUser(p: Profile): User {
  return {
    id: p.id,
    name: p.name,
    image: p.image,
    location: p.location,
    handicap: p.handicap,
    homeCourse: p.home_course,
    favoriteBall: p.favorite_ball,
    memberSince: p.member_since,
  };
}

export function userToProfile(u: User): Omit<Profile, 'id'> {
  return {
    name: u.name,
    image: u.image,
    location: u.location,
    handicap: u.handicap,
    home_course: u.homeCourse,
    favorite_ball: u.favoriteBall,
    member_since: u.memberSince,
  };
}
