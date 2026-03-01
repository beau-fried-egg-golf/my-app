import React from 'react';
import { Text, StyleSheet, Linking, type TextStyle } from 'react-native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { parseMarkdown, type TextSegment, type ParsedLine } from '@/utils/markdown';

interface FormattedTextProps {
  children: string;
  style?: TextStyle;
  numberOfLines?: number;
  linkColor?: string;
}

function renderSegments(
  segments: TextSegment[],
  linkColor: string,
): React.ReactNode[] {
  return segments.map((seg, i) => {
    switch (seg.type) {
      case 'bold':
        return (
          <Text key={i} style={styles.bold}>
            {seg.text}
          </Text>
        );
      case 'italic':
        return (
          <Text key={i} style={styles.italic}>
            {seg.text}
          </Text>
        );
      case 'boldItalic':
        return (
          <Text key={i} style={[styles.bold, styles.italic]}>
            {seg.text}
          </Text>
        );
      case 'link':
        return (
          <Text
            key={i}
            style={[styles.link, { color: linkColor }]}
            onPress={() => {
              if (seg.url) Linking.openURL(seg.url);
            }}
          >
            {seg.text}
          </Text>
        );
      default:
        return <Text key={i}>{seg.text}</Text>;
    }
  });
}

function renderLine(
  line: ParsedLine,
  index: number,
  linkColor: string,
): React.ReactNode {
  const content = renderSegments(line.segments, linkColor);

  switch (line.type) {
    case 'bullet':
      return (
        <Text key={index} style={styles.listLine}>
          {'  \u2022  '}
          {content}
        </Text>
      );
    case 'numbered':
      return (
        <Text key={index} style={styles.listLine}>
          {`  ${line.number}.  `}
          {content}
        </Text>
      );
    default:
      return <Text key={index}>{content}</Text>;
  }
}

export default function FormattedText({
  children,
  style,
  numberOfLines,
  linkColor = Colors.orange,
}: FormattedTextProps) {
  if (!children) return null;

  // Check if text contains any markdown syntax — fast path for plain text
  if (!/[*[\]\-]/.test(children) && !/^\d+\.\s/m.test(children)) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {children}
      </Text>
    );
  }

  const parsed = parseMarkdown(children);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parsed.map((line, i) => {
        const node = renderLine(line, i, linkColor);
        // Add newlines between lines (but not after the last one)
        if (i < parsed.length - 1) {
          return (
            <Text key={i}>
              {node}
              {'\n'}
            </Text>
          );
        }
        return node;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  bold: {
    fontFamily: Fonts?.sansBold,
    fontWeight: FontWeights.bold,
  },
  italic: {
    fontStyle: 'italic',
  },
  link: {
    textDecorationLine: 'underline',
  },
  listLine: {
    // Inherits parent text style
  },
});
