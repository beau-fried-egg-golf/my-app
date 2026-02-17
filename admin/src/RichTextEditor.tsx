import { useRef, useEffect, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync external value changes into the editor
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    isInternalChange.current = true;
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  function execCmd(command: string, val?: string) {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    handleInput();
  }

  function handleLink() {
    const url = prompt('Enter URL:');
    if (url) execCmd('createLink', url);
  }

  return (
    <div className="ha-rte">
      <div className="ha-rte-toolbar">
        <button type="button" className="ha-rte-btn" onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" className="ha-rte-btn" onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} title="Italic">
          <em>I</em>
        </button>
        <button type="button" className="ha-rte-btn" onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }} title="Bullet List">
          &bull;
        </button>
        <button type="button" className="ha-rte-btn" onMouseDown={(e) => { e.preventDefault(); handleLink(); }} title="Link">
          &#128279;
        </button>
        <button type="button" className="ha-rte-btn" onMouseDown={(e) => { e.preventDefault(); execCmd('removeFormat'); }} title="Clear Formatting">
          T
        </button>
      </div>
      <div
        ref={editorRef}
        className="ha-rte-content"
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
}
