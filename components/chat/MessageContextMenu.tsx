import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

const REACTION_OPTIONS = ['❤️', '👍', '👎', '😂', '‼️', '❓'];

interface MessageContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  currentReactions: string[];
  onReaction: (emoji: string) => void;
  onReply: () => void;
  onClose: () => void;
}

export default function MessageContextMenu({
  visible,
  position,
  currentReactions,
  onReaction,
  onReply,
  onClose,
}: MessageContextMenuProps) {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.menu,
            {
              top: Math.max(60, Math.min(position.y - 80, 500)),
              left: Math.max(16, Math.min(position.x - 120, 250)),
            },
          ]}
        >
          {/* Reaction row */}
          <View style={styles.reactionRow}>
            {REACTION_OPTIONS.map((emoji) => {
              const isActive = currentReactions.includes(emoji);
              return (
                <Pressable
                  key={emoji}
                  style={[styles.reactionBtn, isActive && styles.reactionBtnActive]}
                  onPress={() => {
                    onReaction(emoji);
                    onClose();
                  }}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={styles.actionItem}
              onPress={() => {
                onReply();
                onClose();
              }}
            >
              <Text style={styles.actionText}>Reply</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menu: {
    position: 'absolute',
    backgroundColor: Colors.white,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 240,
    overflow: 'hidden',
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  reactionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionBtnActive: {
    backgroundColor: '#E8E0FF',
  },
  reactionEmoji: {
    fontSize: 22,
  },
  actions: {
    paddingVertical: 4,
  },
  actionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 15,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.black,
  },
});
