import { useEffect } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { Group } from '@/types';

function GroupRow({ item, onPress }: { item: Group; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.groupImage} />
      ) : (
        <View style={styles.groupImagePlaceholder}>
          <Ionicons name="people" size={22} color={Colors.gray} />
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupMeta}>
          {item.member_count ?? 0} member{(item.member_count ?? 0) !== 1 ? 's' : ''}
          {item.home_course_name ? ` · ${item.home_course_name}` : ''}
          {item.location_name ? ` · ${item.location_name}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

export default function GroupsScreen() {
  const { groups, loadGroups, session } = useStore();
  const router = useRouter();

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const myGroups = groups.filter(g => g.is_member);
  const discoverGroups = groups.filter(g => !g.is_member);

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            <Pressable style={styles.createBtn} onPress={() => router.push('/create-group')}>
              <Text style={styles.createBtnText}>CREATE GROUP</Text>
            </Pressable>

            {myGroups.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>MY GROUPS</Text>
                {myGroups.map(g => (
                  <GroupRow key={g.id} item={g} onPress={() => router.push(`/group/${g.id}`)} />
                ))}
                <View style={styles.sectionSpacer} />
              </>
            )}

            {discoverGroups.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>DISCOVER</Text>
                {discoverGroups.map(g => (
                  <GroupRow key={g.id} item={g} onPress={() => router.push(`/group/${g.id}`)} />
                ))}
              </>
            )}

            {groups.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={48} color={Colors.lightGray} />
                <Text style={styles.emptyTitle}>No groups yet</Text>
                <Text style={styles.emptyText}>
                  Create a group to connect with other golfers
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
  groupImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  groupImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1, marginLeft: 12 },
  groupName: {
    fontSize: 16,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  groupMeta: {
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
