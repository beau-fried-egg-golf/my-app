import { useEffect } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Meetup } from '@/types';

function formatMeetupDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    + ' · '
    + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function MeetupRow({ item, onPress }: { item: Meetup; onPress: () => void }) {
  const slotsRemaining = item.total_slots - (item.member_count ?? 0);
  return (
    <Pressable style={styles.row} onPress={onPress}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.meetupImage} />
      ) : (
        <View style={styles.meetupImagePlaceholder}>
          <Ionicons name="calendar" size={22} color={Colors.gray} />
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.meetupName}>{item.name}</Text>
        <Text style={styles.meetupMeta}>
          {formatMeetupDate(item.meetup_date)}
        </Text>
        <Text style={styles.meetupMeta}>
          {item.location_name} · {slotsRemaining} spot{slotsRemaining !== 1 ? 's' : ''} left · {item.cost}
        </Text>
      </View>
    </Pressable>
  );
}

export default function MeetupsScreen() {
  const { meetups, loadMeetups } = useStore();
  const router = useRouter();

  useEffect(() => {
    loadMeetups();
  }, [loadMeetups]);

  const myMeetups = meetups.filter(m => m.is_member);
  const upcomingMeetups = meetups.filter(m => !m.is_member && new Date(m.meetup_date) > new Date());

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            <Pressable style={styles.createBtn} onPress={() => router.push('/create-meetup')}>
              <Text style={styles.createBtnText}>CREATE MEETUP</Text>
            </Pressable>

            {myMeetups.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>MY MEETUPS</Text>
                {myMeetups.map(m => (
                  <MeetupRow key={m.id} item={m} onPress={() => router.push(`/meetup/${m.id}`)} />
                ))}
                <View style={styles.sectionSpacer} />
              </>
            )}

            {upcomingMeetups.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>UPCOMING</Text>
                {upcomingMeetups.map(m => (
                  <MeetupRow key={m.id} item={m} onPress={() => router.push(`/meetup/${m.id}`)} />
                ))}
              </>
            )}

            {meetups.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="calendar-outline" size={48} color={Colors.lightGray} />
                <Text style={styles.emptyTitle}>No meetups yet</Text>
                <Text style={styles.emptyText}>
                  Create a meetup to get together with other golfers
                </Text>
              </View>
            )}
          </>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  list: { paddingBottom: 40 },
  createBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: Colors.orange,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.gray,
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionSpacer: { height: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  meetupImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  meetupImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1, marginLeft: 12 },
  meetupName: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  meetupMeta: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    textAlign: 'center',
  },
});
