import { useRef, useState, useCallback } from 'react';
import { uploadAnnotationImage } from './upload';
import type { AnnotationPin } from './types';

interface AnnotationCanvasProps {
  aerialImageUrl: string | null;
  pins: AnnotationPin[];
  selectedPinId: string | null;
  annotationType: 'scroll' | 'interactive';
  pinColor: 'black' | 'yellow';
  onPinAdd: (x: number, y: number) => void;
  onPinMove: (pinId: string, x: number, y: number) => void;
  onPinSelect: (pinId: string) => void;
  onImageUpload: (url: string) => void;
}

const YELLOW_BUBBLE = `<svg width="38" height="33" viewBox="0 0 38 33" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.67 0.673C24.811-1.561 34.895 1.948 37.194 8.512 39.316 14.569 34.066 21.11 25.275 23.84L20.565 32c-.77 1.334-2.695 1.334-3.465 0L12.963 24.834C6.89 23.935 1.986 20.935.47 16.605-1.829 10.041 4.529 2.908 14.67.673Z" fill="#FFEE54" stroke="#1B1A1A" stroke-width="1.5"/></svg>`;

const BLACK_BUBBLE = `<svg width="38" height="33" viewBox="0 0 38 33" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.67 0.673C24.811-1.561 34.895 1.948 37.194 8.512 39.316 14.569 34.066 21.11 25.275 23.84L20.565 32c-.77 1.334-2.695 1.334-3.465 0L12.963 24.834C6.89 23.935 1.986 20.935.47 16.605-1.829 10.041 4.529 2.908 14.67.673Z" fill="black" stroke="#F3F1E7" stroke-width="1.5"/></svg>`;

export default function AnnotationCanvas({
  aerialImageUrl,
  pins,
  selectedPinId,
  annotationType,
  pinColor,
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

  const sortedPins = [...pins].sort((a, b) => a.sort_order - b.sort_order);
  const isInteractive = annotationType === 'interactive';

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
        {sortedPins.map((pin, index) => {
          if (isInteractive) {
            const bubbleSvg = pinColor === 'yellow' ? YELLOW_BUBBLE : BLACK_BUBBLE;
            const numColor = pinColor === 'yellow' ? '#1B1A1A' : '#F3F1E7';
            return (
              <div
                key={pin.id}
                className={`ha-pin-marker ha-pin-bubble${pin.id === selectedPinId ? ' selected' : ''}${pin.id === draggingPinId ? ' dragging' : ''}`}
                style={{
                  left: `${pin.position_x}%`,
                  top: `${pin.position_y}%`,
                }}
                onMouseDown={(e) => handlePinMouseDown(e, pin.id)}
                onTouchStart={(e) => handlePinMouseDown(e, pin.id)}
              >
                <span className="ha-pin-bubble-svg" dangerouslySetInnerHTML={{ __html: bubbleSvg }} />
                <span className="ha-pin-bubble-num" style={{ color: numColor }}>{index + 1}</span>
              </div>
            );
          }
          return (
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
          );
        })}
      </div>
    </div>
  );
}
