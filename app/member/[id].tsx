import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profiles, writeups } = useStore();

  const profile = profiles.find((p) => p.id === id);

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Member not found</Text>
      </View>
    );
  }

  const memberWriteups = writeups.filter((w) => w.user_id === profile.id);
  const totalUpvotes = memberWriteups.reduce((sum, w) => sum + (w.upvote_count ?? 0), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        {profile.image ? (
          <Image source={{ uri: profile.image }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color={Colors.gray} />
          </View>
        )}
        <Text style={styles.name}>{profile.name}</Text>
        {profile.location ? <Text style={styles.location}>{profile.location}</Text> : null}
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{memberWriteups.length}</Text>
          <Text style={styles.statLabel}>Writeups</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalUpvotes}</Text>
          <Text style={styles.statLabel}>Upvotes</Text>
        </View>
      </View>

      <View style={styles.details}>
        {profile.handicap !== null && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Handicap</Text>
            <Text style={styles.detailValue}>{profile.handicap}</Text>
          </View>
        )}
        {profile.home_course ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Home Course</Text>
            <Text style={styles.detailValue}>{profile.home_course}</Text>
          </View>
        ) : null}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Member Since</Text>
          <Text style={styles.detailValue}>
            {new Date(profile.member_since).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 24 },
  emptyText: { fontSize: 15, color: Colors.gray, textAlign: 'center', marginTop: 40, fontFamily: Fonts!.sans },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 88, height: 88, borderRadius: 4, borderWidth: 2, borderColor: Colors.black },
  avatarPlaceholder: {
    width: 88, height: 88, borderRadius: 4,
    borderWidth: 2, borderColor: Colors.black,
    backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 22, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, marginTop: 12 },
  location: { fontSize: 14, color: Colors.gray, marginTop: 2, fontFamily: Fonts!.sans },
  stats: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginBottom: 24, paddingVertical: 16,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.lightGray,
  },
  statItem: { alignItems: 'center', paddingHorizontal: 32 },
  statValue: { fontSize: 20, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  statLabel: { fontSize: 12, color: Colors.gray, marginTop: 2, fontFamily: Fonts!.sans },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.lightGray },
  details: { gap: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 15, color: Colors.gray, fontFamily: Fonts!.sans },
  detailValue: { fontSize: 15, fontFamily: Fonts!.sansMedium, fontWeight: FontWeights.medium, color: Colors.black },
});
