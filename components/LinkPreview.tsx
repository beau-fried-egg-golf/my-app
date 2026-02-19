import { useState } from 'react';
import { Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

function isInAppUrl(url: string): boolean {
  return url.startsWith('app://');
}

function parseInAppUrl(url: string): { type: string; id: string } | null {
  if (!isInAppUrl(url)) return null;
  const path = url.replace('app://', '');
  const [type, id] = path.split('/');
  if (type && id) return { type, id };
  return null;
}

interface LinkPreviewProps {
  url: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function getDomain(url: string): string {
  if (isInAppUrl(url)) {
    const parsed = parseInAppUrl(url);
    if (parsed?.type === 'writeup') return 'Review';
    if (parsed?.type === 'group') return 'Group';
    if (parsed?.type === 'meetup') return 'Meetup';
    return '';
  }
  try {
    const host = new URL(url).hostname.replace('www.', '');
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube';
    if (host.includes('twitter.com') || host.includes('x.com')) return 'X';
    if (host.includes('instagram.com')) return 'Instagram';
    return host;
  } catch {
    return '';
  }
}

export default function LinkPreview({ url, title, description, image }: LinkPreviewProps) {
  const router = useRouter();
  const domain = getDomain(url);
  const [aspectRatio, setAspectRatio] = useState(1.91); // default OG image ratio (1200x630)

  function handlePress() {
    const parsed = parseInAppUrl(url);
    if (parsed) {
      router.push(`/${parsed.type}/${parsed.id}`);
      return;
    }
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url);
    }
  }

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      {image ? (
        <Image
          source={{ uri: image }}
          style={[styles.image, { aspectRatio }]}
          onLoad={(e) => {
            const source = e.nativeEvent?.source ?? e.nativeEvent;
            const width = source?.width;
            const height = source?.height;
            if (width && height) setAspectRatio(width / height);
          }}
        />
      ) : null}
      <View style={styles.body}>
        {title ? (
          <Text style={styles.title} numberOfLines={2}>{decodeEntities(title)}</Text>
        ) : null}
        {description ? (
          <Text style={styles.description} numberOfLines={2}>{decodeEntities(description)}</Text>
        ) : null}
        {domain ? (
          <Text style={styles.domain}>{domain}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 8,
  },
  image: {
    width: '100%',
  },
  body: {
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontFamily: Fonts!.sansBold,
    fontWeight: FontWeights.bold,
    color: Colors.black,
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    fontFamily: Fonts!.sans,
    color: Colors.darkGray,
    lineHeight: 18,
    marginTop: 4,
  },
  domain: {
    fontSize: 12,
    fontFamily: Fonts!.sans,
    color: Colors.gray,
    marginTop: 6,
  },
});
