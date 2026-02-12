import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { uploadPhoto } from '@/utils/photo';
import { useStore } from '@/data/store';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';

export default function EditProfileScreen() {
  const { user, saveUser } = useStore();
  const router = useRouter();

  const [name, setName] = useState(user?.name ?? '');
  const [image, setImage] = useState(user?.image ?? null);
  const [location, setLocation] = useState(user?.location ?? '');
  const [handicap, setHandicap] = useState(user?.handicap?.toString() ?? '');
  const [homeCourse, setHomeCourse] = useState(user?.homeCourse ?? '');
  const [favoriteBall, setFavoriteBall] = useState(user?.favoriteBall ?? '');

  if (!user) return null;

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const url = await uploadPhoto(result.assets[0].uri, user!.id);
      setImage(url);
    }
  }

  async function handleSave() {
    if (!name.trim()) return;
    await saveUser({
      id: user!.id,
      memberSince: user!.memberSince,
      name: name.trim(),
      image,
      location: location.trim(),
      handicap: handicap ? parseFloat(handicap) : null,
      homeCourse: homeCourse.trim(),
      favoriteBall: favoriteBall.trim(),
    });
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backArrow}>
            <Text style={styles.backArrowText}>{'<'}</Text>
          </Pressable>
          <LetterSpacedHeader text="EDIT PROFILE" size={32} />
        </View>
        <Pressable style={styles.avatarSection} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color={Colors.gray} />
            </View>
          )}
          <Text style={styles.changePhoto}>Change Photo</Text>
        </Pressable>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor={Colors.gray}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. San Francisco, CA"
              placeholderTextColor={Colors.gray}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Handicap</Text>
            <TextInput
              style={styles.input}
              value={handicap}
              onChangeText={setHandicap}
              placeholder="e.g. 12.4"
              placeholderTextColor={Colors.gray}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Home Course</Text>
            <TextInput
              style={styles.input}
              value={homeCourse}
              onChangeText={setHomeCourse}
              placeholderTextColor={Colors.gray}
            />
          </View>

        </View>

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  backArrow: { paddingRight: 12, paddingTop: 4 },
  backArrowText: { fontSize: 24, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 88, height: 88, borderRadius: 4 },
  avatarPlaceholder: { width: 88, height: 88, borderRadius: 4, backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center' },
  changePhoto: { fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, marginTop: 8 },
  form: { gap: 20, marginBottom: 32 },
  field: { gap: 6 },
  label: { fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.black, fontFamily: Fonts!.sans },
  saveButton: { backgroundColor: Colors.black, borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: Colors.white, fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold },
});
