import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

interface ReactionBadgesProps {
  reactions: Record<string, string[]>;
  currentUserId?: string;
  onToggleReaction: (reaction: string) => void;
}

export default function ReactionBadges({ reactions, currentUserId, onToggleReaction }: ReactionBadgesProps) {
  const entries = Object.entries(reactions).filter(([, users]) => users.length > 0);
  if (entries.length === 0) return null;

  return (
    <View style={styles.container}>
      {entries.map(([emoji, userIds]) => {
        const isActive = currentUserId ? userIds.includes(currentUserId) : false;
        return (
          <Pressable
            key={emoji}
            style={[styles.badge, isActive && styles.badgeActive]}
            onPress={() => onToggleReaction(emoji)}
          >
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={[styles.count, isActive && styles.countActive]}>{userIds.length}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  badgeActive: {
    backgroundColor: '#E8E0FF',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  emoji: {
    fontSize: 14,
  },
  count: {
    fontSize: 12,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.darkGray,
  },
  countActive: {
    color: '#8B5CF6',
  },
});
