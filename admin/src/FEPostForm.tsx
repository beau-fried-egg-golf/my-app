import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFEPost } from './storage';

const FE_USER_ID = '8c6e1f22-dc8d-454d-a617-b392541536fb';

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  return match?.[1] ?? null;
}

function detectPlatform(url: string): string {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube';
    if (host.includes('twitter.com') || host.includes('x.com')) return 'X';
    if (host.includes('instagram.com')) return 'Instagram';
    return host;
  } catch {
    return '';
  }
}

async function fetchLinkMeta(url: string): Promise<{ title: string; description: string; image: string }> {
  // 1. Try edge function (handles Twitter/X, Instagram, and any site with OG tags)
  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-link-meta`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ url }),
      },
    );
    if (res.ok) {
      const data = await res.json();
      if (data.title || data.image) {
        return { title: data.title ?? '', description: data.description ?? '', image: data.image ?? '' };
      }
    }
  } catch {
    // fall through
  }

  // 2. Fall back to noembed (rich YouTube metadata: author name, provider)
  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    if (data.title && !data.error) {
      return {
        title: data.title,
        description: data.author_name ? `by ${data.author_name} on ${data.provider_name ?? ''}`.trim() : '',
        image: data.thumbnail_url ?? '',
      };
    }
  } catch {
    // fall through
  }

  // 3. Fallback for YouTube specifically
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return {
      title: '',
      description: '',
      image: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
    };
  }
  return { title: '', description: '', image: '' };
}

export default function FEPostForm() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [linkImage, setLinkImage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  const platform = linkUrl ? detectPlatform(linkUrl) : '';

  async function handleFetchPreview() {
    if (!linkUrl.trim()) return;
    setFetching(true);
    setError('');
    try {
      const meta = await fetchLinkMeta(linkUrl.trim());
      if (meta.title) setLinkTitle(meta.title);
      if (meta.description) setLinkDescription(meta.description);
      if (meta.image) setLinkImage(meta.image);
      if (!meta.title && !meta.image) {
        setError('Could not fetch preview data for this URL. Fill in fields manually.');
      }
    } catch {
      setError('Failed to fetch preview. Fill in fields manually.');
    } finally {
      setFetching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      await createFEPost({
        user_id: FE_USER_ID,
        content: content.trim(),
        link_url: linkUrl.trim(),
        link_title: linkTitle.trim(),
        link_description: linkDescription.trim(),
        link_image: linkImage.trim(),
      });
      navigate('/posts');
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      console.error('Failed to create FE post', err);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>
        Create FE Post
      </h1>

      <form className="form-container" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Caption</label>
          <textarea
            className="form-input form-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a caption for the post..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label className="form-label">URL *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-input"
              style={{ flex: 1 }}
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              required
            />
            <button
              type="button"
              className="btn"
              onClick={handleFetchPreview}
              disabled={fetching || !linkUrl.trim()}
              style={{ whiteSpace: 'nowrap' }}
            >
              {fetching ? 'Fetching...' : 'Fetch Preview'}
            </button>
          </div>
          {platform && (
            <span
              style={{
                display: 'inline-block',
                marginTop: 6,
                padding: '2px 8px',
                fontSize: 12,
                borderRadius: 4,
                backgroundColor: '#f0f0f0',
                color: '#333',
              }}
            >
              {platform}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            className="form-input"
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            placeholder="Link title"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-input form-textarea"
            value={linkDescription}
            onChange={(e) => setLinkDescription(e.target.value)}
            placeholder="Brief description of the linked content"
            rows={2}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Image URL</label>
          <input
            className="form-input"
            value={linkImage}
            onChange={(e) => setLinkImage(e.target.value)}
            placeholder="https://..."
          />
          {linkImage && (
            <img
              src={linkImage}
              alt="Preview"
              style={{
                marginTop: 8,
                maxWidth: 320,
                maxHeight: 180,
                borderRadius: 6,
                objectFit: 'cover',
                border: '1px solid #ddd',
              }}
            />
          )}
        </div>

        {error && (
          <div style={{ padding: 12, backgroundColor: '#fee', border: '1px solid #c00', borderRadius: 6, color: '#c00', fontSize: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !linkUrl.trim()}
          >
            {submitting ? 'Creating...' : 'Create Post'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => navigate('/posts')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
