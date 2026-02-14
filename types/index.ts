export interface Profile {
  id: string; // uuid from auth.users
  name: string;
  image: string | null;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  handicap: number | null;
  home_course_id: string | null;
  favorite_ball: string;
  member_since: string;
  suspended?: boolean;
  dms_disabled?: boolean;
  expo_push_token?: string | null;
  push_dm_enabled?: boolean;
  push_notifications_enabled?: boolean;
  push_nearby_enabled?: boolean;
  push_nearby_radius_miles?: number;
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
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  handicap: number | null;
  homeCourseId: string | null;
  favoriteBall: string;
  memberSince: string;
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
    state: c.state,
    postalCode: c.postal_code,
    country: c.country,
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
  reactions: Record<string, number>;
  user_reactions: string[];
  reaction_count?: number;
  reply_count: number;
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
  hidden: boolean;
  photos: PostPhoto[];
  reactions: Record<string, number>;
  user_reactions: string[];
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

export interface Activity {
  id: string;
  type: 'writeup' | 'upvote' | 'played' | 'post' | 'group_created' | 'meetup_created' | 'meetup_signup' | 'post_reply' | 'writeup_reply';
  user_id: string;
  writeup_id: string | null;
  post_id?: string | null;
  course_id: string | null;
  target_user_id: string | null;
  group_id?: string | null;
  meetup_id?: string | null;
  created_at: string;
  // Joined fields for display
  user_name?: string;
  writeup_title?: string;
  course_name?: string;
  target_user_name?: string;
  post_content?: string;
  group_name?: string;
  meetup_name?: string;
}

export function profileToUser(p: Profile): User {
  return {
    id: p.id,
    name: p.name,
    image: p.image,
    streetAddress: p.street_address,
    city: p.city,
    state: p.state,
    zip: p.zip,
    handicap: p.handicap,
    homeCourseId: p.home_course_id,
    favoriteBall: p.favorite_ball,
    memberSince: p.member_since,
  };
}

export interface Group {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  home_course_id: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  home_course_name?: string;
  member_count?: number;
  is_member?: boolean;
  // Internal fields for conversation list
  _last_message?: string;
  _last_message_at?: string;
  _has_unread?: boolean;
  _member_last_read_at?: string | null;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'creator' | 'admin' | 'member';
  last_read_at: string | null;
  joined_at: string;
  user_name?: string;
  user_image?: string | null;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  sender_image?: string | null;
}

export interface ConversationListItem {
  id: string;
  type: 'dm' | 'group' | 'meetup';
  name: string;
  image: string | null;
  last_message?: string;
  last_message_at?: string;
  unread: boolean;
  other_user_id?: string;
  group_id?: string;
  meetup_id?: string;
  member_count?: number;
}

export interface Meetup {
  id: string;
  name: string;
  description: string;
  host_id: string | null;
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
  is_member?: boolean;
  _last_message?: string;
  _last_message_at?: string;
  _has_unread?: boolean;
  _member_last_read_at?: string | null;
}

export interface MeetupMember {
  id: string;
  meetup_id: string;
  user_id: string;
  last_read_at: string | null;
  joined_at: string;
  payment_status?: string;
  stripe_payment_intent_id?: string;
  user_name?: string;
  user_image?: string | null;
}

export interface MeetupMessage {
  id: string;
  meetup_id: string;
  user_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  sender_image?: string | null;
}

export type NotificationType = 'upvote' | 'meetup_signup' | 'group_join' | 'meetup_reminder_7d' | 'meetup_reminder_1d' | 'post_reply' | 'writeup_reply';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  actor_id: string | null;
  writeup_id: string | null;
  post_id: string | null;
  meetup_id: string | null;
  group_id: string | null;
  is_read: boolean;
  created_at: string;
  // Enriched
  actor_name?: string;
  actor_image?: string | null;
  writeup_title?: string;
  post_content?: string;
  course_name?: string;
  meetup_name?: string;
  meetup_date?: string;
  group_name?: string;
}

export function userToProfile(u: User): Omit<Profile, 'id'> {
  return {
    name: u.name,
    image: u.image,
    street_address: u.streetAddress,
    city: u.city,
    state: u.state,
    zip: u.zip,
    handicap: u.handicap,
    home_course_id: u.homeCourseId,
    favorite_ball: u.favoriteBall,
    member_since: u.memberSince,
  };
}
