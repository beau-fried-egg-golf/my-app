import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses, saveCourses } from './storage';
import type { Course } from './types';

const CSV_COLUMNS = [
  'id', 'name', 'short_name', 'address', 'city', 'state', 'postal_code', 'country',
  'is_private', 'holes', 'par', 'year_established', 'description', 'latitude', 'longitude',
] as const;

const TEMPLATE_EXAMPLE = [
  '', 'Pine Valley Golf Club', 'Pine Valley', '1 Pine Valley Dr', 'Pine Valley', 'NJ', '08021', 'US',
  'true', '18', '70', '1913', 'A legendary course in the Pine Barrens of New Jersey.', '39.7879', '-74.9668',
];

type RowStatus = 'new' | 'update' | 'error';

interface ParsedRow {
  data: Record<string, string>;
  course: Course | null;
  status: RowStatus;
  error?: string;
}

function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

function parseBool(val: string): boolean {
  const v = val.toLowerCase().trim();
  return v === 'true' || v === 'yes' || v === '1';
}

function validateRow(data: Record<string, string>): { course: Course | null; error?: string } {
  const name = data.name?.trim();
  if (!name) {
    return { course: null, error: 'Name is required' };
  }

  const id = data.id?.trim() || generateId(name);
  if (!id) {
    return { course: null, error: 'Could not generate ID from name' };
  }

  const course: Course = {
    id,
    name,
    short_name: data.short_name?.trim() || '',
    address: data.address?.trim() || '',
    city: data.city?.trim() || '',
    state: data.state?.trim() || '',
    postal_code: data.postal_code?.trim() || '',
    country: data.country?.trim() || '',
    is_private: parseBool(data.is_private || ''),
    holes: parseInt(data.holes) || 18,
    par: parseInt(data.par) || 72,
    year_established: parseInt(data.year_established) || new Date().getFullYear(),
    description: data.description?.trim() || '',
    latitude: parseFloat(data.latitude) || 0,
    longitude: parseFloat(data.longitude) || 0,
    fe_hero_image: null,
    fe_profile_url: null,
    fe_profile_author: null,
    fe_egg_rating: null,
    fe_bang_for_buck: false,
    fe_profile_date: null,
  };

  return { course };
}

function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function coursesToCSV(courses: Course[]): string {
  const header = CSV_COLUMNS.join(',');
  const rows = courses.map((c) =>
    CSV_COLUMNS.map((col) => {
      const val = c[col as keyof Course];
      return escapeCSVField(String(val ?? ''));
    }).join(',')
  );
  return [header, ...rows].join('\n');
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CourseImport() {
  const [existingCourses, setExistingCourses] = useState<Course[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCourses().then(setExistingCourses);
  }, []);

  const existingIds = new Set(existingCourses.map((c) => c.id));

  const processFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const rawRows = parseCSV(text);
        const parsed: ParsedRow[] = rawRows.map((data) => {
          const { course, error } = validateRow(data);
          if (error || !course) {
            return { data, course: null, status: 'error' as const, error };
          }
          const status: RowStatus = existingIds.has(course.id) ? 'update' : 'new';
          return { data, course, status };
        });
        setRows(parsed);
        setDone(false);
      };
      reader.readAsText(file);
    },
    [existingIds]
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  async function handleImport() {
    const valid = rows.filter((r) => r.course !== null);
    if (valid.length === 0) return;

    setImporting(true);
    await saveCourses(valid.map((r) => r.course!));
    setImporting(false);
    setImportedCount(valid.length);
    setDone(true);
    // Refresh existing courses so re-upload shows "update"
    const refreshed = await getCourses();
    setExistingCourses(refreshed);
  }

  function handleDownloadTemplate() {
    const header = CSV_COLUMNS.join(',');
    const example = TEMPLATE_EXAMPLE.map(escapeCSVField).join(',');
    downloadCSV(`${header}\n${example}`, 'courses_template.csv');
  }

  async function handleExport() {
    const courses = await getCourses();
    downloadCSV(coursesToCSV(courses), 'courses_export.csv');
  }

  const newCount = rows.filter((r) => r.status === 'new').length;
  const updateCount = rows.filter((r) => r.status === 'update').length;
  const errorCount = rows.filter((r) => r.status === 'error').length;
  const validCount = newCount + updateCount;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Import Courses</h1>
        <div className="btn-group">
          <button className="btn" onClick={handleDownloadTemplate}>Download Template</button>
          <button className="btn" onClick={handleExport}>Export Courses</button>
        </div>
      </div>

      {done ? (
        <div className="form-container" style={{ textAlign: 'center', padding: 48 }}>
          <h2 style={{ marginBottom: 8 }}>Import Complete</h2>
          <p style={{ color: '#555', marginBottom: 20 }}>
            Successfully imported {importedCount} course{importedCount !== 1 ? 's' : ''}.
          </p>
          <div className="btn-group" style={{ justifyContent: 'center' }}>
            <Link to="/courses" className="btn btn-primary">View Courses</Link>
            <button className="btn" onClick={() => { setRows([]); setDone(false); if (fileRef.current) fileRef.current.value = ''; }}>
              Import More
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className={`dropzone${dragActive ? ' dropzone-active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
              Drop a CSV file here or click to browse
            </p>
            <p style={{ fontSize: 13, color: '#888' }}>
              Columns: {CSV_COLUMNS.join(', ')}
            </p>
          </div>

          {rows.length > 0 && (
            <>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', margin: '16px 0' }}>
                <span className="badge badge-new">{newCount} new</span>
                <span className="badge badge-update">{updateCount} update{updateCount !== 1 ? 's' : ''}</span>
                {errorCount > 0 && <span className="badge badge-error">{errorCount} error{errorCount !== 1 ? 's' : ''}</span>}
                <div style={{ flex: 1 }} />
                <button
                  className="btn btn-primary"
                  onClick={handleImport}
                  disabled={validCount === 0 || importing}
                >
                  {importing ? 'Importing...' : `Import ${validCount} Course${validCount !== 1 ? 's' : ''}`}
                </button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Name</th>
                      <th>City / State</th>
                      <th>Holes</th>
                      <th>Par</th>
                      <th>ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className={row.status === 'error' ? 'row-error' : undefined}>
                        <td>
                          <span className={`badge badge-${row.status}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <strong>{row.course?.name || row.data.name || '(empty)'}</strong>
                          {row.error && <div style={{ color: '#dc2626', fontSize: 12 }}>{row.error}</div>}
                        </td>
                        <td>
                          {row.course
                            ? `${row.course.city}${row.course.state ? `, ${row.course.state}` : ''}`
                            : row.data.city || ''}
                        </td>
                        <td>{row.course?.holes ?? row.data.holes ?? ''}</td>
                        <td>{row.course?.par ?? row.data.par ?? ''}</td>
                        <td style={{ fontSize: 12, color: '#888' }}>{row.course?.id || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
