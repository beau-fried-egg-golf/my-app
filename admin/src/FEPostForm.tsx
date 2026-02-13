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

export default function FEPostForm() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [linkImage, setLinkImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const platform = linkUrl ? detectPlatform(linkUrl) : '';

  function handleUrlChange(url: string) {
    setLinkUrl(url);
    const ytId = extractYouTubeId(url);
    if (ytId) {
      setLinkImage(`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    setSubmitting(true);
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
    } catch (err) {
      console.error('Failed to create FE post', err);
      alert('Failed to create post. Check console for details.');
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
          <input
            className="form-input"
            value={linkUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://..."
            required
          />
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
