export interface Comment {
  id: string;
  article_slug: string;
  collection_slug: string;
  member_id: string;
  member_name: string;
  member_avatar_url: string | null;
  parent_id: string | null;
  body_html: string;
  body_json: unknown;
  body_text: string;
  is_edited: boolean;
  is_deleted: boolean;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
  reactions: CommentReaction[];
  images: CommentImage[];
}

export interface CommentReaction {
  id: string;
  comment_id: string;
  member_id: string;
  member_name: string;
  emoji: string;
  created_at: string;
}

export interface CommentImage {
  id: string;
  comment_id: string;
  storage_path: string;
  url: string;
  position: number;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface CommentsResponse {
  comments: Comment[];
  comments_enabled: boolean;
  total: number;
}

export interface CountsResponse {
  counts: Record<string, number>;
}

export interface MemberstackMember {
  id: string;
  auth: { email: string };
  customFields?: Record<string, string>;
  profileImage?: string;
}
