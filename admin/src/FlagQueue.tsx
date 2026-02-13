import { useEffect, useState } from 'react';
import { fetchFlaggedContent, republishContent, keepContentHidden } from './storage';
import type { ContentFlag } from './types';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function FlagQueue() {
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlaggedContent().then(f => {
      setFlags(f);
      setLoading(false);
    });
  }, []);

  async function handleRepublish(flag: ContentFlag) {
    if (!window.confirm('Republish this content and clear all flags?')) return;
    await republishContent(flag.content_type, flag.content_id);
    setFlags(prev => prev.filter(f => f.content_id !== flag.content_id));
  }

  async function handleKeepHidden(flag: ContentFlag) {
    if (!window.confirm('Clear flags and keep this content hidden?')) return;
    await keepContentHidden(flag.content_type, flag.content_id);
    setFlags(prev => prev.filter(f => f.content_id !== flag.content_id));
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Flagged Content</h1>

      {flags.length === 0 ? (
        <div className="empty-state">No flagged content</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Preview</th>
                <th>Author</th>
                <th>Flags</th>
                <th>First Flagged</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flags.map(flag => (
                <tr key={`${flag.content_type}:${flag.content_id}`}>
                  <td>
                    <span className="badge" style={{ textTransform: 'capitalize' }}>
                      {flag.content_type}
                    </span>
                  </td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {flag.content_preview}
                  </td>
                  <td>{flag.author_name}</td>
                  <td>
                    <strong style={{ color: (flag.flag_count ?? 0) >= 3 ? '#e74c3c' : undefined }}>
                      {flag.flag_count}
                    </strong>
                  </td>
                  <td>{formatTime(flag.created_at)}</td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-sm" onClick={() => handleRepublish(flag)}>
                        Republish
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleKeepHidden(flag)}>
                        Keep Hidden
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
