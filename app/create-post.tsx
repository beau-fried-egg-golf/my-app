import { useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useStore } from '@/data/store';
import { uploadPhoto } from '@/utils/photo';
import { supabase } from '@/data/supabase';
import LinkPreview from '@/components/LinkPreview';
import DetailHeader from '@/components/DetailHeader';
import TutorialPopup from '@/components/TutorialPopup';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { DesktopActionPane } from '@/components/desktop';
import { useActionPane } from '@/hooks/useActionPane';

interface PhotoDraft {
  uri: string;
  caption: string;
}

interface LinkMeta {
  title: string;
  description: string;
  image: string;
}

const URL_REGEX = /https?:\/\/\S+/;

function extractUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  if (!match) return null;
  // Strip trailing punctuation that's unlikely part of the URL
  return match[0].replace(/[.,;:!?)]+$/, '');
}

export default function CreatePostScreen() {
  const router = useRouter();
  const { shareType, shareId, shareTitle, shareDescription, shareImage } = useLocalSearchParams<{
    shareType?: string;
    shareId?: string;
    shareTitle?: string;
    shareDescription?: string;
    shareImage?: string;
  }>();
  const { user, addPost } = useStore();
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const hasShareParams = !!(shareType && shareId);
  const [linkUrl, setLinkUrl] = useState<string | null>(
    hasShareParams ? `app://${shareType}/${shareId}` : null,
  );
  const [linkMeta, setLinkMeta] = useState<LinkMeta | null>(
    hasShareParams
      ? { title: shareTitle ?? '', description: shareDescription ?? '', image: shareImage ?? '' }
      : null,
  );
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [linkDismissed, setLinkDismissed] = useState(false);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const isDesktop = useIsDesktop();
  const { activePane, closeActionPane } = useActionPane();
  const isInline = isDesktop && activePane === 'post';

  if (!user) return null;

  const canSubmit = content.trim() && !submitting;

  const MAX_PHOTOS = 5;

  async function fetchLinkMeta(url: string): Promise<LinkMeta> {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-link-meta', {
        body: { url },
      });
      if (!error && data && (data.title || data.image)) {
        return {
          title: data.title ?? '',
          description: data.description ?? '',
          image: data.image ?? '',
        };
      }
      if (error) console.warn('fetch-link-meta edge function error:', error);
    } catch (e) {
      console.warn('fetch-link-meta call failed:', e);
    }

    // Fallback: noembed for YouTube etc.
    try {
      const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.title && !data.error) {
        return {
          title: data.title,
          description: data.author_name ? `by ${data.author_name} on ${data.provider_name ?? ''}`.trim() : '',
          image: data.thumbnail_url ?? '',
        };
      }
    } catch (e) {
      console.warn('noembed fallback failed:', e);
    }

    return { title: '', description: '', image: '' };
  }

  function handleContentChange(text: string) {
    setContent(text);

    // Skip URL auto-detection when a shared card is attached and not dismissed
    if (hasShareParams && !linkDismissed) return;

    const detected = extractUrl(text);

    if (detected !== linkUrl) {
      setLinkDismissed(false);
      setLinkMeta(null);

      if (detected) {
        setLinkUrl(detected);
        setFetchingMeta(true);

        // Cancel any in-flight fetch
        fetchAbortRef.current?.abort();
        const controller = new AbortController();
        fetchAbortRef.current = controller;

        fetchLinkMeta(detected).then((meta) => {
          if (controller.signal.aborted) return;
          setLinkMeta(meta);
          setFetchingMeta(false);
        }).catch(() => {
          if (controller.signal.aborted) return;
          setFetchingMeta(false);
        });
      } else {
        setLinkUrl(null);
        setFetchingMeta(false);
      }
    }
  }

  function dismissLink() {
    setLinkDismissed(true);
    setLinkMeta(null);
  }

  async function pickPhotos() {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.7,
    });
    if (!result.canceled) {
      const newPhotos = result.assets.slice(0, remaining).map((a) => ({ uri: a.uri, caption: '' }));
      setPhotos([...photos, ...newPhotos]);
    }
  }

  function removePhoto(index: number) {
    setPhotos(photos.filter((_, i) => i !== index));
  }

  function updateCaption(index: number, caption: string) {
    setPhotos(photos.map((p, i) => (i === index ? { ...p, caption } : p)));
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const uploadedPhotos = await Promise.all(
        photos.map(async (p) => ({
          url: await uploadPhoto(p.uri, user!.id),
          caption: p.caption.trim(),
        })),
      );

      const includingLink = linkUrl && !linkDismissed;

      await addPost({
        content: content.trim(),
        photos: uploadedPhotos,
        ...(includingLink && {
          link_url: linkUrl,
          link_title: linkMeta?.title || undefined,
          link_description: linkMeta?.description || undefined,
          link_image: linkMeta?.image || undefined,
        }),
      });
      if (isInline) closeActionPane();
      else router.back();
    } catch (e) {
      console.error('Failed to create post', e);
      setSubmitting(false);
    }
  }

  const showLinkPreview = linkUrl && !linkDismissed;

  const formFields = (
    <>
        <View style={styles.field}>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={handleContentChange}
            placeholder="What's on your mind?"
            placeholderTextColor={Colors.gray}
            multiline
            textAlignVertical="top"
            autoFocus
          />
        </View>

        {showLinkPreview && (
          <View style={styles.linkPreviewSection}>
            {fetchingMeta ? (
              <View style={styles.linkLoading}>
                <ActivityIndicator size="small" color={Colors.gray} />
                <Text style={styles.linkLoadingText}>Loading preview...</Text>
              </View>
            ) : (
              <View>
                <LinkPreview
                  url={linkUrl}
                  title={linkMeta?.title}
                  description={linkMeta?.description}
                  image={linkMeta?.image}
                />
                <Pressable style={styles.dismissButton} onPress={dismissLink}>
                  <Text style={styles.dismissText}>x</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        <View style={styles.photosSection}>
          {photos.length < MAX_PHOTOS && (
            <Pressable style={styles.addPhotoButton} onPress={pickPhotos}>
              <Text style={styles.addPhotoText}>ADD PHOTOS ({photos.length}/{MAX_PHOTOS})</Text>
            </Pressable>
          )}
          {photos.length >= MAX_PHOTOS && (
            <Text style={styles.photoLimitText}>Photo limit reached ({MAX_PHOTOS}/{MAX_PHOTOS})</Text>
          )}
          {photos.map((photo, i) => (
            <View key={i} style={styles.photoItem}>
              <View style={styles.photoRow}>
                <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                <TextInput
                  style={styles.captionInput}
                  value={photo.caption}
                  onChangeText={(text) => updateCaption(i, text)}
                  placeholder="Add a description..."
                  placeholderTextColor={Colors.gray}
                  multiline
                  maxLength={200}
                />
                <Pressable style={styles.removePhoto} onPress={() => removePhoto(i)}>
                  <Text style={styles.removeText}>x</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
    </>
  );

  if (isDesktop) {
    return (
      <DesktopActionPane
        title="COMMUNITY FORUM"
        onClose={() => isInline ? closeActionPane() : router.back()}
        onSubmit={handleSubmit}
        submitLabel={submitting ? 'SUBMITTING...' : 'SUBMIT'}
        submitDisabled={!canSubmit}
      >
        {formFields}
      </DesktopActionPane>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <DetailHeader
        title=""
        right={
          <Pressable
            style={[styles.headerSubmitBtn, !canSubmit && { opacity: 0.4 }]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {formFields}
      </ScrollView>

      <TutorialPopup
        storageKey="tutorial_create_post"
        title="Posting"
        paragraphs={[
          'Posts are for sharing updates, links, photos, and questions with the club.',
          'Joking around is welcome, but harassment of any kind will not be tolerated.',
        ]}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 12 },
  contentInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.black, minHeight: 160, lineHeight: 24, fontFamily: Fonts!.sans, backgroundColor: Colors.white },
  linkPreviewSection: { marginBottom: 12 },
  linkLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  linkLoadingText: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray },
  dismissButton: { position: 'absolute', top: 16, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dismissText: { color: Colors.white, fontSize: 14, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, lineHeight: 16 },
  photosSection: { marginBottom: 24, gap: 12 },
  addPhotoButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  addPhotoText: { fontSize: 15, fontFamily: Fonts!.sansMedium, fontWeight: FontWeights.medium, color: Colors.black },
  photoItem: { borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 8, padding: 8 },
  photoRow: { flexDirection: 'row', gap: 10 },
  photoThumb: { width: 72, height: 72, borderRadius: 6 },
  captionInput: { flex: 1, fontSize: 16, color: Colors.black, paddingVertical: 4, lineHeight: 20, fontFamily: Fonts!.sans, outlineStyle: 'none' } as any,
  removePhoto: { alignSelf: 'flex-start' },
  removeText: { fontSize: 18, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  photoLimitText: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray, paddingVertical: 8 },
  headerSubmitBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.orange, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
});
