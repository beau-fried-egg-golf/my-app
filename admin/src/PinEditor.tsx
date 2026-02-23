import { useRef, useState } from 'react';
import { uploadAnnotationImage } from './upload';
import RichTextEditor from './RichTextEditor';
import type { HoleAnnotation, AnnotationPin, PinPhoto } from './types';

interface PinEditorProps {
  annotation: HoleAnnotation;
  pins: AnnotationPin[];
  pinPhotos: PinPhoto[];
  selectedPinId: string | null;
  onAnnotationChange: (field: keyof HoleAnnotation, value: string | number) => void;
  onPinSelect: (pinId: string) => void;
  onPinChange: (pinId: string, field: string, value: string) => void;
  onPinDelete: (pinId: string) => void;
  onPinReorder: (pinId: string, direction: 'up' | 'down') => void;
  onPhotoAdd: (pinId: string, url: string) => void;
  onPhotoRemove: (photoId: string) => void;
  onPhotoReorder: (photoId: string, direction: 'up' | 'down') => void;
  onPhotoCaptionChange: (photoId: string, caption: string) => void;
  onImageUpload: (url: string) => void;
  onDeselectPin: () => void;
}

export default function PinEditor({
  annotation,
  pins,
  pinPhotos,
  selectedPinId,
  onAnnotationChange,
  onPinSelect,
  onPinChange,
  onPinDelete,
  onPinReorder,
  onPhotoAdd,
  onPhotoRemove,
  onPhotoReorder,
  onPhotoCaptionChange,
  onImageUpload,
  onDeselectPin,
}: PinEditorProps) {
  const isInteractive = annotation.annotation_type === 'interactive';
  const pinLabel = isInteractive ? 'hole' : 'pin';
  const sortedPins = [...pins].sort((a, b) => a.sort_order - b.sort_order);
  const selectedPin = pins.find(p => p.id === selectedPinId);
  const selectedPinPhotos = pinPhotos
    .filter(p => p.pin_id === selectedPinId)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (selectedPin && isInteractive) {
    return (
      <div className="ha-sidebar-panel">
        <button className="btn btn-sm" onClick={onDeselectPin} style={{ marginBottom: 16 }}>
          &larr; Back to list
        </button>

        <div className="form-group">
          <label className="form-label">Hole Name &amp; Number</label>
          <input
            className="form-input"
            value={selectedPin.headline}
            onChange={(e) => onPinChange(selectedPin.id, 'headline', e.target.value)}
            placeholder="e.g. Hole 1 — The Opening"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Par</label>
            <input
              className="form-input"
              value={selectedPin.par}
              onChange={(e) => onPinChange(selectedPin.id, 'par', e.target.value)}
              placeholder="e.g. Par 5"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Yardage</label>
            <input
              className="form-input"
              value={selectedPin.yardage}
              onChange={(e) => onPinChange(selectedPin.id, 'yardage', e.target.value)}
              placeholder="e.g. 456 yds"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Handicap <span style={{ fontWeight: 400, color: '#999' }}>(optional)</span></label>
          <input
            className="form-input"
            value={selectedPin.handicap}
            onChange={(e) => onPinChange(selectedPin.id, 'handicap', e.target.value)}
            placeholder="e.g. HCP 3"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-input form-textarea"
            value={selectedPin.body_text}
            onChange={(e) => onPinChange(selectedPin.id, 'body_text', e.target.value)}
            placeholder="Short description of the hole..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Link URL</label>
          <input
            className="form-input"
            value={selectedPin.link_url}
            onChange={(e) => onPinChange(selectedPin.id, 'link_url', e.target.value)}
            placeholder="https://... (optional 'Find out more' link)"
          />
        </div>

        <div style={{ marginTop: 24 }}>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => {
              if (confirm('Delete this hole?')) onPinDelete(selectedPin.id);
            }}
          >
            Delete Hole
          </button>
        </div>
      </div>
    );
  }

  if (selectedPin) {
    return (
      <div className="ha-sidebar-panel">
        <button className="btn btn-sm" onClick={onDeselectPin} style={{ marginBottom: 16 }}>
          &larr; Back to list
        </button>

        <div className="form-group">
          <label className="form-label">Headline</label>
          <input
            className="form-input"
            value={selectedPin.headline}
            onChange={(e) => onPinChange(selectedPin.id, 'headline', e.target.value)}
            placeholder="Pin headline..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Body</label>
          <RichTextEditor
            value={selectedPin.body_text}
            onChange={(html) => onPinChange(selectedPin.id, 'body_text', html)}
            placeholder="Write content..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Link URL</label>
          <input
            className="form-input"
            value={selectedPin.link_url}
            onChange={(e) => onPinChange(selectedPin.id, 'link_url', e.target.value)}
            placeholder="https://... (optional 'Find out more' link)"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Photos (max 4)</label>
          <PinPhotoGrid
            photos={selectedPinPhotos}
            pinId={selectedPin.id}
            onPhotoAdd={onPhotoAdd}
            onPhotoRemove={onPhotoRemove}
            onPhotoReorder={onPhotoReorder}
            onCaptionChange={onPhotoCaptionChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Scroll Direction</label>
          <div className="ha-type-toggle">
            {([
              ['bottom', '\u2193 Bottom'],
              ['top', '\u2191 Top'],
              ['left', '\u2190 Left'],
              ['right', '\u2192 Right'],
            ] as const).map(([dir, label]) => (
              <button
                key={dir}
                className={`ha-type-btn${(selectedPin.scroll_direction || 'bottom') === dir ? ' active' : ''}`}
                onClick={() => onPinChange(selectedPin.id, 'scroll_direction', dir)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => {
              if (confirm('Delete this pin?')) onPinDelete(selectedPin.id);
            }}
          >
            Delete Pin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ha-sidebar-panel">
      <div className="form-group">
        <label className="form-label">Type</label>
        <div className="ha-type-toggle">
          <button
            className={`ha-type-btn${!isInteractive ? ' active' : ''}`}
            onClick={() => onAnnotationChange('annotation_type', 'scroll')}
          >
            Scroll (Single Hole)
          </button>
          <button
            className={`ha-type-btn${isInteractive ? ' active' : ''}`}
            onClick={() => onAnnotationChange('annotation_type', 'interactive')}
          >
            Interactive (Course)
          </button>
        </div>
      </div>

      {isInteractive && (
        <div className="form-group">
          <label className="form-label">Pin Color</label>
          <div className="ha-color-toggle">
            <button
              className={`ha-color-btn ha-color-black${annotation.pin_color === 'black' ? ' active' : ''}`}
              onClick={() => onAnnotationChange('pin_color', 'black')}
            >
              <span className="ha-color-swatch ha-swatch-black" />
              Black
            </button>
            <button
              className={`ha-color-btn ha-color-yellow${annotation.pin_color === 'yellow' ? ' active' : ''}`}
              onClick={() => onAnnotationChange('pin_color', 'yellow')}
            >
              <span className="ha-color-swatch ha-swatch-yellow" />
              Yellow
            </button>
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Title</label>
        <input
          className="form-input"
          value={annotation.title}
          onChange={(e) => onAnnotationChange('title', e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Course Name</label>
          <input
            className="form-input"
            value={annotation.course_name}
            onChange={(e) => onAnnotationChange('course_name', e.target.value)}
          />
        </div>
        {!isInteractive && (
          <div className="form-group">
            <label className="form-label">Hole #</label>
            <input
              className="form-input"
              type="number"
              min={1}
              max={36}
              value={annotation.hole_number}
              onChange={(e) => onAnnotationChange('hole_number', parseInt(e.target.value) || 1)}
            />
          </div>
        )}
      </div>

      {isInteractive && (
        <>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                className="form-input"
                value={annotation.location}
                onChange={(e) => onAnnotationChange('location', e.target.value)}
                placeholder="e.g. Southampton, NY"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Architect</label>
              <input
                className="form-input"
                value={annotation.architect}
                onChange={(e) => onAnnotationChange('architect', e.target.value)}
                placeholder="e.g. Seth Raynor"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Year Opened</label>
            <input
              className="form-input"
              value={annotation.year_opened}
              onChange={(e) => onAnnotationChange('year_opened', e.target.value)}
              placeholder="e.g. 1931"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Course Description</label>
            <textarea
              className="form-input form-textarea"
              value={annotation.course_description}
              onChange={(e) => onAnnotationChange('course_description', e.target.value)}
              placeholder="Short description of the course..."
            />
          </div>
        </>
      )}

      {annotation.aerial_image_url && (
        <div className="form-group">
          <label className="form-label">Aerial Image</label>
          <AerialImageReplace currentUrl={annotation.aerial_image_url} onImageUpload={onImageUpload} />
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <label className="form-label">
          {isInteractive ? 'Holes' : 'Pins'} ({sortedPins.length})
        </label>
        {sortedPins.length === 0 ? (
          <p style={{ fontSize: 13, color: '#888' }}>
            Click on the aerial image to add {isInteractive ? 'holes' : 'pins'}
          </p>
        ) : (
          <div>
            {sortedPins.map((pin, index) => (
              <div key={pin.id} className="ha-pin-list-item">
                <span className="ha-pin-list-number">{index + 1}</span>
                <span
                  className="ha-pin-list-headline"
                  onClick={() => onPinSelect(pin.id)}
                >
                  {pin.headline || `Untitled ${pinLabel}`}
                </span>
                <div className="btn-group">
                  <button
                    className="btn btn-sm"
                    onClick={() => onPinReorder(pin.id, 'up')}
                    disabled={index === 0}
                  >
                    &uarr;
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => onPinReorder(pin.id, 'down')}
                    disabled={index === sortedPins.length - 1}
                  >
                    &darr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AerialImageReplace({ currentUrl, onImageUpload }: { currentUrl: string; onImageUpload: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAnnotationImage(file, 'aerials');
      onImageUpload(url);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <img src={currentUrl} alt="" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 4 }} />
      <div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        <button className="btn btn-sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Replace'}
        </button>
      </div>
    </div>
  );
}

function PinPhotoGrid({
  photos,
  pinId,
  onPhotoAdd,
  onPhotoRemove,
  onPhotoReorder,
  onCaptionChange,
}: {
  photos: PinPhoto[];
  pinId: string;
  onPhotoAdd: (pinId: string, url: string) => void;
  onPhotoRemove: (photoId: string) => void;
  onPhotoReorder: (photoId: string, direction: 'up' | 'down') => void;
  onCaptionChange: (photoId: string, caption: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAnnotationImage(file, 'pins');
      onPhotoAdd(pinId, url);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Photo upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <div className="ha-photo-grid-sm">
        {photos.map((photo, index) => (
          <div key={photo.id} className="ha-photo-slot">
            <img src={photo.photo_url} alt="" />
            <input
              className="form-input"
              value={photo.caption}
              onChange={(e) => onCaptionChange(photo.id, e.target.value)}
              placeholder="Caption..."
              style={{ fontSize: 12, padding: '4px 6px', marginTop: 4 }}
            />
            <div className="btn-group" style={{ marginTop: 4 }}>
              <button className="btn btn-sm" onClick={() => onPhotoReorder(photo.id, 'up')} disabled={index === 0}>&uarr;</button>
              <button className="btn btn-sm" onClick={() => onPhotoReorder(photo.id, 'down')} disabled={index === photos.length - 1}>&darr;</button>
              <button className="btn btn-sm btn-danger" onClick={() => onPhotoRemove(photo.id)}>X</button>
            </div>
          </div>
        ))}
      </div>
      {photos.length < 4 && (
        <div style={{ marginTop: 8 }}>
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          <button className="btn btn-sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Add Photo'}
          </button>
        </div>
      )}
    </div>
  );
}
