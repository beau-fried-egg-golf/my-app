/**
 * Markdown text manipulation utilities for rich text formatting toolbar.
 */

export interface TextSelection {
  start: number;
  end: number;
}

export interface WrapResult {
  text: string;
  selection: TextSelection;
}

/**
 * Wrap selected text with markdown tokens (e.g., **bold**).
 * If no text is selected, inserts placeholder text wrapped in tokens.
 * If selected text is already wrapped, unwraps it.
 */
export function wrapSelection(
  text: string,
  selection: TextSelection,
  prefix: string,
  suffix: string,
  placeholder: string,
): WrapResult {
  const before = text.slice(0, selection.start);
  const selected = text.slice(selection.start, selection.end);
  const after = text.slice(selection.end);

  // Check if already wrapped — unwrap
  if (
    selected.startsWith(prefix) &&
    selected.endsWith(suffix) &&
    selected.length >= prefix.length + suffix.length
  ) {
    const inner = selected.slice(prefix.length, selected.length - suffix.length);
    return {
      text: before + inner + after,
      selection: { start: selection.start, end: selection.start + inner.length },
    };
  }

  // Check if surrounding text contains the wrapper
  const pLen = prefix.length;
  const sLen = suffix.length;
  if (
    before.length >= pLen &&
    after.length >= sLen &&
    before.slice(-pLen) === prefix &&
    after.slice(0, sLen) === suffix
  ) {
    const unwrappedBefore = before.slice(0, -pLen);
    const unwrappedAfter = after.slice(sLen);
    return {
      text: unwrappedBefore + selected + unwrappedAfter,
      selection: { start: unwrappedBefore.length, end: unwrappedBefore.length + selected.length },
    };
  }

  if (selected.length === 0) {
    // No selection — insert placeholder
    const inserted = prefix + placeholder + suffix;
    return {
      text: before + inserted + after,
      selection: { start: selection.start + prefix.length, end: selection.start + prefix.length + placeholder.length },
    };
  }

  // Wrap the selection
  const wrapped = prefix + selected + suffix;
  return {
    text: before + wrapped + after,
    selection: { start: selection.start + prefix.length, end: selection.end + prefix.length },
  };
}

/**
 * Toggle a line prefix (e.g., "- " or "1. ") at the start of the current line.
 */
export function toggleLinePrefix(
  text: string,
  selection: TextSelection,
  prefix: string,
): WrapResult {
  // Find the start of the current line
  const lineStart = text.lastIndexOf('\n', selection.start - 1) + 1;
  const lineEnd = text.indexOf('\n', selection.start);
  const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;
  const line = text.slice(lineStart, actualLineEnd);

  const isNumbered = prefix === '1. ';

  if (isNumbered) {
    // Check if line starts with any number prefix
    const numMatch = line.match(/^\d+\.\s/);
    if (numMatch) {
      // Remove number prefix
      const newLine = line.slice(numMatch[0].length);
      const newText = text.slice(0, lineStart) + newLine + text.slice(actualLineEnd);
      const offset = -numMatch[0].length;
      return {
        text: newText,
        selection: {
          start: Math.max(lineStart, selection.start + offset),
          end: Math.max(lineStart, selection.end + offset),
        },
      };
    }
  } else if (line.startsWith(prefix)) {
    // Remove prefix
    const newLine = line.slice(prefix.length);
    const newText = text.slice(0, lineStart) + newLine + text.slice(actualLineEnd);
    const offset = -prefix.length;
    return {
      text: newText,
      selection: {
        start: Math.max(lineStart, selection.start + offset),
        end: Math.max(lineStart, selection.end + offset),
      },
    };
  }

  // Add prefix
  const newText = text.slice(0, lineStart) + prefix + text.slice(lineStart);
  return {
    text: newText,
    selection: {
      start: selection.start + prefix.length,
      end: selection.end + prefix.length,
    },
  };
}

/**
 * Insert a markdown link. Wraps selection as [text](url).
 * If no selection, inserts [url](url).
 */
export function insertLink(
  text: string,
  selection: TextSelection,
  url: string,
): WrapResult {
  const before = text.slice(0, selection.start);
  const selected = text.slice(selection.start, selection.end);
  const after = text.slice(selection.end);

  const linkText = selected.length > 0 ? selected : url;
  const link = `[${linkText}](${url})`;

  return {
    text: before + link + after,
    selection: { start: selection.start, end: selection.start + link.length },
  };
}

/**
 * Strip markdown syntax for previews and push notifications.
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  return (
    text
      // Links: [text](url) → text
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Bold: **text** → text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      // Italic: *text* → text
      .replace(/\*([^*]+)\*/g, '$1')
      // Bullet lists: "- item" → "item"
      .replace(/^- /gm, '')
      // Numbered lists: "1. item" → "item"
      .replace(/^\d+\.\s/gm, '')
      .trim()
  );
}

// --- Markdown parser for rendering ---

export type SegmentType = 'text' | 'bold' | 'italic' | 'link' | 'boldItalic';

export interface TextSegment {
  type: SegmentType;
  text: string;
  url?: string;
}

export interface ParsedLine {
  type: 'paragraph' | 'bullet' | 'numbered';
  number?: number;
  segments: TextSegment[];
}

/**
 * Parse inline markdown (bold, italic, links) within a single line.
 */
export function parseInline(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  // Match: links, bold+italic, bold, italic
  const pattern = /\[([^\]]*)\]\(([^)]*)\)|\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Add preceding plain text
    if (match.index > lastIndex) {
      segments.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      // Link: [text](url)
      segments.push({ type: 'link', text: match[1], url: match[2] });
    } else if (match[3] !== undefined) {
      // Bold+Italic: ***text***
      segments.push({ type: 'boldItalic', text: match[3] });
    } else if (match[4] !== undefined) {
      // Bold: **text**
      segments.push({ type: 'bold', text: match[4] });
    } else if (match[5] !== undefined) {
      // Italic: *text*
      segments.push({ type: 'italic', text: match[5] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({ type: 'text', text: text.slice(lastIndex) });
  }

  return segments;
}

/**
 * Parse markdown text into structured lines for rendering.
 */
export function parseMarkdown(text: string): ParsedLine[] {
  if (!text) return [];

  const lines = text.split('\n');
  const result: ParsedLine[] = [];
  let numberedCount = 0;

  for (const line of lines) {
    // Bullet list
    if (line.startsWith('- ')) {
      numberedCount = 0;
      result.push({
        type: 'bullet',
        segments: parseInline(line.slice(2)),
      });
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      numberedCount++;
      result.push({
        type: 'numbered',
        number: numberedCount,
        segments: parseInline(numMatch[2]),
      });
      continue;
    }

    // Regular paragraph
    numberedCount = 0;
    result.push({
      type: 'paragraph',
      segments: parseInline(line),
    });
  }

  return result;
}
