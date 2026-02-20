import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontWeights } from '@/constants/theme';

interface DesktopActionPaneProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
}

const TEXT_LINE_HEIGHT = 18;
const SCROLL_GAP = 14;

function SubmitButton({ onPress, label, disabled }: { onPress: () => void; label: string; disabled?: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;

  function onHoverIn() {
    if (disabled) return;
    Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: false }).start();
  }
  function onHoverOut() {
    Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: false }).start();
  }

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(TEXT_LINE_HEIGHT + SCROLL_GAP)],
  });

  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.black, Colors.orange],
  });

  return (
    <View style={styles.footer}>
      <Animated.View style={[styles.submitBtn, { backgroundColor: bgColor }, disabled && styles.submitBtnDisabled]}>
        <Pressable
          onPress={onPress}
          disabled={disabled}
          onHoverIn={onHoverIn}
          onHoverOut={onHoverOut}
          style={styles.submitBtnInner}
        >
          <View style={{ height: TEXT_LINE_HEIGHT }}>
            <Animated.View style={{ transform: [{ translateY }] }}>
              <Text style={styles.submitText}>{label}</Text>
              <View style={{ height: SCROLL_GAP }} />
              <Text style={[styles.submitText, { color: Colors.black }]}>{label}</Text>
            </Animated.View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function DesktopActionPane({
  title,
  children,
  onClose,
  onSubmit,
  submitLabel,
  submitDisabled,
}: DesktopActionPaneProps) {
  const slideAnim = useRef(new Animated.Value(660)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, []);

  function close() {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 660,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onClose();
    });
  }

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      <Animated.View
        style={[styles.pane, { transform: [{ translateX: slideAnim }] }]}
      >
        <View style={[styles.header, !title && styles.headerNoTitle]}>
          {!!title && <Text style={styles.title}>{title}</Text>}
          <Pressable onPress={close} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.black} />
          </Pressable>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>

        {onSubmit && (
          <SubmitButton
            onPress={onSubmit}
            label={submitLabel ?? 'SUBMIT'}
            disabled={submitDisabled}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
  } as any,
  pane: {
    width: 620,
    margin: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.black,
    backgroundColor: Colors.cream,
    shadowColor: '#000',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerNoTitle: {
    justifyContent: 'flex-end',
    borderBottomWidth: 0,
  },
  title: {
    fontSize: 14,
    fontFamily: Fonts!.sansMedium,
    fontWeight: FontWeights.medium,
    color: Colors.black,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  submitBtn: {
    backgroundColor: Colors.black,
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitBtnInner: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitText: {
    fontSize: 14,
    fontFamily: Fonts!.sans,
    fontWeight: FontWeights.regular,
    color: Colors.white,
    letterSpacing: 0.5,
    lineHeight: TEXT_LINE_HEIGHT,
  },
});
