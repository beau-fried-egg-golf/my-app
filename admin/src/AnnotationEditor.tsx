import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAnnotation, saveAnnotation } from './storage';
import { generateAnnotationHTML } from './generateAnnotationHTML';
import { getFontDataUris } from './fontData';
import type { FontUris } from './generateAnnotationHTML';
import AnnotationCanvas from './AnnotationCanvas';
import PinEditor from './PinEditor';
import AnnotationPreview from './AnnotationPreview';
import AnnotationExport from './AnnotationExport';
import type { HoleAnnotation, AnnotationPin, PinPhoto } from './types';

type SaveStatus = 'saved' | 'saving' | 'unsaved';

export default function AnnotationEditor() {
  const { id } = useParams<{ id: string }>();
  const [annotation, setAnnotation] = useState<HoleAnnotation | null>(null);
  const [pins, setPins] = useState<AnnotationPin[]>([]);
  const [pinPhotos, setPinPhotos] = useState<PinPhoto[]>([]);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [exportHtml, setExportHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontUris, setFontUris] = useState<FontUris | undefined>(undefined);

  useEffect(() => { getFontDataUris().then(setFontUris); }, []);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlightRef = useRef(false);
  const pendingSaveRef = useRef(false);

  // Refs for latest state (used in save callback)
  const annotationRef = useRef(annotation);
  const pinsRef = useRef(pins);
  const pinPhotosRef = useRef(pinPhotos);
  annotationRef.current = annotation;
  pinsRef.current = pins;
  pinPhotosRef.current = pinPhotos;

  useEffect(() => {
    if (!id) return;
    getAnnotation(id).then(result => {
      if (result) {
        setAnnotation(result.annotation);
        setPins(result.pins);
        setPinPhotos(result.pinPhotos);
      }
      setLoading(false);
    });
  }, [id]);

  const doSave = useCallback(async () => {
    const ann = annotationRef.current;
    const p = pinsRef.current;
    const pp = pinPhotosRef.current;
    if (!ann) return;

    if (saveInFlightRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    saveInFlightRef.current = true;
    setSaveStatus('saving');

    try {
      await saveAnnotation(ann, p, pp);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('unsaved');
    } finally {
      saveInFlightRef.current = false;
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        doSave();
      }
    }
  }, []);

  const scheduleSave = useCallback(() => {
    setSaveStatus('unsaved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(doSave, 1500);
  }, [doSave]);

  // Save on unmount / blur
  useEffect(() => {
    function handleBlur() {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      doSave();
    }
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      // Final save on unmount
      doSave();
    };
  }, [doSave]);

  function handleAnnotationChange(field: keyof HoleAnnotation, value: string | number) {
    setAnnotation(prev => prev ? { ...prev, [field]: value } : prev);
    scheduleSave();
  }

  function handleImageUpload(url: string) {
    setAnnotation(prev => prev ? { ...prev, aerial_image_url: url } : prev);
    scheduleSave();
  }

  function handlePinAdd(x: number, y: number) {
    if (!annotation) return;
    const newPin: AnnotationPin = {
      id: crypto.randomUUID(),
      annotation_id: annotation.id,
      position_x: Math.round(x * 100) / 100,
      position_y: Math.round(y * 100) / 100,
      sort_order: pins.length,
      headline: '',
      body_text: '',
      link_url: '',
      par: '',
      yardage: '',
      handicap: '',
      scroll_direction: 'bottom',
      created_at: new Date().toISOString(),
    };
    setPins(prev => [...prev, newPin]);
    setSelectedPinId(newPin.id);
    scheduleSave();
  }

  function handlePinMove(pinId: string, x: number, y: number) {
    setPins(prev => prev.map(p =>
      p.id === pinId
        ? { ...p, position_x: Math.round(x * 100) / 100, position_y: Math.round(y * 100) / 100 }
        : p
    ));
    scheduleSave();
  }

  function handlePinSelect(pinId: string) {
    setSelectedPinId(pinId);
  }

  function handlePinChange(pinId: string, field: string, value: string) {
    setPins(prev => prev.map(p =>
      p.id === pinId ? { ...p, [field]: value } : p
    ));
    scheduleSave();
  }

  function handlePinDelete(pinId: string) {
    setPins(prev => prev.filter(p => p.id !== pinId));
    setPinPhotos(prev => prev.filter(p => p.pin_id !== pinId));
    if (selectedPinId === pinId) setSelectedPinId(null);
    scheduleSave();
  }

  function handlePinReorder(pinId: string, direction: 'up' | 'down') {
    setPins(prev => {
      const sorted = [...prev].sort((a, b) => a.sort_order - b.sort_order);
      const idx = sorted.findIndex(p => p.id === pinId);
      if (idx < 0) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const tempOrder = sorted[idx].sort_order;
      sorted[idx] = { ...sorted[idx], sort_order: sorted[swapIdx].sort_order };
      sorted[swapIdx] = { ...sorted[swapIdx], sort_order: tempOrder };
      return sorted;
    });
    scheduleSave();
  }

  function handlePhotoAdd(pinId: string, url: string) {
    const existing = pinPhotos.filter(p => p.pin_id === pinId);
    if (existing.length >= 4) return;
    const newPhoto: PinPhoto = {
      id: crypto.randomUUID(),
      pin_id: pinId,
      photo_url: url,
      sort_order: existing.length,
      caption: '',
      created_at: new Date().toISOString(),
    };
    setPinPhotos(prev => [...prev, newPhoto]);
    scheduleSave();
  }

  function handlePhotoRemove(photoId: string) {
    setPinPhotos(prev => prev.filter(p => p.id !== photoId));
    scheduleSave();
  }

  function handlePhotoReorder(photoId: string, direction: 'up' | 'down') {
    setPinPhotos(prev => {
      const photo = prev.find(p => p.id === photoId);
      if (!photo) return prev;
      const siblings = prev
        .filter(p => p.pin_id === photo.pin_id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const idx = siblings.findIndex(p => p.id === photoId);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= siblings.length) return prev;
      const tempOrder = siblings[idx].sort_order;
      const updated = prev.map(p => {
        if (p.id === siblings[idx].id) return { ...p, sort_order: siblings[swapIdx].sort_order };
        if (p.id === siblings[swapIdx].id) return { ...p, sort_order: tempOrder };
        return p;
      });
      return updated;
    });
    scheduleSave();
  }

  function handlePhotoCaptionChange(photoId: string, caption: string) {
    setPinPhotos(prev => prev.map(p =>
      p.id === photoId ? { ...p, caption } : p
    ));
    scheduleSave();
  }

  function handlePreview() {
    if (!annotation) return;
    const html = generateAnnotationHTML(annotation, pins, pinPhotos, fontUris);
    setPreviewHtml(html);
  }

  function handleExport() {
    if (!annotation) return;
    const html = generateAnnotationHTML(annotation, pins, pinPhotos);
    setExportHtml(html);
  }

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#888' }}>Loading...</div>;
  }

  if (!annotation) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#888' }}>Annotation not found.</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/hole-annotations" className="btn btn-sm">&larr; Back</Link>
          <h1 className="page-title">{annotation.title || 'Untitled'}</h1>
          <span className={`ha-save-status ha-save-status-${saveStatus}`}>
            {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved changes'}
          </span>
        </div>
        <div className="btn-group">
          <button className="btn" onClick={handlePreview}>Preview</button>
          <button className="btn" onClick={handleExport}>Export HTML</button>
        </div>
      </div>

      <div className="ha-editor">
        <AnnotationCanvas
          aerialImageUrl={annotation.aerial_image_url}
          pins={pins}
          selectedPinId={selectedPinId}
          annotationType={annotation.annotation_type}
          pinColor={annotation.pin_color}
          onPinAdd={handlePinAdd}
          onPinMove={handlePinMove}
          onPinSelect={handlePinSelect}
          onImageUpload={handleImageUpload}
        />
        <PinEditor
          annotation={annotation}
          pins={pins}
          pinPhotos={pinPhotos}
          selectedPinId={selectedPinId}
          onAnnotationChange={handleAnnotationChange}
          onPinSelect={handlePinSelect}
          onPinChange={handlePinChange}
          onPinDelete={handlePinDelete}
          onPinReorder={handlePinReorder}
          onPhotoAdd={handlePhotoAdd}
          onPhotoRemove={handlePhotoRemove}
          onPhotoReorder={handlePhotoReorder}
          onPhotoCaptionChange={handlePhotoCaptionChange}
          onImageUpload={handleImageUpload}
          onDeselectPin={() => setSelectedPinId(null)}
        />
      </div>

      {previewHtml && <AnnotationPreview html={previewHtml} onClose={() => setPreviewHtml(null)} />}
      {exportHtml && <AnnotationExport html={exportHtml} onClose={() => setExportHtml(null)} />}
    </div>
  );
}
