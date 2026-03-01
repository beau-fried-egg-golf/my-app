import React, { useState, type RefObject } from 'react';
import { View, Pressable, Text, StyleSheet, type TextInput } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { BoldIcon, ItalicIcon, LinkIcon, BulletListIcon, NumberedListIcon, ImageIcon } from './icons/FormattingIcons';
import { wrapSelection, toggleLinePrefix, insertLink, type TextSelection } from '@/utils/markdown';
import LinkPromptModal from './LinkPromptModal';

interface FormattingToolbarProps {
  text: string;
  onChangeText: (text: string) => void;
  inputRef: RefObject<TextInput | null>;
  selection: TextSelection;
  onSelectionChange?: (selection: TextSelection) => void;
  images?: Array<{ uri: string; caption: string }>;
  onPickImages?: () => void;
  maxImages?: number;
  variant?: 'full' | 'compact';
}

export default function FormattingToolbar({
  text,
  onChangeText,
  inputRef,
  selection,
  onSelectionChange,
  images,
  onPickImages,
  maxImages = 5,
  variant = 'full',
}: FormattingToolbarProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);

  const applyWrap = (prefix: string, suffix: string, placeholder: string) => {
    const result = wrapSelection(text, selection, prefix, suffix, placeholder);
    onChangeText(result.text);
    onSelectionChange?.(result.selection);
    inputRef.current?.focus();
  };

  const applyLinePrefix = (prefix: string) => {
    const result = toggleLinePrefix(text, selection, prefix);
    onChangeText(result.text);
    onSelectionChange?.(result.selection);
    inputRef.current?.focus();
  };

  const handleLinkSubmit = (url: string) => {
    setShowLinkModal(false);
    const result = insertLink(text, selection, url);
    onChangeText(result.text);
    onSelectionChange?.(result.selection);
    inputRef.current?.focus();
  };

  const iconSize = variant === 'compact' ? 14 : 16;
  const imageCount = images?.length ?? 0;

  return (
    <>
      <View style={[styles.toolbar, variant === 'compact' && styles.toolbarCompact]}>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={() => applyWrap('**', '**', 'bold')}
        >
          <BoldIcon size={iconSize} color={Colors.black} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={() => applyWrap('*', '*', 'italic')}
        >
          <ItalicIcon size={iconSize} color={Colors.black} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={() => setShowLinkModal(true)}
        >
          <LinkIcon size={iconSize} color={Colors.black} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={() => applyLinePrefix('- ')}
        >
          <BulletListIcon size={iconSize} color={Colors.black} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={() => applyLinePrefix('1. ')}
        >
          <NumberedListIcon size={iconSize} color={Colors.black} />
        </Pressable>

        {onPickImages && (
          <>
            <View style={styles.separator} />
            <Pressable
              style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
              onPress={onPickImages}
              disabled={imageCount >= maxImages}
            >
              <ImageIcon
                size={iconSize}
                color={imageCount >= maxImages ? Colors.gray : Colors.black}
              />
              {imageCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {imageCount}/{maxImages}
                  </Text>
                </View>
              )}
            </Pressable>
          </>
        )}
      </View>

      <LinkPromptModal
        visible={showLinkModal}
        onSubmit={handleLinkSubmit}
        onCancel={() => {
          setShowLinkModal(false);
          inputRef.current?.focus();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 2,
  },
  toolbarCompact: {
    paddingVertical: 2,
  },
  btn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  btnPressed: {
    backgroundColor: Colors.lightGray,
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    backgroundColor: Colors.black,
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  badgeText: {
    fontFamily: Fonts?.sans,
    fontSize: 8,
    color: Colors.white,
  },
});
