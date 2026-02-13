import { useRef, useState } from 'react';
import { uploadImage } from './upload';

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleRemove() {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      {value ? (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <img
            src={value}
            alt="Preview"
            style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 4 }}
          />
          <button type="button" className="btn" onClick={handleRemove}>
            Remove
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="btn"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Choose Image'}
          </button>
        </div>
      )}
    </div>
  );
}
