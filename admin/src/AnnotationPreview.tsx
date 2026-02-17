interface AnnotationPreviewProps {
  html: string;
  onClose: () => void;
}

export default function AnnotationPreview({ html, onClose }: AnnotationPreviewProps) {
  return (
    <div className="confirm-overlay" onClick={onClose}>
      <div
        style={{
          width: '90vw',
          height: '90vh',
          background: '#fff',
          borderRadius: 10,
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="btn btn-sm"
          onClick={onClose}
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}
        >
          Close
        </button>
        <iframe
          srcDoc={html}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Annotation Preview"
        />
      </div>
    </div>
  );
}
