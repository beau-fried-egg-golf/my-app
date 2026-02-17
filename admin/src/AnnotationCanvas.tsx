import { useRef, useState, useCallback } from 'react';
import { uploadAnnotationImage } from './upload';
import type { AnnotationPin } from './types';

interface AnnotationCanvasProps {
  aerialImageUrl: string | null;
  pins: AnnotationPin[];
  selectedPinId: string | null;
  onPinAdd: (x: number, y: number) => void;
  onPinMove: (pinId: string, x: number, y: number) => void;
  onPinSelect: (pinId: string) => void;
  onImageUpload: (url: string) => void;
}

export default function AnnotationCanvas({
  aerialImageUrl,
  pins,
  selectedPinId,
  onPinAdd,
  onPinMove,
  onPinSelect,
  onImageUpload,
}: AnnotationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function getPercentCoords(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 50 };
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  }

  function handleContainerClick(e: React.MouseEvent) {
    if (draggingPinId) return;
    // Only add pin if clicking directly on the image area, not on a pin
    if ((e.target as HTMLElement).closest('.ha-pin-marker')) return;
    const { x, y } = getPercentCoords(e.clientX, e.clientY);
    onPinAdd(x, y);
  }

  function handlePinMouseDown(e: React.MouseEvent | React.TouchEvent, pinId: string) {
    e.preventDefault();
    e.stopPropagation();
    onPinSelect(pinId);
    setDraggingPinId(pinId);
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingPinId) return;
    const { x, y } = getPercentCoords(e.clientX, e.clientY);
    onPinMove(draggingPinId, x, y);
  }, [draggingPinId, onPinMove]);

  const handleMouseUp = useCallback(() => {
    setDraggingPinId(null);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!draggingPinId) return;
    const touch = e.touches[0];
    const { x, y } = getPercentCoords(touch.clientX, touch.clientY);
    onPinMove(draggingPinId, x, y);
  }, [draggingPinId, onPinMove]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAnnotationImage(file, 'aerials');
      onImageUpload(url);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // Sort pins for display numbering
  const sortedPins = [...pins].sort((a, b) => a.sort_order - b.sort_order);

  if (!aerialImageUrl) {
    return (
      <div className="ha-canvas-panel">
        <div
          className="dropzone"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
            {uploading ? 'Uploading...' : 'Upload Aerial Image'}
          </p>
          <p style={{ fontSize: 13, color: '#888' }}>
            Click to choose an aerial photo of the hole
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ha-canvas-panel">
      <div
        ref={containerRef}
        className="ha-canvas-container"
        onClick={handleContainerClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <img
          src={aerialImageUrl}
          alt="Aerial view"
          className="ha-canvas-img"
          draggable={false}
        />
        {sortedPins.map((pin, index) => (
          <div
            key={pin.id}
            className={`ha-pin-marker${pin.id === selectedPinId ? ' selected' : ''}${pin.id === draggingPinId ? ' dragging' : ''}`}
            style={{
              left: `${pin.position_x}%`,
              top: `${pin.position_y}%`,
            }}
            onMouseDown={(e) => handlePinMouseDown(e, pin.id)}
            onTouchStart={(e) => handlePinMouseDown(e, pin.id)}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  );
}
