export interface Profile {
  id: string; // uuid from auth.users
  name: string;
  image: string | null;
  location: string;
  handicap: number | null;
  home_course: string;
  favorite_ball: string;
  member_since: string;
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

export interface Activity {
  id: string;
  type: 'writeup' | 'upvote';
  user_id: string;
  writeup_id: string | null;
  course_id: string | null;
  target_user_id: string | null;
  created_at: string;
  // Joined fields for display
  user_name?: string;
  writeup_title?: string;
  course_name?: string;
  target_user_name?: string;
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
