import React from 'react';
import { View, Image, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export interface PhotoDraft {
  uri: string;
  caption: string;
}

interface ImageAttachmentsProps {
  images: PhotoDraft[];
  onRemove: (index: number) => void;
  onUpdateCaption?: (index: number, caption: string) => void;
  showCaptions?: boolean;
  maxImages?: number;
}

export default function ImageAttachments({
  images,
  onRemove,
  onUpdateCaption,
  showCaptions = false,
  maxImages = 5,
}: ImageAttachmentsProps) {
  if (images.length === 0) return null;

  return (
    <View style={styles.container}>
      {images.map((photo, i) => (
        <View key={i} style={styles.photoItem}>
          <View style={styles.photoRow}>
            <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
            {showCaptions && onUpdateCaption && (
              <TextInput
                style={styles.captionInput}
                value={photo.caption}
                onChangeText={(text) => onUpdateCaption(i, text)}
                placeholder="Add a description..."
                placeholderTextColor={Colors.gray}
                multiline
                maxLength={200}
              />
            )}
            <Pressable style={styles.removeBtn} onPress={() => onRemove(i)}>
              <Text style={styles.removeText}>x</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Display photos attached to a saved message/reply (read-only, with optional captions).
 */
export function PhotoGrid({
  photos,
}: {
  photos: Array<{ url: string; caption?: string }>;
}) {
  if (!photos || photos.length === 0) return null;

  return (
    <View style={styles.grid}>
      {photos.map((photo, i) => (
        <View key={i} style={styles.gridItem}>
          <Image source={{ uri: photo.url }} style={styles.gridImage} />
          {photo.caption ? (
            <Text style={styles.gridCaption} numberOfLines={2}>
              {photo.caption}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  photoItem: {
    // Individual photo draft item
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  photoThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
  },
  captionInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts?.sans,
    color: Colors.black,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    minHeight: 40,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    fontSize: 14,
    color: Colors.darkGray,
    fontFamily: Fonts?.sans,
  },
  // Read-only photo grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  gridItem: {
    // Individual grid item
  },
  gridImage: {
    width: 120,
    height: 90,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
  },
  gridCaption: {
    fontSize: 12,
    fontFamily: Fonts?.sans,
    color: Colors.darkGray,
    marginTop: 2,
    maxWidth: 120,
  },
});
