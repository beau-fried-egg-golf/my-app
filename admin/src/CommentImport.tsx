import { useState } from 'react';
import { importComments } from './storage';

const CSV_COLUMNS = ['article_slug', 'collection_slug', 'member_name', 'body_text', 'created_at', 'parent_index'];

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
    return obj;
  });
}

interface ParsedRow {
  article_slug: string;
  collection_slug: string;
  member_name: string;
  body_text: string;
  created_at?: string;
  parent_index?: number;
  error?: string;
}

function validateRow(row: Record<string, string>): ParsedRow {
  const article_slug = row.article_slug ?? '';
  const collection_slug = row.collection_slug ?? '';
  const member_name = row.member_name ?? '';
  const body_text = row.body_text ?? '';

  if (!article_slug || !collection_slug || !member_name || !body_text) {
    return { article_slug, collection_slug, member_name, body_text, error: 'Missing required fields' };
  }

  if (body_text.length > 5000) {
    return { article_slug, collection_slug, member_name, body_text, error: 'Body exceeds 5000 chars' };
  }

  const parent_index = row.parent_index ? parseInt(row.parent_index, 10) : undefined;

  return {
    article_slug,
    collection_slug,
    member_name,
    body_text,
    created_at: row.created_at || undefined,
    parent_index: parent_index != null && !isNaN(parent_index) ? parent_index : undefined,
  };
}

function escapeCSVField(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CommentImport() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ total: number; errors: string[] } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  function processFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed.map(validateRow));
      setDone(false);
      setResult(null);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    const validRows = rows.filter(r => !r.error);
    if (validRows.length === 0) return;
    setImporting(true);
    const res = await importComments(validRows);
    setResult({ total: validRows.length, errors: res.errors });
    setDone(true);
    setImporting(false);
  }

  function handleDownloadTemplate() {
    const header = CSV_COLUMNS.join(',');
    const example = [
      'my-article-slug',
      'articles',
      'John Smith',
      'Great article!',
      '2026-01-15T12:00:00Z',
      '',
    ].map(escapeCSVField).join(',');
    downloadCSV('comments-import-template.csv', `${header}\n${example}\n`);
  }

  const validCount = rows.filter(r => !r.error).length;
  const errorCount = rows.filter(r => r.error).length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Import Comments</h1>
        <button className="btn" onClick={handleDownloadTemplate}>
          Download Template
        </button>
      </div>

      {done && result ? (
        <div style={{ padding: 24, backgroundColor: '#f9f9f9', borderRadius: 8, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 8px' }}>Import Complete</h3>
          <p>Imported {result.total - result.errors.length} of {result.total} comments.</p>
          {result.errors.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h4 style={{ color: '#c0392b' }}>Errors:</h4>
              <ul style={{ fontSize: 13, color: '#c0392b' }}>
                {result.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
          <button className="btn" style={{ marginTop: 12 }} onClick={() => { setRows([]); setDone(false); setResult(null); }}>
            Import More
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div
          style={{
            border: `2px dashed ${dragActive ? '#1a1a1a' : '#ccc'}`,
            borderRadius: 8,
            padding: 48,
            textAlign: 'center',
            backgroundColor: dragActive ? '#f5f5f5' : '#fafafa',
            transition: 'all 0.15s',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files[0];
            if (file) processFile(file);
          }}
        >
          <p style={{ marginBottom: 16, color: '#666' }}>
            Drop a CSV file here, or click to browse
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
            }}
            style={{ display: 'inline-block' }}
          />
          <p style={{ fontSize: 12, color: '#999', marginTop: 16 }}>
            Expected columns: {CSV_COLUMNS.join(', ')}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14 }}>
              {validCount} valid, {errorCount} errors
            </span>
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={importing || validCount === 0}
            >
              {importing ? 'Importing...' : `Import ${validCount} Comments`}
            </button>
            <button className="btn" onClick={() => setRows([])}>
              Clear
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Status</th>
                  <th>Article</th>
                  <th>Author</th>
                  <th>Content</th>
                  <th>Date</th>
                  <th>Parent</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      {r.error ? (
                        <span className="badge badge-hidden" title={r.error}>Error</span>
                      ) : (
                        <span className="badge badge-visible">Valid</span>
                      )}
                    </td>
                    <td>{r.article_slug}</td>
                    <td>{r.member_name}</td>
                    <td>
                      <span className="truncate" style={{ display: 'inline-block', maxWidth: 200 }}>
                        {r.body_text.length > 60 ? r.body_text.slice(0, 60) + '...' : r.body_text}
                      </span>
                    </td>
                    <td>{r.created_at ?? '-'}</td>
                    <td>{r.parent_index != null ? r.parent_index : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
