import { useState, useRef, useCallback } from 'react';
import { TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { TextSelection } from '@/utils/markdown';
import type { PhotoDraft } from '@/components/ImageAttachments';

interface UseRichTextInputOptions {
  maxImages?: number;
  initialText?: string;
}

export default function useRichTextInput({
  maxImages = 5,
  initialText = '',
}: UseRichTextInputOptions = {}) {
  const [text, setText] = useState(initialText);
  const [selection, setSelection] = useState<TextSelection>({ start: 0, end: 0 });
  const [images, setImages] = useState<PhotoDraft[]>([]);
  const inputRef = useRef<TextInput>(null);

  const onSelectionChange = useCallback((sel: TextSelection) => {
    setSelection(sel);
  }, []);

  const handleNativeSelectionChange = useCallback(
    (e: { nativeEvent: { selection: { start: number; end: number } } }) => {
      setSelection(e.nativeEvent.selection);
    },
    [],
  );

  const pickImages = useCallback(async () => {
    const remaining = maxImages - images.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.7,
    });
    if (!result.canceled) {
      const newPhotos = result.assets.slice(0, remaining).map((a) => ({
        uri: a.uri,
        caption: '',
      }));
      setImages((prev) => [...prev, ...newPhotos]);
    }
  }, [images.length, maxImages]);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateCaption = useCallback((index: number, caption: string) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, caption } : img)),
    );
  }, []);

  const clearAll = useCallback(() => {
    setText('');
    setImages([]);
    setSelection({ start: 0, end: 0 });
  }, []);

  return {
    // Text state
    text,
    setText,
    selection,
    onSelectionChange,
    handleNativeSelectionChange,
    inputRef,

    // Image state
    images,
    pickImages,
    removeImage,
    updateCaption,
    maxImages,

    // Convenience
    clearAll,

    // Ready-made props for FormattingToolbar
    toolbarProps: {
      text,
      onChangeText: setText,
      inputRef,
      selection,
      onSelectionChange,
      images,
      onPickImages: pickImages,
      maxImages,
    },

    // Ready-made props for ImageAttachments
    attachmentProps: {
      images,
      onRemove: removeImage,
      onUpdateCaption: updateCaption,
      maxImages,
    },
  };
}
