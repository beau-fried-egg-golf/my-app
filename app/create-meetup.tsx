import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { uploadPhoto } from '@/utils/photo';

export default function CreateMeetupScreen() {
  const router = useRouter();
  const { user, createMeetup } = useStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [meetupDate, setMeetupDate] = useState('');
  const [cost, setCost] = useState('Free');
  const [totalSlots, setTotalSlots] = useState('4');
  const [hostTakesSlot, setHostTakesSlot] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const canSubmit = name.trim() && locationName.trim() && meetupDate && !submitting;

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageUri) {
        imageUrl = await uploadPhoto(imageUri, user!.id);
      }

      await createMeetup({
        name: name.trim(),
        description: description.trim(),
        location_name: locationName.trim(),
        meetup_date: new Date(meetupDate).toISOString(),
        cost: cost.trim() || 'Free',
        total_slots: parseInt(totalSlots, 10) || 4,
        host_takes_slot: hostTakesSlot,
        image: imageUrl,
      });
      router.back();
    } catch (e) {
      console.error('Failed to create meetup', e);
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.imageSection} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>ADD IMAGE</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.field}>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Meetup Name *"
            placeholderTextColor={Colors.gray}
          />
        </View>

        <View style={styles.field}>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Description (optional)"
            placeholderTextColor={Colors.gray}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <TextInput
            style={styles.locationInput}
            value={locationName}
            onChangeText={setLocationName}
            placeholder="Location *"
            placeholderTextColor={Colors.gray}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Date & Time *</Text>
          {Platform.OS === 'web' ? (
            <input
              type="datetime-local"
              value={meetupDate}
              onChange={(e: any) => setMeetupDate(e.target.value)}
              style={{
                border: `1px solid ${Colors.border}`,
                borderRadius: 8,
                padding: '12px 14px',
                fontSize: 16,
                fontFamily: Fonts!.sans,
                color: Colors.black,
                width: '100%',
                boxSizing: 'border-box' as const,
              }}
            />
          ) : (
            <TextInput
              style={styles.locationInput}
              value={meetupDate}
              onChangeText={setMeetupDate}
              placeholder="YYYY-MM-DDTHH:MM"
              placeholderTextColor={Colors.gray}
            />
          )}
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <TextInput
              style={styles.locationInput}
              value={cost}
              onChangeText={setCost}
              placeholder="Cost (e.g. Free, $25)"
              placeholderTextColor={Colors.gray}
            />
          </View>
          <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
            <TextInput
              style={styles.locationInput}
              value={totalSlots}
              onChangeText={setTotalSlots}
              placeholder="Total Slots"
              placeholderTextColor={Colors.gray}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Host takes a slot</Text>
          <Switch
            value={hostTakesSlot}
            onValueChange={setHostTakesSlot}
            trackColor={{ false: Colors.lightGray, true: Colors.orange }}
            thumbColor={Colors.white}
          />
        </View>

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.submitButtonText}>{submitting ? 'Creating...' : 'Create Meetup'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 16, paddingBottom: 40 },
  imageSection: { alignItems: 'center', marginBottom: 20 },
  imagePreview: { width: 120, height: 120, borderRadius: 12 },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 11,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.gray,
    textAlign: 'center',
  },
  field: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 13,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.gray,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.black,
    minHeight: 100,
    lineHeight: 24,
    fontFamily: Fonts!.sans,
  },
  locationInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Fonts!.sans,
    color: Colors.black,
  },
  fieldRow: {
    flexDirection: 'row',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.black,
  },
  submitButton: { backgroundColor: Colors.orange, borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: { color: Colors.white, fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold },
});
