import { Course } from '@/types';

export interface CourseMapProps {
  courses: Course[];
  userLocation: { lat: number; lon: number } | null;
  selectedCourse: Course | null;
  onCourseSelect: (course: Course | null) => void;
}

export const DEFAULT_CENTER = { lat: 37.56, lon: -122.15 };
export const DEFAULT_ZOOM = 9;
export const USER_ZOOM = 10;

export function hasFEContent(course: Course): boolean {
  return !!(
    course.fe_hero_image ||
    course.fe_profile_url ||
    course.fe_profile_author ||
    course.fe_egg_rating !== null ||
    course.fe_bang_for_buck ||
    course.fe_profile_date
  );
}
