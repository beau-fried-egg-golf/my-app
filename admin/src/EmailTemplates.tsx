import { useEffect, useState } from 'react';
import { getEmailTemplates, updateEmailTemplate, type EmailTemplates as EmailTemplatesType } from './storage';

const TEMPLATE_TYPES = [
  { key: 'confirm' as const, label: 'Confirm Signup', description: 'Sent when a user signs up to confirm their email address.' },
  { key: 'recovery' as const, label: 'Reset Password', description: 'Sent when a user requests a password reset.' },
  { key: 'magic_link' as const, label: 'Magic Link', description: 'Sent when a user requests a magic link login.' },
];

const TEMPLATE_VARIABLES: Record<string, string[]> = {
  confirm: ['{{ .ConfirmationURL }}', '{{ .Email }}', '{{ .SiteURL }}'],
  recovery: ['{{ .ConfirmationURL }}', '{{ .Email }}', '{{ .SiteURL }}'],
  magic_link: ['{{ .ConfirmationURL }}', '{{ .Email }}', '{{ .SiteURL }}'],
};

export default function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplatesType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [editSubjects, setEditSubjects] = useState<Record<string, string>>({});
  const [editContents, setEditContents] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    setError('');
    try {
      const data = await getEmailTemplates();
      setTemplates(data);
      setEditSubjects({
        confirm: data.confirm.subject,
        recovery: data.recovery.subject,
        magic_link: data.magic_link.subject,
      });
      setEditContents({
        confirm: data.confirm.content,
        recovery: data.recovery.content,
        magic_link: data.magic_link.content,
      });
    } catch (e: any) {
      setError(e.message ?? 'Failed to load email templates');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(type: 'confirm' | 'recovery' | 'magic_link') {
    setSaving(type);
    setError('');
    setSuccessMsg('');
    try {
      await updateEmailTemplate(type, editSubjects[type], editContents[type]);
      setSuccessMsg(`${TEMPLATE_TYPES.find(t => t.key === type)?.label} template saved successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save template');
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading email templates...</div>;
  }

  if (error && !templates) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Email Templates</h1>
        <div className="alert alert-error">{error}</div>
        <p style={{ color: '#666', marginTop: 8 }}>
          Make sure <code>VITE_SUPABASE_SERVICE_ROLE_KEY</code> is set in your environment variables.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1>Email Templates</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Manage the email templates sent by Supabase Auth for signup confirmation, password reset, and magic link login.
      </p>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {successMsg && <div className="alert alert-success" style={{ marginBottom: 16 }}>{successMsg}</div>}

      {TEMPLATE_TYPES.map((tmpl) => (
        <div key={tmpl.key} style={{ marginBottom: 32, border: '1px solid #e0e0e0', borderRadius: 8, padding: 20 }}>
          <h2 style={{ marginTop: 0, marginBottom: 4 }}>{tmpl.label}</h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>{tmpl.description}</p>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Subject</label>
            <input
              type="text"
              value={editSubjects[tmpl.key] ?? ''}
              onChange={(e) => setEditSubjects({ ...editSubjects, [tmpl.key]: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Body (HTML)</label>
            <textarea
              value={editContents[tmpl.key] ?? ''}
              onChange={(e) => setEditContents({ ...editContents, [tmpl.key]: e.target.value })}
              rows={12}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13, fontFamily: 'monospace', resize: 'vertical' }}
            />
          </div>

          <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
            Available variables: {TEMPLATE_VARIABLES[tmpl.key].map((v) => (
              <code key={v} style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 3, marginRight: 6 }}>{v}</code>
            ))}
          </div>

          <button
            className="btn btn-primary"
            onClick={() => handleSave(tmpl.key)}
            disabled={saving === tmpl.key}
          >
            {saving === tmpl.key ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      ))}
    </div>
  );
}
