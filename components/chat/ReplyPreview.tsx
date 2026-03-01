import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { stripMarkdown } from '@/utils/markdown';

interface ReplyPreviewBubbleProps {
  senderName: string;
  content: string;
  isOwn: boolean;
}

/** Shown inside a message bubble above the reply content */
export function ReplyPreviewBubble({ senderName, content, isOwn }: ReplyPreviewBubbleProps) {
  return (
    <View style={[styles.bubblePreview, isOwn ? styles.bubblePreviewOwn : styles.bubblePreviewOther]}>
      <Text style={[styles.previewName, isOwn ? styles.previewNameOwn : styles.previewNameOther]} numberOfLines={1}>
        {senderName}
      </Text>
      <Text style={[styles.previewContent, isOwn ? styles.previewContentOwn : styles.previewContentOther]} numberOfLines={2}>
        {stripMarkdown(content)}
      </Text>
    </View>
  );
}

interface ReplyPreviewBarProps {
  senderName: string;
  content: string;
  onCancel: () => void;
}

/** Shown above input bar when composing a reply */
export function ReplyPreviewBar({ senderName, content, onCancel }: ReplyPreviewBarProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.barAccent} />
      <View style={styles.barContent}>
        <Text style={styles.barName} numberOfLines={1}>Replying to {senderName}</Text>
        <Text style={styles.barText} numberOfLines={1}>{stripMarkdown(content)}</Text>
      </View>
      <Pressable onPress={onCancel} style={styles.barClose}>
        <Ionicons name="close" size={18} color={Colors.gray} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // In-bubble preview
  bubblePreview: {
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
  },
  bubblePreviewOwn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderLeftColor: 'rgba(255,255,255,0.4)',
  },
  bubblePreviewOther: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderLeftColor: Colors.gray,
  },
  previewName: {
    fontSize: 12,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    marginBottom: 2,
  },
  previewNameOwn: { color: 'rgba(255,255,255,0.7)' },
  previewNameOther: { color: Colors.gray },
  previewContent: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
  },
  previewContentOwn: { color: 'rgba(255,255,255,0.6)' },
  previewContentOther: { color: Colors.gray },

  // Input bar variant
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  barAccent: {
    width: 3,
    height: '100%',
    minHeight: 32,
    backgroundColor: Colors.black,
    borderRadius: 2,
    marginRight: 10,
  },
  barContent: {
    flex: 1,
  },
  barName: {
    fontSize: 13,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  barText: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginTop: 1,
  },
  barClose: {
    padding: 6,
  },
});
