import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

interface Member {
  user_id: string;
  user_name?: string;
  user_image?: string | null;
}

interface MentionAutocompleteProps {
  query: string;
  members: Member[];
  onSelect: (name: string) => void;
}

export default function MentionAutocomplete({ query, members, onSelect }: MentionAutocompleteProps) {
  if (!query) return null;

  const filtered = members
    .filter(m => m.user_name?.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);

  if (filtered.length === 0) return null;

  return (
    <View style={styles.container}>
      {filtered.map((member) => (
        <Pressable
          key={member.user_id}
          style={styles.item}
          onPress={() => onSelect(member.user_name ?? 'Member')}
        >
          {member.user_image ? (
            <Image source={{ uri: member.user_image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={12} color={Colors.gray} />
            </View>
          )}
          <Text style={styles.name}>{member.user_name ?? 'Member'}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    maxHeight: 200,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.black,
  },
});
