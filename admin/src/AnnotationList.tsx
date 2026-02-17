import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAnnotations, createAnnotation, deleteAnnotation, duplicateAnnotation } from './storage';
import type { HoleAnnotation } from './types';
import { generateAnnotationHTML } from './generateAnnotationHTML';
import AnnotationPreview from './AnnotationPreview';
import AnnotationExport from './AnnotationExport';
import { getAnnotation } from './storage';

export default function AnnotationList() {
  const [annotations, setAnnotations] = useState<HoleAnnotation[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [exportHtml, setExportHtml] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getAnnotations().then(setAnnotations);
  }, []);

  async function handleCreate(type: 'scroll' | 'interactive') {
    const title = type === 'scroll' ? 'Untitled Hole' : 'Untitled Course';
    const id = await createAnnotation({ title, annotation_type: type });
    navigate(`/hole-annotations/${id}/edit`);
  }

  async function handleDelete(id: string) {
    await deleteAnnotation(id);
    setAnnotations(prev => prev.filter(a => a.id !== id));
    setDeleteId(null);
  }

  async function handleDuplicate(id: string) {
    const newId = await duplicateAnnotation(id);
    if (newId) {
      const refreshed = await getAnnotations();
      setAnnotations(refreshed);
    }
  }

  async function handlePreview(id: string) {
    const result = await getAnnotation(id);
    if (!result) return;
    const html = generateAnnotationHTML(result.annotation, result.pins, result.pinPhotos);
    setPreviewHtml(html);
  }

  async function handleExport(id: string) {
    const result = await getAnnotation(id);
    if (!result) return;
    const html = generateAnnotationHTML(result.annotation, result.pins, result.pinPhotos);
    setExportHtml(html);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Hole Annotations</h1>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => handleCreate('scroll')}>New Scroll</button>
          <button className="btn btn-primary" onClick={() => handleCreate('interactive')}>New Interactive</button>
        </div>
      </div>

      {annotations.length === 0 ? (
        <div className="empty-state">No annotations yet. Create one to get started.</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Type</th>
                <th>Course</th>
                <th>Pins</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {annotations.map(a => (
                <tr key={a.id}>
                  <td>
                    {a.aerial_image_url ? (
                      <img
                        src={a.aerial_image_url}
                        alt=""
                        style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }}
                      />
                    ) : (
                      <span style={{ color: '#888', fontSize: 12 }}>No image</span>
                    )}
                  </td>
                  <td>{a.title || 'Untitled'}</td>
                  <td>
                    <span className={`badge ${a.annotation_type === 'interactive' ? 'badge-public' : 'badge-private'}`}>
                      {a.annotation_type === 'interactive' ? 'Interactive' : 'Scroll'}
                    </span>
                  </td>
                  <td>{a.course_name || '-'}</td>
                  <td>{a.pin_count ?? 0}</td>
                  <td>{new Date(a.created_at).toLocaleDateString()}</td>
                  <td>
                    {deleteId === a.id ? (
                      <div className="btn-group">
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>Confirm</button>
                        <button className="btn btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div className="btn-group">
                        <Link to={`/hole-annotations/${a.id}/edit`} className="btn btn-sm">Edit</Link>
                        <button className="btn btn-sm" onClick={() => handlePreview(a.id)}>Preview</button>
                        <button className="btn btn-sm" onClick={() => handleExport(a.id)}>Export</button>
                        <button className="btn btn-sm" onClick={() => handleDuplicate(a.id)}>Duplicate</button>
                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(a.id)}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewHtml && <AnnotationPreview html={previewHtml} onClose={() => setPreviewHtml(null)} />}
      {exportHtml && <AnnotationExport html={exportHtml} onClose={() => setExportHtml(null)} />}
    </div>
  );
}
