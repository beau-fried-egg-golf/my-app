import { useState } from 'react';

interface AnnotationExportProps {
  html: string;
  onClose: () => void;
}

export default function AnnotationExport({ html, onClose }: AnnotationExportProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Copy failed. Please select the text and copy manually.');
    }
  }

  return (
    <div className="confirm-overlay" onClick={onClose}>
      <div className="confirm-dialog" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-title">Export HTML</h3>
        <p className="confirm-text">Paste this into a Webflow HTML Embed block.</p>
        <textarea
          readOnly
          value={html}
          style={{
            width: '100%',
            height: 300,
            fontFamily: 'monospace',
            fontSize: 12,
            padding: 12,
            border: '1px solid #d1d5db',
            borderRadius: 6,
            resize: 'vertical',
            marginBottom: 16,
          }}
        />
        <div className="confirm-actions">
          <button className="btn" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
