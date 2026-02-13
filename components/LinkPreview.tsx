import { Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

interface LinkPreviewProps {
  url: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
}

function getDomain(url: string): string {
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
  const domain = getDomain(url);

  function handlePress() {
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url);
    }
  }

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : null}
      <View style={styles.body}>
        {title ? (
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
        ) : null}
        {description ? (
          <Text style={styles.description} numberOfLines={2}>{description}</Text>
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
    height: 160,
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
