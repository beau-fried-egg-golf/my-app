import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';

const MAX_LENGTH = 5000;

export interface EditorOutput {
  html: string;
  json: unknown;
  text: string;
}

export interface CommentEditorProps {
  placeholder?: string;
  initialContent?: unknown;
  onSubmit: (data: EditorOutput) => void;
  onCancel?: () => void;
  onAttach?: () => void;
  attachCount?: number;
  attachSlot?: React.ReactNode;
  submitLabel?: string;
  submitting?: boolean;
  autoFocus?: boolean;
}

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      className={`fegc-comments-toolbar-btn ${active ? 'fegc-comments-toolbar-btn-active' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

export default function CommentEditor({
  placeholder = 'Give us your thoughts...',
  initialContent,
  onSubmit,
  onCancel,
  onAttach,
  attachCount,
  attachSlot,
  submitLabel = 'Submit Comment',
  submitting = false,
  autoFocus = false,
}: CommentEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
        codeBlock: false,
      }),
      Link.configure({
        autolink: true,
        openOnClick: false,
        HTMLAttributes: {
          rel: 'nofollow noopener',
          target: '_blank',
        },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: MAX_LENGTH }),
    ],
    content: initialContent as Record<string, unknown> | undefined ?? '',
    autofocus: autoFocus,
  });

  if (!editor) return null;

  const charCount = editor.storage.characterCount.characters();
  const isEmpty = editor.isEmpty;

  function handleSubmit() {
    if (!editor || isEmpty) return;
    onSubmit({
      html: editor.getHTML(),
      json: editor.getJSON(),
      text: editor.getText(),
    });
  }

  function handleSetLink() {
    if (!editor) return;
    const url = window.prompt('Enter URL:');
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }

  return (
    <>
      <div className="fegc-comments-editor">
        <EditorContent editor={editor} className="fegc-comments-editor-content" />

        {/* Toolbar at bottom of text area */}
        <div className="fegc-comments-toolbar">
          <ToolbarButton
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('link')}
            onClick={handleSetLink}
            title="Link"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6.5 8.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5l-1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M9.5 7.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="4" r="1.2" fill="currentColor"/><circle cx="3" cy="8" r="1.2" fill="currentColor"/><circle cx="3" cy="12" r="1.2" fill="currentColor"/><line x1="6.5" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="6.5" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="6.5" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><text x="1" y="5.5" fill="currentColor" fontSize="5.5" fontWeight="600" fontFamily="inherit">1</text><text x="1" y="9.5" fill="currentColor" fontSize="5.5" fontWeight="600" fontFamily="inherit">2</text><text x="1" y="13.5" fill="currentColor" fontSize="5.5" fontWeight="600" fontFamily="inherit">3</text><line x1="6.5" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="6.5" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="6.5" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Quote"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 10.5c0-2 1-4 3-5l.5.7C5 7.2 4.5 8.2 4.5 9.5h2V13H3v-2.5zm6 0c0-2 1-4 3-5l.5.7C11 7.2 10.5 8.2 10.5 9.5h2V13H9v-2.5z" fill="currentColor"/></svg>
          </ToolbarButton>
          {onAttach && (
            <>
              <div className="fegc-comments-toolbar-sep" />
              <ToolbarButton
                onClick={onAttach}
                title="Add photos"
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <circle cx="5.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M1.5 11L5 7.5L8 10.5L10.5 8L14.5 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {(attachCount ?? 0) > 0 && (
                  <span className="fegc-comments-toolbar-badge">{attachCount}</span>
                )}
              </ToolbarButton>
            </>
          )}
        </div>

        {/* Pending images */}
        {attachSlot}
      </div>

      {/* Submit row — outside the editor box */}
      <div className="fegc-comments-submit-row">
        <button
          className="fegc-comments-submit-btn"
          onClick={handleSubmit}
          disabled={submitting || isEmpty}
          type="button"
        >
          <span className="fegc-comments-btn-text-clip">
            <span className="fegc-comments-btn-roll">
              <span>{submitting ? 'Posting...' : submitLabel}</span>
              <span>{submitting ? 'Posting...' : submitLabel}</span>
            </span>
          </span>
        </button>
        {onCancel && (
          <button className="fegc-comments-cancel-btn" onClick={onCancel} type="button">
            Cancel
          </button>
        )}
        {charCount > MAX_LENGTH * 0.9 && (
          <span className="fegc-comments-char-count">
            {charCount}/{MAX_LENGTH}
          </span>
        )}
      </div>
    </>
  );
}
