import { useRef } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import FormattedText from '@/components/FormattedText';
import ReactionBadges from './ReactionBadges';
import { ReplyPreviewBubble } from './ReplyPreview';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Render @Name mentions as bold text */
function renderContent(content: string, isOwn: boolean) {
  const parts = content.split(/(@\w+(?:\s\w+)?\s)/g);
  if (parts.length === 1) {
    return (
      <Text style={[styles.bubbleText, isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther]}>
        {content}
      </Text>
    );
  }

  return (
    <Text style={[styles.bubbleText, isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther]}>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <Text key={i} style={[styles.mention, isOwn ? styles.mentionOwn : styles.mentionOther]}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

interface MessageBubbleProps {
  message: {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    sender_name?: string;
    reactions?: Record<string, string[]>;
    reply_to?: { id: string; content: string; user_id: string; sender_name?: string } | null;
    photos?: Array<{ url: string; caption?: string }>;
  };
  isOwn: boolean;
  showSenderName: boolean;
  currentUserId?: string;
  onLongPress: (messageId: string, position: { x: number; y: number }) => void;
  onToggleReaction: (messageId: string, reaction: string) => void;
  getUserName: (userId: string) => string;
}

export default function MessageBubble({
  message,
  isOwn,
  showSenderName,
  currentUserId,
  onLongPress,
  onToggleReaction,
  getUserName,
}: MessageBubbleProps) {
  const bubbleRef = useRef<View>(null);

  const handleLongPress = () => {
    bubbleRef.current?.measureInWindow((x, y, width, height) => {
      onLongPress(message.id, { x: x + width / 2, y: y });
    });
  };

  const handleContextMenu = (e: any) => {
    if (Platform.OS === 'web') {
      e.preventDefault?.();
      onLongPress(message.id, { x: e.nativeEvent?.pageX ?? 200, y: e.nativeEvent?.pageY ?? 200 });
    }
  };

  return (
    <View style={[styles.bubbleWrapper, isOwn ? styles.bubbleWrapperOwn : styles.bubbleWrapperOther]}>
      {showSenderName && (
        <Text style={styles.senderName}>{message.sender_name ?? 'Member'}</Text>
      )}
      <Pressable
        ref={bubbleRef as any}
        onLongPress={handleLongPress}
        delayLongPress={300}
        {...(Platform.OS === 'web' ? { onContextMenu: handleContextMenu } : {})}
      >
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          {message.reply_to && (
            <ReplyPreviewBubble
              senderName={message.reply_to.sender_name ?? 'Member'}
              content={message.reply_to.content}
              isOwn={isOwn}
            />
          )}
          {renderContent(message.content, isOwn)}
          {message.photos && message.photos.length > 0 && (
            <View style={styles.photoContainer}>
              {message.photos.map((photo, i) => (
                <Image key={i} source={{ uri: photo.url }} style={styles.photoThumb} />
              ))}
            </View>
          )}
          <Text style={[styles.bubbleTime, isOwn ? styles.bubbleTimeOwn : styles.bubbleTimeOther]}>
            {formatTime(message.created_at)}
          </Text>
        </View>
      </Pressable>
      {message.reactions && Object.keys(message.reactions).length > 0 && (
        <ReactionBadges
          reactions={message.reactions}
          currentUserId={currentUserId}
          onToggleReaction={(reaction) => onToggleReaction(message.id, reaction)}
          getUserName={getUserName}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleWrapper: {
    marginBottom: 8,
  },
  bubbleWrapperOwn: {
    alignItems: 'flex-end',
  },
  bubbleWrapperOther: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.gray,
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    maxWidth: 280,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleOwn: {
    backgroundColor: Colors.black,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.lightGray,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 21, fontFamily: Fonts!.sans },
  bubbleTextOwn: { color: Colors.white },
  bubbleTextOther: { color: Colors.black },
  bubbleTime: { fontSize: 11, marginTop: 4, fontFamily: Fonts!.sans },
  bubbleTimeOwn: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' as const },
  bubbleTimeOther: { color: Colors.gray },
  mention: {
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
  },
  mentionOwn: { color: Colors.white },
  mentionOther: { color: Colors.black },
  photoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  photoThumb: {
    width: 100,
    height: 75,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
  },
});
